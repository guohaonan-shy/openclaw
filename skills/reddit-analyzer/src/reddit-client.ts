import type { RedditPost, RedditComment } from "./types.js";

const USER_AGENT = "openclaw:reddit-analyzer:v1.0";
const BASE_URL = "https://www.reddit.com";

export class RedditClient {
  /**
   * 获取 subreddit 的最新帖子
   */
  async fetchPosts(
    subreddit: string,
    limit = 100,
  ): Promise<RedditPost[]> {
    const url = `${BASE_URL}/r/${subreddit}/new.json?limit=${limit}`;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(
          `Reddit API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.data.children.map((child: any) => this.parsePost(child.data));
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      return [];
    }
  }

  /**
   * 获取帖子的评论
   */
  async fetchComments(
    subreddit: string,
    postId: string,
  ): Promise<RedditComment[]> {
    // 需要使用完整的 permalink 格式
    const url = `${BASE_URL}/r/${subreddit}/comments/${postId}.json`;

    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(
          `Reddit API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Reddit 返回数组：[0] 是帖子，[1] 是评论列表
      if (!data[1]?.data?.children) {
        return [];
      }

      return data[1].data.children
        .filter((child: any) => child.kind === "t1") // t1 = 评论
        .map((child: any) => this.parseComment(child.data))
        .filter((comment: RedditComment) => comment.body !== "[deleted]");
    } catch (error) {
      console.error(`Failed to fetch comments for ${postId}:`, error);
      return [];
    }
  }

  /**
   * 获取多个 subreddit 的帖子
   */
  async fetchMultipleSubreddits(
    subreddits: string[],
    limit = 50,
  ): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];

    for (const subreddit of subreddits) {
      const posts = await this.fetchPosts(subreddit, limit);
      allPosts.push(...posts);
      // 避免触发速率限制，稍微延迟
      await this.sleep(1000);
    }

    return allPosts;
  }

  private parsePost(data: any): RedditPost {
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      selftext: data.selftext || "",
      score: data.score,
      num_comments: data.num_comments,
      created_utc: data.created_utc,
      permalink: data.permalink,
      url: data.url,
      subreddit: data.subreddit,
    };
  }

  private parseComment(data: any): RedditComment {
    return {
      id: data.id,
      author: data.author,
      body: data.body || "",
      score: data.score,
      created_utc: data.created_utc,
      permalink: data.permalink || "",
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
