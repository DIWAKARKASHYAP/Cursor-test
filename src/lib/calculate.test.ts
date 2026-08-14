import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateInvestment, sanitizeInputs } from "./calculate.ts";

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

describe("sanitizeInputs", () => {
  it("clamps negative values and invalid years", () => {
    const sanitized = sanitizeInputs({
      principal: -100,
      monthlyContribution: -50,
      annualRatePercent: -2,
      years: 0,
      annualContributionIncreasePercent: -1,
    });

    assert.equal(sanitized.principal, 0);
    assert.equal(sanitized.monthlyContribution, 0);
    assert.equal(sanitized.annualRatePercent, 0);
    assert.equal(sanitized.years, 1);
    assert.equal(sanitized.annualContributionIncreasePercent, 0);
  });
});

describe("calculateInvestment", () => {
  it("returns principal after one year with no contributions or growth", () => {
    const result = calculateInvestment({
      principal: 10_000,
      monthlyContribution: 0,
      annualRatePercent: 0,
      years: 1,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.futureValue, 10_000);
    assert.equal(result.totalContributed, 10_000);
    assert.equal(result.totalInterest, 0);
    assert.equal(result.years.length, 1);
  });

  it("adds monthly contributions without growth", () => {
    const result = calculateInvestment({
      principal: 0,
      monthlyContribution: 100,
      annualRatePercent: 0,
      years: 2,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.futureValue, 2_400);
    assert.equal(result.totalContributed, 2_400);
    assert.equal(result.years[1]?.totalContributed, 2_400);
  });

  it("compounds monthly at 12% with no contributions", () => {
    const result = calculateInvestment({
      principal: 1_000,
      monthlyContribution: 0,
      annualRatePercent: 12,
      years: 1,
      annualContributionIncreasePercent: 0,
    });

    const expected = roundToCents(1000 * (1 + 0.12 / 12) ** 12);
    assert.equal(result.futureValue, expected);
    assert.ok(result.totalInterest > 0);
  });

  it("raises monthly contributions each year", () => {
    const result = calculateInvestment({
      principal: 0,
      monthlyContribution: 100,
      annualRatePercent: 0,
      years: 2,
      annualContributionIncreasePercent: 10,
    });

    const year1 = 100 * 12;
    const year2 = 110 * 12;
    assert.equal(result.years[0]?.contributionsThisYear, year1);
    assert.equal(result.years[1]?.contributionsThisYear, year2);
    assert.equal(result.totalContributed, year1 + year2);
  });

  it("produces a projection row for each year", () => {
    const result = calculateInvestment({
      principal: 5_000,
      monthlyContribution: 250,
      annualRatePercent: 8,
      years: 20,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.years.length, 20);
    assert.ok(result.futureValue > result.totalContributed);
    assert.equal(
      result.years.at(-1)?.endingBalance,
      result.futureValue,
    );
  });
});
