import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency } from "./format.ts";

describe("formatCurrency", () => {
  it("uses Rs. prefix and Indian grouping", () => {
    assert.equal(formatCurrency(0), "Rs. 0");
    assert.equal(formatCurrency(500), "Rs. 500");
    assert.equal(formatCurrency(12000), "Rs. 12,000");
    assert.equal(formatCurrency(417924), "Rs. 4,17,924");
    assert.equal(formatCurrency(12345678), "Rs. 1,23,45,678");
  });
});
