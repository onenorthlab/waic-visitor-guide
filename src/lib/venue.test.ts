import { describe, expect, it } from "vitest";

import { canonicalVenue } from "./events";
import {
  ALLOWED_VENUE_BUFFERS,
  recommendedVenueBuffer,
} from "./venue";

describe("recommendedVenueBuffer", () => {
  it("uses 10 minutes for the same location detail", () => {
    const room = canonicalVenue("世博中心", "世博中心金厅A+B");
    expect(recommendedVenueBuffer(room, room)).toBe(10);
  });

  it("uses 15 minutes within one venue area", () => {
    const from = canonicalVenue("世博中心", "世博中心金厅A+B");
    const to = canonicalVenue("世博中心", "世博中心银厅A");
    expect(recommendedVenueBuffer(from, to)).toBe(15);
  });

  it("uses 25 minutes between Expo Center and Expo Exhibition", () => {
    const from = canonicalVenue("世博中心", "世博中心金厅A+B");
    const to = canonicalVenue("世博展览馆", "世博展览馆1A会议室");
    expect(recommendedVenueBuffer(from, to)).toBe(25);
    expect(recommendedVenueBuffer(to, from)).toBe(25);
  });

  it("uses 30 minutes for an adjacent Expo hotel move", () => {
    const from = canonicalVenue("世博中心", "世博中心金厅A+B");
    const to = canonicalVenue("世博桐森酒店", "上海世博桐森酒店桐森厅1+2");
    expect(recommendedVenueBuffer(from, to)).toBe(30);
  });

  it("uses 45 minutes across official core venue zones", () => {
    const from = canonicalVenue("世博中心", "世博中心金厅A+B");
    const to = canonicalVenue("西岸国际会展中心", "西岸国际会展中心上海厅");
    expect(recommendedVenueBuffer(from, to)).toBe(45);
  });

  it("uses 60 minutes for Zhangjiang and distributed other venues", () => {
    const expo = canonicalVenue("世博中心", "世博中心金厅A+B");
    const zhangjiang = canonicalVenue("张江科学会堂", "张江科学会堂科创厅");
    const lingang = canonicalVenue("其他场馆", "上海临港锦江国际酒店观潮厅");
    const westBundDome = canonicalVenue("其他场馆", "西岸穹顶艺术中心");

    expect(recommendedVenueBuffer(expo, zhangjiang)).toBe(60);
    expect(recommendedVenueBuffer(lingang, westBundDome)).toBe(60);
  });

  it("only returns approved conservative buffer values", () => {
    expect(ALLOWED_VENUE_BUFFERS).toEqual([10, 15, 25, 30, 45, 60]);

    const venues = [
      canonicalVenue("世博中心", "A"),
      canonicalVenue("世博展览馆", "B"),
      canonicalVenue("西岸国际会展中心", "C"),
      canonicalVenue("世博桐森酒店", "D"),
      canonicalVenue("世博滨江酒店", "E"),
      canonicalVenue("张江科学会堂", "F"),
      canonicalVenue("其他场馆", "G"),
    ];

    for (const from of venues) {
      for (const to of venues) {
        expect(ALLOWED_VENUE_BUFFERS).toContain(recommendedVenueBuffer(from, to));
      }
    }
  });
});
