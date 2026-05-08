import { describe, it, expect } from "vitest";
import { isKinyarwandaQuery } from "@/utils/kinyarwandaCorpus";
import { KINYARWANDA_TEST_CASES } from "@/utils/kinyarwandaTestCases";

describe("isKinyarwandaQuery", () => {
  for (const c of KINYARWANDA_TEST_CASES) {
    it(`${c.expected ? "DETECTS" : "REJECTS"}: "${c.text}" (${c.note})`, () => {
      expect(isKinyarwandaQuery(c.text)).toBe(c.expected);
    });
  }
});
