# WAIC Visitor Guide

面向 WAIC 2026 参访者的独立行程规划工具。站点把 175 场论坛按时间、主题与场馆组织成可交互视图，并提供交叉筛选、自动轮播详情、个性化路线、冲突检查、分享链接与 ICS 导出。

> 本项目由 WaytoAGI 制作，是参访辅助工具，不是 WAIC 官方网站。活动信息请以 [WAIC 官网](https://www.worldaic.com.cn/) 与[原始完整日程](https://waytoagi.feishu.cn/file/ZfuhbXt7Go5YBgx33n3cd4qXngf)为准。

## 在线站点

- **正式站点**: https://waic-guide.waytoagi.com/ （阿里云 CDN + OSS，境内可达）
- WaytoAGI 视觉参考: https://waic.waytoagi.com/
- ~~Cloudflare Workers: waic-visitor-guide.ingle.workers.dev~~（首发入口，2026-07-13 起废弃）

## 本地开发

需要 Node.js 与 pnpm 11。

```bash
pnpm install
pnpm dev
```

质量检查与构建：

```bash
pnpm test
pnpm typecheck
pnpm build
```

## 发布

**merge 到 main 即自动发布**到 https://waic-guide.waytoagi.com/ （GitHub Actions →
构建 → 阿里云 OSS → CDN 刷新），不依赖任何人的本机。手动重发、本地兜底发布、
凭据与证书续期等完整上下文见 [docs/DEPLOY-ALIYUN.md](docs/DEPLOY-ALIYUN.md)。

本项目没有环境变量、数据库、R2、KV 或服务端 API。

## 架构

- React 19、TypeScript、Vite、Tailwind CSS v4、Motion
- Cloudflare Workers Static Assets，SPA fallback 配置见 `wrangler.jsonc`
- 175 条活动数据固定在 `src/data/waic-raw.json`
- 数据规范化与完整性校验位于 `src/lib/events.ts`
- 路线推荐全部在浏览器内计算，状态保存在 URL 与 localStorage
- 设计规则见 `DESIGN.md`，实现计划与决策记录见 `docs/plans/`

## 国际化

界面支持简体中文、英语、日语、韩语、法语、德语、西班牙语与阿拉伯语。八个语种的界面文案必须完整声明；TypeScript 会阻止缺失 locale 的字典通过检查。

活动源数据只包含官方中文与英文内容。简体中文展示中文源文本，其余语言展示英文源文本，避免把机器翻译的论坛名称误当成官方名称。阿拉伯语界面使用 RTL，时间仍按 LTR 展示。

## 关键维护入口

- `src/components/OpportunityLandscape.tsx`: 时间热力、主题星群、场馆星座及活动浮层
- `src/components/LandscapeEventCarousel.tsx`: 浮层交叉筛选与自动轮播
- `src/components/EventExplorer.tsx`: 175 场活动搜索与筛选
- `src/components/Planner.tsx`: 路线规划与导出
- `src/lib/uiCopy.ts`: 主要界面多语言文案
- `src/lib/labels.ts`: 主题、场馆、身份、目标与日期标签
- `src/styles.css`: 全站布局、品牌样式与响应式规则

更新日程时，必须同步调整 `src/data/waic-raw.json` 以及 `src/lib/events.ts` 中的总量和分布断言，再运行 `pnpm run data:check`。不要编造活动、嘉宾、余量、实时状态或场馆间通勤时间。

## 当前注意事项

- 顶部鹿形 logo 依赖 `https://waic.waytoagi.com/brand/logo.png`，参考站资源变更时需要同步处理。
- Vite 构建会提示主 JS chunk 超过 500 kB；当前不影响部署，后续可按页面或功能做代码分割。
- 正式域名 waic-guide.waytoagi.com 已绑定阿里云 CDN；HTTPS 证书 2026-10-11 到期，续期方式见 docs/DEPLOY-ALIYUN.md。
