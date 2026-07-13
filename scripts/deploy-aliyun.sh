#!/usr/bin/env bash
# Deploy waic-visitor-guide to Aliyun OSS + CDN (waic-guide.waytoagi.com).
# Prereqs: aliyun CLI with a profile that can write OSS bucket waytoagi-waic-guide
#          and call cdn:RefreshObjectCaches. See docs/DEPLOY-ALIYUN.md.
set -euo pipefail

PROFILE="${ALIYUN_PROFILE:-will-onenorth}"
BUCKET="oss://waytoagi-waic-guide"
SITE="https://waic-guide.waytoagi.com"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
pnpm build

# Hashed assets: cache forever. Uploaded first so index.html never references a missing file.
aliyun --profile "$PROFILE" oss cp "$ROOT/dist/assets/" "$BUCKET/assets/" -r -f \
  --meta "Cache-Control:public, max-age=31536000, immutable"

# Entry points: no-cache so releases take effect immediately.
aliyun --profile "$PROFILE" oss cp "$ROOT/dist/index.html" "$BUCKET/index.html" -f \
  --meta "Cache-Control:no-cache"
aliyun --profile "$PROFILE" oss cp "$ROOT/dist/favicon.svg" "$BUCKET/favicon.svg" -f \
  --meta "Cache-Control:public, max-age=86400"

# Purge CDN cache for the entry points (assets are content-hashed, no purge needed).
aliyun --profile "$PROFILE" cdn RefreshObjectCaches --ObjectType File \
  --ObjectPath "$SITE/
$SITE/index.html
$SITE/favicon.svg"

echo "Deployed: $SITE"
