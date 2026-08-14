import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency } from "./format.ts";

describe("formatCurrency", () => {
  it("uses the rupee symbol and Indian grouping", () => {
    assert.equal(formatCurrency(0), "₹0");
    assert.equal(formatCurrency(500), "₹500");
    assert.equal(formatCurrency(12000), "₹12,000");
    assert.equal(formatCurrency(417924), "₹4,17,924");
    assert.equal(formatCurrency(12345678), "₹1,23,45,678");
  });
});
