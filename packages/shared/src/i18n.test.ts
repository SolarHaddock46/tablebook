import { describe, expect, it } from "vitest";
import { t } from "./i18n";

describe("i18n dictionary", () => {
  it("contains ru and en values", () => {
    expect(t("ru").search).toBe("Поиск");
    expect(t("en").search).toBe("Search");
  });

  it("uses locale-specific brand titles", () => {
    expect(t("ru").title).toBe("ЗаСтолом");
    expect(t("en").title).toBe("TableBook");
  });

  it("contains language switcher labels", () => {
    expect(t("ru").language).toBe("Язык");
    expect(t("en").language).toBe("Language");
  });
});
