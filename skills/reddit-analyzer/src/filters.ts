import type { RedditPost, FilterResult } from "./types.js";

export class ContentFilter {
  private readonly config: {
    minComments: number;
    maxPostAgeDays: number;
  };

  constructor(config: { minComments: number; maxPostAgeDays: number }) {
    this.config = config;
  }

  /**
   * 第一阶段：关键词预过滤
   */
  preFilter(post: RedditPost): FilterResult {
    // 检查评论数
    if (post.num_comments < this.config.minComments) {
      return {
        passed: false,
        reason: `评论数不足（${post.num_comments} < ${this.config.minComments}）`,
      };
    }

    // 检查发布时间
    const postAgeSeconds = Date.now() / 1000 - post.created_utc;
    const postAgeDays = postAgeSeconds / 86400;
    if (postAgeDays > this.config.maxPostAgeDays) {
      return {
        passed: false,
        reason: `帖子过旧（${postAgeDays.toFixed(1)} 天 > ${this.config.maxPostAgeDays} 天）`,
      };
    }

    // 检查是否包含分数（秀分帖）
    const scorePattern = /\b(11\d|12[0-3]|10\d|9\d)\b/; // 90-123 分数范围
    if (scorePattern.test(post.title) || scorePattern.test(post.selftext)) {
      return {
        passed: false,
        reason: "疑似秀分帖",
        isScoreShowing: true,
      };
    }

    // 检查广告关键词
    const adKeywords = [
      "discount",
      "coupon",
      "promo",
      "sale",
      "buy",
      "purchase",
      "offer",
      "deal",
      "code",
      "%off",
    ];
    const lowerTitle = post.title.toLowerCase();
    const lowerText = post.selftext.toLowerCase();

    for (const keyword of adKeywords) {
      if (lowerTitle.includes(keyword) || lowerText.includes(keyword)) {
        return {
          passed: false,
          reason: `包含广告关键词: ${keyword}`,
          isAd: true,
        };
      }
    }

    return { passed: true };
  }

  /**
   * 第二阶段：AI 分类（需要外部调用 AI）
   * 这里返回需要 AI 分析的提示词
   */
  buildAIPrompt(post: RedditPost, topComments: string[]): string {
    return `分析这个 Reddit 帖子，判断是否值得回复：

标题: ${post.title}

内容: ${post.selftext.slice(0, 500)}${post.selftext.length > 500 ? "..." : ""}

前几条评论:
${topComments.slice(0, 3).join("\n---\n")}

请用 JSON 格式返回分析结果：
{
  "isAd": boolean,           // 是否为广告/推广
  "isScoreShowing": boolean, // 是否为秀分帖
  "hasSubstantiveQuestion": boolean, // 是否包含实质性问题
  "discussionValue": number, // 讨论价值 (1-10)
  "replyWorthiness": number  // 回复价值 (1-10)
}

只返回 JSON，不要额外解释。`;
  }

  /**
   * 解析 AI 返回的分类结果
   */
  parseAIResult(aiResponse: string): FilterResult {
    try {
      const result = JSON.parse(aiResponse);
      
      // 如果是广告或秀分，不通过
      if (result.isAd || result.isScoreShowing) {
        return {
          passed: false,
          reason: result.isAd ? "AI 判定为广告" : "AI 判定为秀分帖",
          ...result,
        };
      }

      // 如果没有实质性问题，不通过
      if (!result.hasSubstantiveQuestion) {
        return {
          passed: false,
          reason: "无实质性问题",
          ...result,
        };
      }

      // 如果回复价值过低，不通过
      if (result.replyWorthiness < 5) {
        return {
          passed: false,
          reason: `回复价值过低 (${result.replyWorthiness}/10)`,
          ...result,
        };
      }

      return {
        passed: true,
        ...result,
      };
    } catch (error) {
      console.error("Failed to parse AI result:", error);
      return {
        passed: false,
        reason: "AI 分析失败",
      };
    }
  }
}
