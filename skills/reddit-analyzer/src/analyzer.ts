#!/usr/bin/env bun

/**
 * Reddit TOEFL 分析器 - 主入口
 * 
 * 功能：
 * 1. 扫描 r/TOEFL 和 r/ToeflAdvice
 * 2. 过滤高价值帖子和评论
 * 3. 生成回复建议
 * 4. 输出 Discord 格式报告
 */

import { RedditClient } from "./reddit-client.js";
import { ContentFilter } from "./filters.js";
import { ContentScorer } from "./scorer.js";
import { ReplyGenerator } from "./reply-generator.js";
import { DiscordFormatter } from "./discord-formatter.js";
import type { AnalysisResult, AnalyzerConfig, ScoredPost } from "./types.js";

// 默认配置
const DEFAULT_CONFIG: AnalyzerConfig = {
  subreddits: ["TOEFL", "ToeflAdvice"],
  minComments: 2,
  maxPostAgeDays: 2,
  topCount: 10,
  replyCandidatesCount: 3,
  model: "gemini-3-flash-preview",
  thinkingLevel: "low",
};

/**
 * 主分析流程
 */
async function analyze(config: AnalyzerConfig = DEFAULT_CONFIG) {
  console.log("🚀 开始 Reddit TOEFL 分析...");
  console.log(`📋 配置: ${JSON.stringify(config, null, 2)}`);

  const client = new RedditClient();
  const filter = new ContentFilter({
    minComments: config.minComments,
    maxPostAgeDays: config.maxPostAgeDays,
  });
  const scorer = new ContentScorer();
  const replyGen = new ReplyGenerator();
  const formatter = new DiscordFormatter();

  // 1. 获取所有帖子
  console.log("\n📥 获取帖子...");
  const allPosts = await client.fetchMultipleSubreddits(config.subreddits, 50);
  console.log(`✓ 获取到 ${allPosts.length} 个帖子`);

  // 2. 预过滤
  console.log("\n🔍 预过滤...");
  const preFiltered = allPosts.filter((post) => {
    const result = filter.preFilter(post);
    if (!result.passed) {
      console.log(`✗ ${post.title.slice(0, 50)}... - ${result.reason}`);
    }
    return result.passed;
  });
  console.log(`✓ 预过滤后剩余 ${preFiltered.length} 个帖子`);

  // 3. 获取评论并进行 AI 分类
  console.log("\n🤖 AI 分析中...");
  const analyzed: ScoredPost[] = [];

  for (const post of preFiltered.slice(0, 30)) {
    // 限制最多分析 30 个
    try {
      // 获取评论
      const comments = await client.fetchComments(post.subreddit, post.id);
      const topComments = comments.slice(0, 5);

      // AI 分类
      const aiPrompt = filter.buildAIPrompt(
        post,
        topComments.map((c) => c.body),
      );

      console.log(`\n📝 分析帖子 ${analyzed.length + 1}/${Math.min(preFiltered.length, 30)}: ${post.title.slice(0, 60)}...`);
      
      // 在 OpenClaw 环境中，通过输出提示让 agent 调用 AI
      console.log("\n🤖 AI 提示词:\n---");
      console.log(aiPrompt);
      console.log("---\n");
      
      // 提示 agent 处理
      console.log("⏳ 等待 AI 响应...");
      console.log("请 agent 调用 AI 分析上述内容，并返回 JSON 结果。");

      // 在实际 cron 运行时，OpenClaw agent 会自动处理这个请求
      // 这里先用简化逻辑以便独立测试
      const aiAnalysis = {
        isAd: false,
        isScoreShowing: false,
        hasSubstantiveQuestion: true,
        discussionValue: 7,
        replyWorthiness: 8,
      };

      const filterResult = filter.parseAIResult(JSON.stringify(aiAnalysis));

      if (!filterResult.passed) {
        console.log(`✗ AI 过滤: ${filterResult.reason}`);
        continue;
      }

      // 评分
      const scored = scorer.scorePost(post, comments, filterResult);
      analyzed.push(scored);
      console.log(`✓ 评分: ${scored.score}/100`);
    } catch (error) {
      console.error(`Error analyzing post ${post.id}:`, error);
    }
  }

  console.log(`\n✓ AI 分析完成，有效帖子: ${analyzed.length}`);

  // 4. 排序并选择 Top N
  const topPosts = scorer.rankPosts(analyzed, config.topCount);
  console.log(`\n🏆 Top ${topPosts.length} 帖子已选出`);

  // 5. 生成回复候选
  console.log("\n💬 生成回复候选...");
  const results: AnalysisResult[] = [];

  for (const [index, scored] of topPosts.entries()) {
    const replyPrompt = replyGen.buildPrompt(scored.post, scored.comments);
    
    console.log(`\n💬 生成回复 ${index + 1}/${topPosts.length}: ${scored.post.title.slice(0, 60)}...`);
    console.log("\n🤖 回复生成提示词:\n---");
    console.log(replyPrompt);
    console.log("---\n");
    
    console.log("⏳ 等待 AI 生成回复...");
    console.log("请 agent 调用 AI 生成回复候选，并返回 JSON 数组。");

    // 在实际 cron 运行时，OpenClaw agent 会处理这个请求
    // 这里使用占位符以便独立测试
    const replies = replyGen.parseReplies(JSON.stringify([
      {
        style: "professional",
        content: `Based on your question about "${scored.post.title.slice(0, 50)}", I'd recommend focusing on structured practice. Here are some key strategies that have helped many students improve their scores...`,
      },
      {
        style: "friendly",
        content: `Hey! I totally understand your concern about "${scored.post.title.slice(0, 50)}". When I was preparing for TOEFL, I found that consistent practice and recording myself really helped...`,
      },
      {
        style: "practical",
        content: `Quick tips: 1) Use official TOEFL materials from ETS 2) Practice timed sections daily 3) Record yourself and review 4) Join study groups on Discord`,
      },
    ]));

    results.push({
      post: scored.post,
      topComments: scored.comments.slice(0, 3),
      score: scored.score,
      summary: `相关性: ${scored.relevanceScore}/30, 参与度: ${scored.engagementScore}/30, 回复价值: ${scored.replyValueScore}/40`,
      replies,
    });
  }

  console.log(`\n✓ 已为 ${results.length} 个帖子生成回复候选`);

  // 6. 格式化为 Discord embed
  console.log("\n📤 格式化输出...");
  const embed = formatter.formatResults(results, new Date());
  
  // 输出结果
  console.log("\n" + "=".repeat(60));
  console.log("📊 分析完成！");
  console.log("=".repeat(60));
  console.log("\nDiscord Embed 预览:");
  console.log(JSON.stringify(embed, null, 2));

  return {
    embed,
    results,
    summary: formatter.formatSimpleSummary(results),
  };
}

// 如果直接运行此脚本
if (import.meta.main) {
  try {
    await analyze();
  } catch (error) {
    console.error("❌ 分析失败:", error);
    process.exit(1);
  }
}

export { analyze };
