import { describe, expect, it } from "vitest";
import { initialFinanceData } from "./storage";

describe("finance defaults", () => {
  it("starts empty without reading or persisting browser storage", () => {
    expect(initialFinanceData.entries).toEqual([]);
    expect(initialFinanceData.allocations).toEqual([]);
    expect(initialFinanceData.wallets).toHaveLength(2);
  });
});
