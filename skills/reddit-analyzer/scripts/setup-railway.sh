#!/bin/bash
# Railway 部署配置脚本
set -e

echo "🚀 OpenClaw Reddit Analyzer - Railway 部署配置"
echo "================================================"
echo ""

# 检查环境变量
if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo "❌ 错误: DISCORD_BOT_TOKEN 未设置"
  echo "   请先设置环境变量或创建 .env 文件"
  exit 1
fi

if [ -z "$DISCORD_CHANNEL_ID" ]; then
  echo "❌ 错误: DISCORD_CHANNEL_ID 未设置"
  exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ 错误: GEMINI_API_KEY 未设置"
  exit 1
fi

echo "✅ 环境变量检查通过"
echo ""

# 配置 OpenClaw
echo "📝 配置 OpenClaw..."
openclaw config set discord.botToken "$DISCORD_BOT_TOKEN"
openclaw config set discord.guildId "${DISCORD_GUILD_ID:-1468895075466743911}"
openclaw config set ai.default gemini-3-flash-preview
openclaw config set ai.gemini.apiKey "$GEMINI_API_KEY"

echo "✅ OpenClaw 配置完成"
echo ""

# 安装技能依赖（如果需要）
echo "📦 安装技能依赖..."
cd /root/.openclaw/skills/reddit-analyzer
npm install --omit=dev 2>/dev/null || echo "⚠️  npm install 跳过（可能不需要）"

echo "✅ 依赖安装完成"
echo ""

# 添加 Cron Job
echo "⏰ 添加 Cron Job..."
openclaw cron add \
  --name "Reddit TOEFL Daily Analysis" \
  --cron "0 9 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "运行 Reddit TOEFL 分析任务" \
  --skill reddit-analyzer \
  --announce \
  --channel discord \
  --to "channel:$DISCORD_CHANNEL_ID" || echo "⚠️  Cron Job 可能已存在"

echo "✅ Cron Job 配置完成"
echo ""

# 显示配置摘要
echo "📋 配置摘要:"
echo "  Discord Server ID: ${DISCORD_GUILD_ID:-1468895075466743911}"
echo "  Discord Channel ID: $DISCORD_CHANNEL_ID"
echo "  AI Model: gemini-3-flash-preview"
echo "  Cron Schedule: 每天 9:00 (Asia/Shanghai)"
echo ""

# 测试运行（可选）
read -p "是否立即测试运行？(y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🧪 测试运行..."
  openclaw cron run "Reddit TOEFL Daily Analysis"
  echo "✅ 测试完成！请检查你的 Discord 频道"
else
  echo "⏭️  跳过测试，你可以稍后手动运行："
  echo "   openclaw cron run \"Reddit TOEFL Daily Analysis\""
fi

echo ""
echo "🎉 部署配置完成！"
echo ""
echo "📚 下一步:"
echo "  1. 检查 Discord 私有频道是否收到测试消息"
echo "  2. 查看 Cron 任务: openclaw cron list"
echo "  3. 查看日志: openclaw logs --follow"
echo ""
