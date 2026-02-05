import type { AnalysisResult, DiscordEmbed } from "./types.js";

export class DiscordFormatter {
  /**
   * 格式化为 Discord Embed 卡片
   */
  formatResults(results: AnalysisResult[], runTime: Date): DiscordEmbed {
    const fields = results.map((result, index) => {
      const post = result.post;
      const postUrl = `https://www.reddit.com${post.permalink}`;
      
      // 计算帖子发布时间
      const postAgeHours = Math.floor(
        (Date.now() / 1000 - post.created_utc) / 3600,
      );
      const timeAgo = this.formatTimeAgo(postAgeHours);

      // 格式化回复候选
      const repliesText = result.replies
        .map((r) => {
          const styleLabel =
            r.style === "professional"
              ? "专业"
              : r.style === "friendly"
                ? "友好"
                : "实用";
          return `**回复候选 ${styleLabel}**:\n${r.content}`;
        })
        .join("\n\n");

      // 构建字段值
      const value = `评分: ${result.score}/100 | 评论: ${post.num_comments} | ${timeAgo}
[查看原帖](${postUrl})

**摘要**: ${result.summary}

${repliesText}`;

      return {
        name: `🔥 #${index + 1}: ${this.truncate(post.title, 200)}`,
        value: this.truncate(value, 1024), // Discord 字段限制
        inline: false,
      };
    });

    return {
      title: `📊 Reddit TOEFL 日报 - Top ${results.length}`,
      description: `发现 ${results.length} 个值得回复的高质量帖子和评论`,
      color: 0x5865f2, // Discord 蓝色
      fields,
      footer: {
        text: `扫描了 r/TOEFL 和 r/ToeflAdvice | 下次运行: ${this.formatNextRun(runTime)}`,
      },
      timestamp: runTime.toISOString(),
    };
  }

  /**
   * 格式化为简单摘要（如果 embed 太长）
   */
  formatSimpleSummary(results: AnalysisResult[]): string {
    let text = `📊 **Reddit TOEFL 日报 - Top ${results.length}**\n\n`;

    for (const [index, result] of results.entries()) {
      const post = result.post;
      const postUrl = `https://www.reddit.com${post.permalink}`;
      
      text += `**${index + 1}. ${post.title}**\n`;
      text += `评分: ${result.score}/100 | 评论: ${post.num_comments}\n`;
      text += `${postUrl}\n`;
      text += `摘要: ${result.summary}\n\n`;
    }

    return text;
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - 3) + "...";
  }

  private formatTimeAgo(hours: number): string {
    if (hours < 1) {
      return "不到 1 小时前";
    }
    if (hours < 24) {
      return `${hours} 小时前`;
    }
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  }

  private formatNextRun(currentRun: Date): string {
    const nextRun = new Date(currentRun);
    nextRun.setDate(nextRun.getDate() + 1);
    
    // 格式化为 "明天 09:00"
    const hours = String(nextRun.getHours()).padStart(2, "0");
    const minutes = String(nextRun.getMinutes()).padStart(2, "0");
    return `明天 ${hours}:${minutes}`;
  }
}
