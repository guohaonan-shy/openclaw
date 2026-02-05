# 部署清单 ✅

使用此清单逐步完成部署，确保不遗漏任何步骤。

---

## 📋 预备阶段

- [ ] 拥有 Discord 账号
- [ ] 拥有 Railway 账号
- [x] 获得 Gemini API Key: `AIzaSyCVxPZNtm1Yw9eH-iz-5fEosNC0YwQxIJE`
- [x] 获得 Discord Server ID: `1468895075466743911`

---

## 🤖 第一阶段：Discord Bot 创建

### 创建 Bot 应用
- [ ] 访问 https://discord.com/developers/applications
- [ ] 创建新应用（名称：`TOEFL Analyzer Bot`）
- [ ] 进入 Bot 标签页
- [ ] 点击 "Add Bot"
- [ ] 点击 "Reset Token" 并**复制保存**

**Bot Token**: `_________________________________`

### 配置 Bot 权限
- [ ] Send Messages (发送消息)
- [ ] Embed Links (嵌入链接)
- [ ] View Channels (查看频道)

### 邀请 Bot 到服务器
- [ ] OAuth2 → URL Generator
- [ ] Scopes: 勾选 `bot`
- [ ] Bot Permissions: 勾选上述 3 个权限
- [ ] 复制 URL 并在浏览器打开
- [ ] 选择服务器 ID `1468895075466743911`
- [ ] 完成授权

---

## 📱 第二阶段：获取 Channel ID

### 启用开发者模式
- [ ] 打开 Discord 设置
- [ ] 高级 → 开发者模式 (打开)

### 复制 Channel ID
- [ ] 找到你的私有频道
- [ ] 右键点击频道名称
- [ ] 点击 "复制频道 ID"
- [ ] **保存此 ID**

**Channel ID**: `_________________________________`

### 授予 Bot 频道权限
- [ ] 右键私有频道 → 编辑频道
- [ ] 权限 → + → 添加 Bot
- [ ] 勾选：查看频道、发送消息、嵌入链接
- [ ] 保存更改

---

## 🚂 第三阶段：Railway 部署

### 创建项目
- [ ] 登录 https://railway.app/
- [ ] New Project → Deploy from GitHub repo
- [ ] 选择 `openclaw` 仓库
- [ ] 等待初次部署完成（约 2-3 分钟）

### 配置 Volume
- [ ] 点击服务 → Settings
- [ ] Volumes → New Volume
  - Mount Path: `/root/.openclaw`
  - Size: `1 GB`
- [ ] 点击 Add

### 设置环境变量
- [ ] Variables 标签 → New Variable

需要添加的变量（逐个添加）：

```
DISCORD_BOT_TOKEN=<第一阶段获取的Token>
DISCORD_CHANNEL_ID=<第二阶段获取的Channel ID>
DISCORD_GUILD_ID=1468895075466743911
GEMINI_API_KEY=AIzaSyCVxPZNtm1Yw9eH-iz-5fEosNC0YwQxIJE
NODE_ENV=production
```

- [ ] 所有变量添加完成
- [ ] 点击 Deploy 重新部署

### 上传技能文件
- [ ] 等待部署完成
- [ ] 点击 Connect → Railway Shell

在 Shell 中执行：
```bash
# 创建目录
mkdir -p /root/.openclaw/skills

# 上传 skills/reddit-analyzer/ 目录
# 方式1: 通过 Git
cd /root/.openclaw/skills
git clone <你的仓库URL>
# 或者
# 方式2: 手动上传（通过 Railway CLI 或 scp）
```

- [ ] 技能文件上传完成
- [ ] 验证文件存在：`ls /root/.openclaw/skills/reddit-analyzer/`

---

## ⚙️ 第四阶段：配置和测试

### 运行配置脚本
在 Railway Shell 中：
```bash
cd /root/.openclaw/skills/reddit-analyzer
bash scripts/setup-railway.sh
```

- [ ] 脚本运行成功
- [ ] 没有错误信息

### 测试运行
- [ ] 当脚本询问是否测试时，输入 `y`
- [ ] 等待测试运行完成（约 1-2 分钟）

### 验证 Discord 消息
- [ ] 打开 Discord 私有频道
- [ ] 看到包含 Reddit 分析结果的卡片
- [ ] 卡片包含：
  - [ ] 标题和日期
  - [ ] 统计信息
  - [ ] Top 10 帖子列表
  - [ ] 每个帖子的回复候选

### 验证 Cron 任务
在 Railway Shell 中：
```bash
openclaw cron list
```

- [ ] 看到 "Reddit TOEFL Daily Analysis" 任务
- [ ] 状态显示为 Active
- [ ] 下次运行时间正确（每天 9:00）

---

## 🎯 最终验证

### 功能测试
- [ ] Discord 消息格式正确（Rich Embed）
- [ ] 帖子链接可点击
- [ ] 回复候选内容合理
- [ ] 评分数据准确

### 日志检查
```bash
openclaw logs --tail 50
```

- [ ] 没有 ERROR 级别日志
- [ ] Reddit API 调用成功
- [ ] Gemini API 调用成功
- [ ] Discord 消息发送成功

### 配置检查
```bash
openclaw config list
```

- [ ] discord.botToken 已设置
- [ ] discord.guildId = 1468895075466743911
- [ ] ai.default = gemini-3-flash-preview
- [ ] ai.gemini.apiKey 已设置

---

## 🎉 部署完成！

所有步骤完成后，你的 Reddit TOEFL 分析器已成功部署！

### 下一步
- ⏰ 每天早上 9:00 自动运行
- 📊 在 Discord 查看每日分析结果
- 💬 使用回复候选提升社区影响力

### 可选配置
- [ ] 修改运行时间（编辑 Cron 表达式）
- [ ] 调整过滤阈值（编辑 `src/analyzer.ts`）
- [ ] 增加更多 subreddit（编辑配置）

### 监控和维护
- [ ] 定期检查 Discord 消息
- [ ] 监控 Railway 资源使用
- [ ] 查看 Gemini API 配额
- [ ] 每周检查一次日志

---

## 📞 需要帮助？

遇到问题时：
1. 查看 **[DEPLOYMENT.md](./DEPLOYMENT.md#故障排查)** 的故障排查部分
2. 检查 Railway 日志：`openclaw logs --level error`
3. 验证环境变量：`openclaw config list`
4. 测试 Discord 连接：`openclaw channels status --probe discord`

---

**清单版本**: v1.0.0  
**最后更新**: 2026-02-05
