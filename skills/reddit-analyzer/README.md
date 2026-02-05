# Reddit TOEFL Analyzer - Railway 部署指南

自动化 Reddit TOEFL 社区内容分析和回复建议工具，每天定时运行并发送结果到 Discord。

## 🚀 快速开始

### 📖 详细部署指南
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 完整的分步部署教程（推荐新手阅读）
  - 包含图文说明
  - 详细的故障排查
  - Discord Bot 创建教程
  - Railway 部署完整流程

### 已收集信息
- ✅ **Gemini API Key**: AIzaSyCVxPZNtm1Yw9eH-iz-5fEosNC0YwQxIJE  
- ✅ **Discord Server ID**: 1468895075466743911
- ⏳ **Discord Bot Token**: [待创建 →](./DEPLOYMENT.md#第一步创建-discord-bot)
- ⏳ **Discord Channel ID**: [待获取 →](./DEPLOYMENT.md#第二步获取私有频道-channel-id)

### ⚡ 一键部署脚本
完成前置准备后，在 Railway Shell 中运行：
```bash
bash /root/.openclaw/skills/reddit-analyzer/scripts/setup-railway.sh
```

---

## 功能概述

- 🔍 扫描 r/TOEFL 和 r/ToeflAdvice
- 🧠 AI 智能过滤（排除广告、秀分帖）
- 📊 多维度评分系统
- 💬 生成 3 种风格的回复候选
- 📤 Discord 卡片形式输出
- ⏰ 每天自动运行

## Railway 部署步骤

### 前置准备

#### 1. 获取 Discord Bot Token

1. 访问 https://discord.com/developers/applications
2. 点击 **New Application** 创建应用
3. 进入 **Bot** 标签页，点击 **Add Bot**
4. 启用以下 Privileged Gateway Intents：
   - ✅ **Message Content Intent** (必需)
   - ✅ **Server Members Intent** (推荐)
5. 点击 **Reset Token** 获取 Bot Token（妥善保存）
6. 进入 **OAuth2 → URL Generator**：
   - Scopes: 选择 `bot`
   - Bot Permissions: 选择以下权限
     - ✅ View Channels
     - ✅ Send Messages
     - ✅ Read Message History
     - ✅ Embed Links
     - ✅ Attach Files
7. 复制生成的 URL，在浏览器中打开并将 Bot 邀请到你的服务器

#### 2. 获取 Discord Channel ID

1. 在 Discord 中启用开发者模式：
   - 用户设置 → 高级 → 开发者模式 (打开)
2. 右键点击你的私有频道
3. 点击 **复制 ID**
4. 保存此 Channel ID（格式类似：`123456789012345678`）

#### 3. 获取 Gemini API Key

1. 访问 https://aistudio.google.com/apikey
2. 点击 **Create API Key**
3. 选择一个 Google Cloud 项目（或创建新项目）
4. 复制生成的 API Key

### 部署到 Railway

#### 步骤 1: 创建 Railway 项目

1. 访问 https://railway.app/
2. 登录并点击 **New Project**
3. 选择 **Deploy from GitHub repo**
4. 选择 `openclaw/openclaw` 仓库（或你的 fork）

#### 步骤 2: 配置 Volume（持久化存储）

1. 在项目设置中，点击 **Volumes**
2. 点击 **New Volume**
3. 设置挂载路径为：`/data`
4. 保存

#### 步骤 3: 配置环境变量

在 Railway 项目的 **Variables** 标签页，添加以下环境变量：

```bash
# Discord Bot Token（必需）
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Gemini API Key（必需）
GEMINI_API_KEY=your_gemini_api_key_here

# OpenClaw 配置（必需）
PORT=8080
OPENCLAW_STATE_DIR=/data/.openclaw
OPENCLAW_WORKSPACE_DIR=/data/workspace

# 可选：设置密码保护
SETUP_PASSWORD=your_secure_password
```

#### 步骤 4: 启用公共网络

1. 在项目设置中，找到 **Networking**
2. 点击 **Generate Domain** 生成公共域名
3. 确认端口设置为 `8080`

#### 步骤 5: 部署并初始化

1. 点击 **Deploy** 开始部署
2. 等待部署完成（首次约 3-5 分钟）
3. 访问生成的域名：`https://your-app.railway.app/setup`
4. 使用 `SETUP_PASSWORD` 完成初始设置向导

#### 步骤 6: 上传技能文件

通过 SSH 或 Railway CLI 上传技能：

```bash
# 方法 1: 使用 Railway CLI
railway link
railway shell

# 在 Railway shell 中
cd /data/workspace
mkdir -p skills
# 将 skills/reddit-analyzer 目录复制到 /data/workspace/skills/
```

**或者**，在 OpenClaw Web UI 中通过文件管理上传技能目录。

#### 步骤 7: 配置 Cron Job

1. 访问 OpenClaw Web UI：`https://your-app.railway.app`
2. 登录后，打开 Chat 界面
3. 发送以下消息配置 Cron Job：

```
帮我添加一个 Cron Job：
- 名称：Reddit TOEFL 日报
- 时间：每天 09:00（北京时间）
- 模型：gemini-3-flash-preview
- Thinking level: low
- 消息：扫描 Reddit r/TOEFL 和 r/ToeflAdvice，找出高价值内容并生成回复建议
- 发送到 Discord channel: YOUR_CHANNEL_ID_HERE
```

**或者**使用 Railway Shell 执行 CLI 命令：

```bash
openclaw cron add \
  --name "Reddit TOEFL 日报" \
  --cron "0 9 * * *" \
  --tz "Asia/Shanghai" \
  --model "gemini-3-flash-preview" \
  --thinking low \
  --session isolated \
  --message "扫描 Reddit r/TOEFL 和 r/ToeflAdvice，找出高价值内容并生成回复建议。使用 reddit-analyzer 技能。" \
  --announce \
  --channel discord \
  --to "channel:YOUR_DISCORD_CHANNEL_ID"
```

#### 步骤 8: 测试运行

立即触发一次 Cron Job 测试：

```bash
# 查看 Job ID
openclaw cron list

# 强制运行
openclaw cron run <job-id> --force

# 查看运行历史
openclaw cron runs --id <job-id>
```

## 本地测试

### 安装依赖

```bash
cd skills/reddit-analyzer
bun install
```

### 运行测试

```bash
export GEMINI_API_KEY="your_api_key"
bun src/analyzer.ts
```

## 配置参数

可以通过修改 `src/analyzer.ts` 中的 `DEFAULT_CONFIG` 调整：

```typescript
const DEFAULT_CONFIG = {
  subreddits: ["TOEFL", "ToeflAdvice"],  // 扫描的 subreddit
  minComments: 2,                         // 最少评论数
  maxPostAgeDays: 2,                      // 最大帖子年龄（天）
  topCount: 10,                           // 返回数量
  replyCandidatesCount: 3,                // 回复候选数
  model: "gemini-3-flash-preview",        // AI 模型
  thinkingLevel: "low",                   // Thinking 级别
};
```

## Discord 输出示例

每天你会收到一张 Discord 卡片，包含：

```
📊 Reddit TOEFL 日报 - Top 10

发现 10 个值得回复的高质量帖子和评论

🔥 #1: How to improve TOEFL speaking score from 22 to 26?
评分: 85/100 | 评论: 12 | 2小时前
[查看原帖](https://reddit.com/...)

摘要: 相关性: 25/30, 参与度: 28/30, 回复价值: 32/40

回复候选 专业:
Based on your current speaking score of 22, I'd recommend focusing on...

回复候选 友好:
Hey! I totally understand the struggle to break into the 26+ range...

回复候选 实用:
Quick tips: 1) Record yourself daily 2) Use templates for Q1-Q4...

🔥 #2: Best TOEFL writing templates for Task 2?
...
```

## 技术架构

```
Reddit JSON API (无需认证)
    ↓
预过滤 (关键词)
    ↓
AI 分类 (Gemini 3 Flash)
    ↓
多维度评分
    ↓
Top 10 选择
    ↓
AI 回复生成
    ↓
Discord Embed 格式化
    ↓
发送到私有频道
```

## 成本估算

基于 Gemini 3 Flash 定价（$0.50 / $3 per 1M tokens）：

- **每次运行预估**：
  - 输入：~50k tokens（50 个帖子 + 评论）
  - 输出：~5k tokens（分类 + 回复）
  - 成本：约 $0.04 USD

- **每月成本**（每天运行）：
  - 约 $1.2 USD/月

Gemini 3 Flash 有免费额度，初期使用几乎不产生费用。

## 故障排除

### 1. Cron Job 未运行

```bash
# 检查 Job 状态
openclaw cron list

# 检查是否启用
openclaw cron edit <job-id> --enabled true

# 查看运行日志
openclaw cron runs --id <job-id> --limit 10
```

### 2. Discord 消息未收到

- 确认 Bot Token 正确
- 确认 Bot 已加入服务器
- 确认 Channel ID 正确（使用 `channel:` 前缀）
- 检查 Bot 权限

### 3. Reddit API 失败

- Reddit 可能有临时速率限制
- 检查网络连接
- 查看 OpenClaw 日志获取详细错误

### 4. AI 分析失败

- 确认 `GEMINI_API_KEY` 已设置
- 检查 Gemini API 配额
- 尝试降低 `topCount` 减少 API 调用

## 查看日志

Railway 日志查看：

```bash
# 使用 Railway CLI
railway logs

# 或在 Railway Web UI 的 Deployments 页面查看
```

OpenClaw 内部日志：

```bash
# 通过 Railway Shell
railway shell
tail -f /data/.openclaw/logs/gateway.log
```

## 后续优化

- ✅ 基础版本：抓取 → 过滤 → 评分 → 回复生成
- 🔄 添加产品信息自然融入
- 🔄 支持更多 subreddit
- 🔄 回复自动发送（需要 Reddit OAuth）
- 🔄 历史效果追踪和统计
- 🔄 智能调度（根据社区活跃时间优化）

## 支持

遇到问题？
- 查看 OpenClaw 文档: https://docs.openclaw.ai
- Railway 文档: https://docs.railway.app
- Discord API 文档: https://discord.com/developers/docs

---

**Happy analyzing! 🎯**
