#!/bin/bash
# 本地测试脚本
set -e

echo "🧪 Reddit Analyzer - 本地测试"
echo "================================"
echo ""

# 检查依赖
if ! command -v bun &> /dev/null; then
  echo "❌ 错误: bun 未安装"
  echo "   请先安装 bun: https://bun.sh/"
  exit 1
fi

# 检查 GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ 错误: GEMINI_API_KEY 未设置"
  echo "   使用方式: GEMINI_API_KEY=your_key ./scripts/test-local.sh"
  exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/.."

echo "📦 安装依赖..."
bun install

echo "✅ 依赖安装完成"
echo ""

echo "🚀 运行分析器..."
echo "   注意：这将进行实际的 Reddit API 调用和 Gemini AI 调用"
echo "   预计耗时：1-2 分钟"
echo ""

bun src/analyzer.ts

echo ""
echo "✅ 测试完成！"
echo ""
echo "📋 检查输出:"
echo "  - 应该显示从 r/TOEFL 和 r/ToeflAdvice 获取的帖子"
echo "  - 应该显示过滤和评分结果"
echo "  - 应该显示 Discord Embed 格式的输出"
echo ""
