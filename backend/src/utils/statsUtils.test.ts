import { describe, it, expect } from "vitest";
import {
  calculateListingCounts,
  calculateCountsDiff,
  calculateListingStats,
} from "./statsUtils.js";

describe("statsUtils", () => {
  describe("calculateListingCounts", () => {
    it("should calculate counts from empty data", () => {
      const result = calculateListingCounts([]);

      expect(result).toEqual({
        total: 0,
        sale: 0,
        jeonse: 0,
        rent: 0,
      });
    });

    it("should calculate counts from sale data only", () => {
      const data = [{ tradetype: "매매", _count: 10 }];
      const result = calculateListingCounts(data);

      expect(result).toEqual({
        total: 10,
        sale: 10,
        jeonse: 0,
        rent: 0,
      });
    });

    it("should calculate counts from all trade types", () => {
      const data = [
        { tradetype: "매매", _count: 10 },
        { tradetype: "전세", _count: 5 },
        { tradetype: "월세", _count: 3 },
      ];
      const result = calculateListingCounts(data);

      expect(result).toEqual({
        total: 18,
        sale: 10,
        jeonse: 5,
        rent: 3,
      });
    });

    it("should ignore unknown trade types but count in total", () => {
      const data = [
        { tradetype: "매매", _count: 10 },
        { tradetype: "단기임대", _count: 2 },
      ];
      const result = calculateListingCounts(data);

      expect(result).toEqual({
        total: 12,
        sale: 10,
        jeonse: 0,
        rent: 0,
      });
    });
  });

  describe("calculateCountsDiff", () => {
    it("should calculate positive diff", () => {
      const today = { total: 20, sale: 10, jeonse: 5, rent: 5 };
      const yesterday = { total: 15, sale: 8, jeonse: 4, rent: 3 };

      const result = calculateCountsDiff(today, yesterday);

      expect(result).toEqual({
        total: 5,
        sale: 2,
        jeonse: 1,
        rent: 2,
      });
    });

    it("should calculate negative diff", () => {
      const today = { total: 10, sale: 5, jeonse: 3, rent: 2 };
      const yesterday = { total: 15, sale: 8, jeonse: 4, rent: 3 };

      const result = calculateCountsDiff(today, yesterday);

      expect(result).toEqual({
        total: -5,
        sale: -3,
        jeonse: -1,
        rent: -1,
      });
    });

    it("should handle zero diff", () => {
      const counts = { total: 10, sale: 5, jeonse: 3, rent: 2 };

      const result = calculateCountsDiff(counts, counts);

      expect(result).toEqual({
        total: 0,
        sale: 0,
        jeonse: 0,
        rent: 0,
      });
    });
  });

  describe("calculateListingStats", () => {
    it("should calculate full stats", () => {
      const todayData = [
        { tradetype: "매매", _count: 10 },
        { tradetype: "전세", _count: 5 },
      ];
      const yesterdayData = [
        { tradetype: "매매", _count: 8 },
        { tradetype: "전세", _count: 6 },
      ];

      const result = calculateListingStats(todayData, yesterdayData);

      expect(result).toEqual({
        today: { total: 15, sale: 10, jeonse: 5, rent: 0 },
        yesterday: { total: 14, sale: 8, jeonse: 6, rent: 0 },
        diff: { total: 1, sale: 2, jeonse: -1, rent: 0 },
      });
    });

    it("should handle empty data", () => {
      const result = calculateListingStats([], []);

      expect(result).toEqual({
        today: { total: 0, sale: 0, jeonse: 0, rent: 0 },
        yesterday: { total: 0, sale: 0, jeonse: 0, rent: 0 },
        diff: { total: 0, sale: 0, jeonse: 0, rent: 0 },
      });
    });
  });
});
