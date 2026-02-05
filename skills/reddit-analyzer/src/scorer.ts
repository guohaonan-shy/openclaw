import type { RedditPost, RedditComment, ScoredPost, FilterResult } from "./types.js";

export class ContentScorer {
  /**
   * 计算相关性分数 (0-30)
   */
  calculateRelevanceScore(post: RedditPost): number {
    let score = 0;

    // 关键问题词 (+10)
    const questionWords = ["how", "why", "what", "tips", "advice", "help", "recommend"];
    const lowerTitle = post.title.toLowerCase();
    const lowerText = post.selftext.toLowerCase();

    for (const word of questionWords) {
      if (lowerTitle.includes(word) || lowerText.includes(word)) {
        score += 10;
        break;
      }
    }

    // TOEFL 核心话题 (+20)
    const coreTopics = [
      "speaking",
      "writing",
      "reading",
      "listening",
      "score",
      "preparation",
      "study",
      "practice",
      "exam",
      "test",
    ];

    let topicMatches = 0;
    for (const topic of coreTopics) {
      if (lowerTitle.includes(topic) || lowerText.includes(topic)) {
        topicMatches++;
      }
    }

    score += Math.min(topicMatches * 5, 20);

    return Math.min(score, 30);
  }

  /**
   * 计算参与度分数 (0-30)
   */
  calculateEngagementScore(post: RedditPost): number {
    let score = 0;

    // 评论数权重 (0-15)
    const commentScore = Math.min(post.num_comments / 2, 15);
    score += commentScore;

    // 点赞数权重 (0-10)
    const upvoteScore = Math.min(post.score, 10);
    score += upvoteScore;

    // 时间新鲜度 (0-5)
    const postAgeHours = (Date.now() / 1000 - post.created_utc) / 3600;
    let freshnessScore = 0;
    if (postAgeHours < 6) {
      freshnessScore = 5;
    } else if (postAgeHours < 24) {
      freshnessScore = 3;
    } else if (postAgeHours < 48) {
      freshnessScore = 1;
    }
    score += freshnessScore;

    return Math.min(score, 30);
  }

  /**
   * 计算回复价值分数 (0-40)
   */
  calculateReplyValueScore(
    post: RedditPost,
    comments: RedditComment[],
    aiAnalysis?: FilterResult,
  ): number {
    let score = 0;

    // AI 判断的讨论深度 (0-15)
    if (aiAnalysis?.discussionValue) {
      score += (aiAnalysis.discussionValue / 10) * 15;
    }

    // 现有回复质量评估 (0-15)
    // 如果已有高质量回复（高赞评论），降低回复价值
    const hasHighQualityAnswer = comments.some(
      (c) => c.score > 10 && c.body.length > 200,
    );
    if (hasHighQualityAnswer) {
      score += 5; // 已有好答案，价值较低
    } else if (comments.length > 0) {
      score += 10; // 有讨论但无高质量答案
    } else {
      score += 15; // 无人回答，价值最高
    }

    // AI 判断的回复价值 (0-10)
    if (aiAnalysis?.replyWorthiness) {
      score += (aiAnalysis.replyWorthiness / 10) * 10;
    }

    return Math.min(score, 40);
  }

  /**
   * 综合评分
   */
  scorePost(
    post: RedditPost,
    comments: RedditComment[],
    aiAnalysis?: FilterResult,
  ): ScoredPost {
    const relevanceScore = this.calculateRelevanceScore(post);
    const engagementScore = this.calculateEngagementScore(post);
    const replyValueScore = this.calculateReplyValueScore(post, comments, aiAnalysis);

    const totalScore = relevanceScore + engagementScore + replyValueScore;

    return {
      post,
      comments,
      score: totalScore,
      relevanceScore,
      engagementScore,
      replyValueScore,
      aiAnalysis,
    };
  }

  /**
   * 对多个帖子排序并返回 Top N
   */
  rankPosts(scoredPosts: ScoredPost[], topN: number): ScoredPost[] {
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }
}
