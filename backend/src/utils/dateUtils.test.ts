import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getKSTNow,
  getTodayKSTRange,
  getYesterdayKSTRange,
  getPastDaysKSTRange,
  formatDateKST,
  getTodayKSTString,
} from "./dateUtils.js";

describe("dateUtils", () => {
  describe("getKSTNow", () => {
    it("should return current time offset by +9 hours", () => {
      const before = new Date();
      const kstNow = getKSTNow();
      const after = new Date();

      const expectedMin = before.getTime() + 9 * 60 * 60 * 1000;
      const expectedMax = after.getTime() + 9 * 60 * 60 * 1000;

      expect(kstNow.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(kstNow.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe("getTodayKSTRange", () => {
    it("should return a 24-hour range", () => {
      const { startTime, endTime } = getTodayKSTRange();
      const diff = endTime.getTime() - startTime.getTime();

      expect(diff).toBe(24 * 60 * 60 * 1000);
    });

    it("should have startTime before endTime", () => {
      const { startTime, endTime } = getTodayKSTRange();
      expect(startTime.getTime()).toBeLessThan(endTime.getTime());
    });
  });

  describe("getYesterdayKSTRange", () => {
    it("should return a 24-hour range", () => {
      const { startTime, endTime } = getYesterdayKSTRange();
      const diff = endTime.getTime() - startTime.getTime();

      expect(diff).toBe(24 * 60 * 60 * 1000);
    });

    it("should end when today starts", () => {
      const yesterday = getYesterdayKSTRange();
      const today = getTodayKSTRange();

      expect(yesterday.endTime.getTime()).toBe(today.startTime.getTime());
    });

    it("should start 24 hours before today starts", () => {
      const yesterday = getYesterdayKSTRange();
      const today = getTodayKSTRange();

      const diff = today.startTime.getTime() - yesterday.startTime.getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("getPastDaysKSTRange", () => {
    it("should return range for 1 day (today only)", () => {
      const range = getPastDaysKSTRange(1);
      const today = getTodayKSTRange();

      expect(range.startTime.getTime()).toBe(today.startTime.getTime());
      expect(range.endTime.getTime()).toBe(today.endTime.getTime());
    });

    it("should return range for 7 days", () => {
      const range = getPastDaysKSTRange(7);
      const today = getTodayKSTRange();

      const expectedDiff = 7 * 24 * 60 * 60 * 1000;
      const actualDiff = range.endTime.getTime() - range.startTime.getTime();

      expect(actualDiff).toBe(expectedDiff);
      expect(range.endTime.getTime()).toBe(today.endTime.getTime());
    });
  });

  describe("formatDateKST", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = formatDateKST(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should apply KST offset correctly", () => {
      // 2024-01-15 15:00 UTC = 2024-01-16 00:00 KST
      const date = new Date("2024-01-15T15:00:00Z");
      const formatted = formatDateKST(date);

      expect(formatted).toBe("2024-01-16");
    });
  });

  describe("getTodayKSTString", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const result = getTodayKSTString();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
