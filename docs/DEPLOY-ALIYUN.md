# 阿里云部署 Runbook（waic-guide.waytoagi.com）

2026-07-13 起，境内正式入口为 **https://waic-guide.waytoagi.com**（阿里云 CDN + OSS），
替代 Cloudflare Workers 入口（`waic-visitor-guide.ingle.workers.dev`，保留作为境外备用）。
关联工单：Multica PRO-413。

## 资源清单（WaytoAGI 企业阿里云，主账号 1118091368134719）

| 资源 | 值 | 说明 |
|---|---|---|
| OSS 桶 | `waytoagi-waic-guide`（cn-hangzhou，私有） | 账号级策略禁止公共读，桶保持私有 |
| CDN 域名 | `waic-guide.waytoagi.com`（global scope） | 源站类型 oss → 桶 REST endpoint |
| CDN 关键配置 | `l2_oss_key`（私有桶回源授权）；`back_to_origin_url_rewrite`：`^/$` → `/index.html` | 私有回源下 `GET /` 是 ListObjects，必须改写 |
| DNS | `waic-guide` CNAME → `waic-guide.waytoagi.com.w.cdngslb.com` | 阿里云解析（同账号） |
| HTTPS 证书 | Let's Encrypt ECC，`upload` 方式挂载 CDN | 见下方续期 |
| OSS 静态托管 | index/error 均为 `index.html` | 兜底；路由只用查询参数，无路径路由 |

## 日常发布

```bash
./scripts/deploy-aliyun.sh
```

要求本机 `aliyun` CLI 配好可写该桶的 profile（默认 `will-onenorth`，可用 `ALIYUN_PROFILE` 覆盖）。
脚本会：构建 → 分层缓存上传（assets 一年 immutable / index.html no-cache）→ 刷新 CDN 入口缓存。

## 证书续期（90 天周期，⚠️ 当前为手动）

签发记录：2026-07-13 在 mac mini 用 acme.sh（`~/.acme.sh/waic-guide.waytoagi.com_ecc/`）
DNS-01 签发，续期窗口 **2026-09-10** 前后。续期操作：

```bash
export Ali_Key=<ALIBABA_CLOUD_ACCESS_KEY_ID> Ali_Secret=<ALIBABA_CLOUD_ACCESS_KEY_SECRET>
~/.acme.sh/acme.sh --renew -d waic-guide.waytoagi.com --ecc --server letsencrypt
D=~/.acme.sh/waic-guide.waytoagi.com_ecc
aliyun cdn SetCdnDomainSSLCertificate --DomainName waic-guide.waytoagi.com \
  --CertType upload --CertName waic-guide-le-$(date +%Y%m%d) --SSLProtocol on \
  --SSLPub "$(cat $D/fullchain.cer)" --SSLPri "$(cat $D/waic-guide.waytoagi.com.key)" \
  --profile will-onenorth
```

凭据在 `~/one-north/waytoagi/repos/events-platform/.env`（RAM 子用户 `will-onenorth`）。
待办：接入自动续期（cron）或换 CAS 长期证书（RAM 用户当前无 CAS 权限，需 Noodles 开）。

## 已知限制 / 人工项

- **带宽封顶**：CDN API 不支持（`bandwidth_limit`/`bandwidth_cap` 均报不支持），需在控制台
  「域名管理 → 带宽封顶」人工配置，作为计费保险丝。
- RAM 子用户 `will-onenorth` 无 CAS（证书服务）与 RAM 权限；免费证书 API（`CertType=free`）在当前
  CDN API 版本不可用，故走 Let's Encrypt。
- 深链路径（如 `/foo`）回源为 OSS 404。应用路由只用查询参数（`/?plan=…`），不受影响；
  如未来引入路径路由，需追加 CDN `error_page` 或改写规则。
