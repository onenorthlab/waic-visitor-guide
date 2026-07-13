# 部署与托管手册（阿里云 CDN + OSS）

生产站点：**https://waic-guide.waytoagi.com** （2026-07-13 起为唯一正式入口）

本文是发布链路的完整交接文档。目标：任何有仓库写权限的同事都能修改并发布，不依赖任何人的本机。

## 架构总览

纯静态 Vite SPA，无服务端。托管链路（全部在 WaytoAGI 企业阿里云，主账号 `1118091368134719`）：

```
浏览器
  → DNS：waic-guide CNAME waic-guide.waytoagi.com.w.cdngslb.com（云解析，waytoagi.com 域）
  → 阿里云 CDN：waic-guide.waytoagi.com（global scope，HTTPS on）
      · 私有桶回源授权（l2_oss_key）
      · 回源 URI 改写：/ → /index.html（SPA 入口）
  → OSS 桶：waytoagi-waic-guide（cn-hangzhou，私有——账号策略禁止公共读桶）
```

缓存策略（上传时由部署脚本写入对象元数据）：

| 路径 | Cache-Control | 说明 |
|---|---|---|
| `assets/*`（带内容哈希） | `public, max-age=31536000, immutable` | 改内容必改文件名，永不失效 |
| 根文件（`index.html` 等） | `no-cache` | 发布即生效 |

每次发布最后会调 `RefreshObjectCaches` 刷新 CDN 目录缓存。

## 怎么发布（三种方式）

1. **merge 到 main（推荐日常方式）**：`.github/workflows/deploy.yml` 会自动跑
   test → typecheck → build → 上传 OSS → 刷新 CDN。改完代码开 PR，合并即上线。
2. **手动重发**：GitHub 仓库 → Actions → Deploy → Run workflow（不改代码重发当前 main，
   适合排查缓存或首次验证）。
3. **本地兜底**（CI 不可用时，任何装了 [aliyun CLI](https://github.com/aliyun/aliyun-cli) 的机器）：

   ```bash
   export ALIBABA_CLOUD_ACCESS_KEY_ID=...       # 见下方「凭据」
   export ALIBABA_CLOUD_ACCESS_KEY_SECRET=...
   pnpm install && pnpm build && bash scripts/deploy-aliyun.sh
   ```

发布验证：`curl -sI https://waic-guide.waytoagi.com/ | grep -i last-modified` 应变为刚才的时间；
浏览器硬刷新看内容。

## 凭据

| 位置 | 内容 |
|---|---|
| GitHub 仓库 Secrets（Settings → Secrets and variables → Actions） | `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET` |
| 本地开发者 | 同一对 AK，OneNorth 侧登记在 events-platform 仓 `.env`（`ALIBABA_CLOUD_ACCESS_KEY_*`） |

当前 AK 属企业账号 RAM 子用户 `will-onenorth`，权限比本仓所需宽（含 DNS 写）。
**待办：请有 RAM 管理权限的同事创建最小权限子用户**（策略只需目标桶的
`oss:PutObject/ListObjects/GetObject` + `cdn:RefreshObjectCaches`），换掉两处凭据。
`will-onenorth` 自身无 `ram:CreateUser` 权限（2026-07-13 实测 ImplicitDeny），做不了这一步。

发布脚本对短旗标有个坑：aliyun CLI 的 `oss` 子命令解析不了 `-r`/`-f`（报
`multi-type operations is not supported`），必须用 `--recursive`/`--force`，脚本里已处理。

## HTTPS 证书（有到期日，注意）

- 当前证书：Let's Encrypt `waic-guide-le-20260713`，**2026-10-11 到期**，续期窗口 2026-09-10 起。
- 挂载方式：upload（手工上传到 CDN 域名），不会自动续期。
- 首签材料在罗磊本机 `~/.acme.sh/waic-guide.waytoagi.com_ecc/`，但**续期不依赖旧材料**——
  任何有上述 AK 的人可全新签发（DNS-01 走云解析自动验证）：

  ```bash
  # 1) 签发（docker，无需安装 acme.sh）
  docker run --rm -v "$PWD/acme-out:/acme.sh" \
    -e Ali_Key=$ALIBABA_CLOUD_ACCESS_KEY_ID -e Ali_Secret=$ALIBABA_CLOUD_ACCESS_KEY_SECRET \
    neilpang/acme.sh --issue --dns dns_ali -d waic-guide.waytoagi.com --server letsencrypt

  # 2) 挂到 CDN（CertName 带当天日期便于识别）
  aliyun cdn SetCdnDomainSSLCertificate --DomainName waic-guide.waytoagi.com \
    --CertName "waic-guide-le-$(date +%Y%m%d)" --CertType upload --SSLProtocol on \
    --SSLPub "$(cat acme-out/waic-guide.waytoagi.com_ecc/fullchain.cer)" \
    --SSLPri "$(cat acme-out/waic-guide.waytoagi.com_ecc/waic-guide.waytoagi.com.key)" \
    --access-key-id $ALIBABA_CLOUD_ACCESS_KEY_ID --access-key-secret $ALIBABA_CLOUD_ACCESS_KEY_SECRET \
    --region cn-hangzhou

  # 3) 验证
  echo | openssl s_client -connect waic-guide.waytoagi.com:443 -servername waic-guide.waytoagi.com 2>/dev/null | openssl x509 -noout -dates
  ```

## 待人工事项

- [ ] 最小权限 RAM 子账号替换 CI 与本地凭据（需 RAM 管理员，见「凭据」节）
- [ ] CDN 带宽封顶 / 用量告警在阿里云控制台配置（API 不支持带宽封顶，PRO-413 遗留）
- [ ] 证书 2026-09-10 起进入续期窗口；如届时站点仍在服务，按上节步骤续期
  （也可加一个 cron 的 GitHub Actions 自动续期，首次需人工盯一轮）

## 历史与废弃入口

- Cloudflare Workers 版 `waic-visitor-guide.ingle.workers.dev`：首发部署（个人 Cloudflare
  账号，境内访问质量差），2026-07-13 起废弃、不再更新，仅作历史参考。`wrangler.jsonc`
  与 `pnpm deploy:workers` 保留但不属于正式链路。
- 迁移决策与验收记录：Multica issue PRO-413。
