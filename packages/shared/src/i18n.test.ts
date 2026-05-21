import { describe, expect, it } from "vitest";
import { t } from "./i18n";

describe("i18n dictionary", () => {
  it("contains ru and en values", () => {
    expect(t("ru").search).toBe("Поиск");
    expect(t("en").search).toBe("Search");
  });
});
