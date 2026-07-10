import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const EXPECTED_RAW_DATA_SHA256 =
  "c2bbf71ac57a12226238f9b73a7e16a52c03a047c6f5efb8cdf6a1ab2c1bce63";

describe("checked-in WAIC source data", () => {
  it("matches the explicitly reviewed source file bytes", () => {
    const dataPath = resolve(process.cwd(), "src/data/waic-raw.json");
    const bytes = readFileSync(dataPath);
    const digest = createHash("sha256").update(bytes).digest("hex");

    expect(digest).toBe(EXPECTED_RAW_DATA_SHA256);
  });
});
