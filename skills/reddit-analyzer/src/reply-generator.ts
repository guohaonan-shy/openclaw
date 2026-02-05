import type { RedditPost, RedditComment, ReplyCandidate } from "./types.js";

export class ReplyGenerator {
  /**
   * 生成回复提示词
   */
  buildPrompt(post: RedditPost, topComments: RedditComment[]): string {
    const commentsPreview = topComments
      .slice(0, 5)
      .map((c) => `- ${c.author}: ${c.body.slice(0, 200)}`)
      .join("\n");

    return `为这个 Reddit 帖子生成 3 个回复候选。

# 帖子信息
标题: ${post.title}
内容: ${post.selftext.slice(0, 800)}${post.selftext.length > 800 ? "..." : ""}
现有评论数: ${post.num_comments}

# 现有热门评论
${commentsPreview}

# 任务要求
生成 3 个不同风格的回复候选：

1. **专业权威型**（professional）：
   - 提供结构化建议
   - 引用常见经验和方法
   - 语气专业、正式
   - 长度：150-250 词

2. **友好鼓励型**（friendly）：
   - 同理心开场
   - 分享个人经验
   - 提供积极建议和鼓励
   - 长度：120-200 词

3. **简洁实用型**（practical）：
   - 直接回答核心问题
   - 提供具体步骤或资源
   - 避免冗长
   - 长度：80-150 词

# 约束条件
- 不要提及任何产品或服务
- 专注于提供有价值的帮助
- 使用英文回复
- 语气自然，符合 Reddit 社区风格

# 输出格式
返回 JSON 数组，格式如下：
[
  {
    "style": "professional",
    "content": "Your professional reply here..."
  },
  {
    "style": "friendly",
    "content": "Your friendly reply here..."
  },
  {
    "style": "practical",
    "content": "Your practical reply here..."
  }
]

只返回 JSON 数组，不要额外说明。`;
  }

  /**
   * 解析 AI 返回的回复
   */
  parseReplies(aiResponse: string): ReplyCandidate[] {
    try {
      const replies = JSON.parse(aiResponse);
      
      if (!Array.isArray(replies) || replies.length !== 3) {
        throw new Error("Invalid reply format");
      }

      return replies.map((r) => ({
        style: r.style as "professional" | "friendly" | "practical",
        content: r.content,
      }));
    } catch (error) {
      console.error("Failed to parse AI replies:", error);
      
      // 返回备用回复
      return [
        {
          style: "professional",
          content: "I'd be happy to help with your TOEFL preparation. Could you provide more details about your specific concerns?",
        },
        {
          style: "friendly",
          content: "Hey! I've been through the TOEFL prep journey too. What specific area are you struggling with?",
        },
        {
          style: "practical",
          content: "Check out the official TOEFL practice materials and Khan Academy TOEFL prep. They're great starting points.",
        },
      ];
    }
  }
}
