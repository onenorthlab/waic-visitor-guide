import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(
  resolve(__dirname, "../index.html"),
  "utf-8",
);

describe("Google Analytics 接入", () => {
  it("index.html 异步加载 gtag.js 且指向 G-ZNTB1QCV7S", () => {
    expect(indexHtml).toContain(
      '<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZNTB1QCV7S"></script>',
    );
  });

  it("index.html 内联初始化 dataLayer 并配置 G-ZNTB1QCV7S", () => {
    expect(indexHtml).toContain("window.dataLayer = window.dataLayer || []");
    expect(indexHtml).toContain("gtag('js', new Date())");
    expect(indexHtml).toContain("gtag('config', 'G-ZNTB1QCV7S')");
  });
});
