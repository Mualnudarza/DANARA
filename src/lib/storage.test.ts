// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { initialFinanceData, loadLocalData, saveLocalData } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial data when localStorage is empty", () => {
    const data = loadLocalData();
    expect(data.wallets.length).toBeGreaterThan(0);
    expect(data.entries).toEqual([]);
  });

  it("saves and loads data accurately", () => {
    const custom = {
      ...initialFinanceData,
      wallets: [{ id: "w-test", name: "Dompet Test", account: "Cash", color: "#000" }],
    };
    saveLocalData(custom);
    const loaded = loadLocalData();
    expect(loaded.wallets).toEqual(custom.wallets);
  });
});
