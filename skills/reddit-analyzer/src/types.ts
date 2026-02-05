// Reddit API 数据类型
export interface RedditPost {
  id: string;
  title: string;
  author: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  subreddit: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  permalink: string;
}

// 过滤器结果
export interface FilterResult {
  passed: boolean;
  reason?: string;
  isAd?: boolean;
  isScoreShowing?: boolean;
  hasSubstantiveQuestion?: boolean;
  discussionValue?: number;
  replyWorthiness?: number;
}

// 评分结果
export interface ScoredPost {
  post: RedditPost;
  comments: RedditComment[];
  score: number;
  relevanceScore: number;
  engagementScore: number;
  replyValueScore: number;
  aiAnalysis?: FilterResult;
}

// 回复候选
export interface ReplyCandidate {
  style: "professional" | "friendly" | "practical";
  content: string;
}

// 分析结果
export interface AnalysisResult {
  post: RedditPost;
  topComments: RedditComment[];
  score: number;
  summary: string;
  replies: ReplyCandidate[];
}

// Discord Embed 类型
export interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: DiscordField[];
  footer?: {
    text: string;
  };
  timestamp: string;
}

export interface DiscordField {
  name: string;
  value: string;
  inline: boolean;
}

// 配置类型
export interface AnalyzerConfig {
  subreddits: string[];
  minComments: number;
  maxPostAgeDays: number;
  topCount: number;
  replyCandidatesCount: number;
  model: string;
  thinkingLevel: string;
}
