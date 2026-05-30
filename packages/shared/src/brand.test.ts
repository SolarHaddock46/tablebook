import { describe, expect, it } from "vitest";
import { getBrandName } from "./brand";

describe("getBrandName", () => {
  it("returns ЗаСтолом for ru", () => {
    expect(getBrandName("ru")).toBe("ЗаСтолом");
  });

  it("returns TableBook for en", () => {
    expect(getBrandName("en")).toBe("TableBook");
  });
});
