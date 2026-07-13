#!/usr/bin/env bash
# 发布 dist/ 到阿里云 OSS 并刷新 CDN。本地与 GitHub Actions 共用这一份脚本。
#
# 依赖：aliyun CLI（https://github.com/aliyun/aliyun-cli）
# 凭据：环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID / ALIBABA_CLOUD_ACCESS_KEY_SECRET
#       所需最小权限：目标 bucket 的 oss:PutObject/GetObject/ListObjects + cdn:RefreshObjectCaches
# 用法：pnpm build && bash scripts/deploy-aliyun.sh
# 详细上下文（CDN/证书/DNS/凭据）：docs/DEPLOY-ALIYUN.md
set -euo pipefail

BUCKET="waytoagi-waic-guide"
REGION="cn-hangzhou"
SITE_ORIGIN="https://waic-guide.waytoagi.com"
DIST="$(cd "$(dirname "$0")/.." && pwd)/dist"

: "${ALIBABA_CLOUD_ACCESS_KEY_ID:?missing ALIBABA_CLOUD_ACCESS_KEY_ID}"
: "${ALIBABA_CLOUD_ACCESS_KEY_SECRET:?missing ALIBABA_CLOUD_ACCESS_KEY_SECRET}"
AUTH=(--access-key-id "$ALIBABA_CLOUD_ACCESS_KEY_ID" --access-key-secret "$ALIBABA_CLOUD_ACCESS_KEY_SECRET" --region "$REGION")

[ -f "$DIST/index.html" ] || { echo "dist/index.html 不存在，先跑 pnpm build" >&2; exit 1; }

# 1) 先传带内容哈希的静态资源（长缓存，可安全并存新旧版本）
# 注意：aliyun CLI 的 oss 子命令解析不了短旗标（-f/-r 会报 multi-type operations），必须用长旗标
echo "==> upload dist/assets (immutable cache)"
aliyun oss cp --recursive --force "$DIST/assets/" "oss://$BUCKET/assets/" \
  --meta "Cache-Control:public, max-age=31536000, immutable" "${AUTH[@]}"

# 2) 最后传根文件（index.html 等，no-cache 保证发布即生效），近似原子切换
echo "==> upload root files (no-cache)"
for f in "$DIST"/*; do
  [ -f "$f" ] || continue
  aliyun oss cp --force "$f" "oss://$BUCKET/$(basename "$f")" \
    --meta "Cache-Control:no-cache" "${AUTH[@]}"
done

# 3) 刷新 CDN 目录缓存
echo "==> refresh CDN"
aliyun cdn RefreshObjectCaches --ObjectPath "$SITE_ORIGIN/" --ObjectType Directory "${AUTH[@]}"

echo "==> done. verify:"
curl -sI "$SITE_ORIGIN/" | grep -i "last-modified\|etag" || true
