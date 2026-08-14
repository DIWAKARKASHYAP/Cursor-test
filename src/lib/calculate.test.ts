import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateInvestment, calculateAnnualGrowth, sanitizeInputs } from "./calculate.ts";

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
    assert.equal(sanitized.withdrawYears, 1);
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

  it("matches the default 20-year balanced plan", () => {
    const result = calculateInvestment({
      principal: 10_000,
      monthlyContribution: 500,
      annualRatePercent: 8,
      years: 20,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.futureValue, 345741.64);
    assert.equal(result.totalContributed, 130000);
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

  it("stops monthly investing then grows until withdrawal", () => {
    const result = calculateInvestment({
      principal: 0,
      monthlyContribution: 100,
      annualRatePercent: 0,
      years: 2,
      withdrawYears: 4,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.contributeYears, 2);
    assert.equal(result.withdrawYears, 4);
    assert.equal(result.years.length, 4);
    assert.equal(result.totalContributed, 2_400);
    assert.equal(result.futureValue, 2_400);
    assert.equal(result.years[0]?.contributing, true);
    assert.equal(result.years[1]?.contributing, true);
    assert.equal(result.years[2]?.contributing, false);
    assert.equal(result.years[3]?.contributing, false);
    assert.equal(result.years[2]?.contributionsThisYear, 0);
    assert.equal(result.years[1]?.endingBalance, result.valueWhenContributionsStop);
  });

  it("projects 10 years of investing then withdrawal at year 17", () => {
    const result = calculateInvestment({
      principal: 0,
      monthlyContribution: 5000,
      annualRatePercent: 8,
      years: 10,
      withdrawYears: 17,
      annualContributionIncreasePercent: 0,
    });
    const atStop = calculateInvestment({
      principal: 0,
      monthlyContribution: 5000,
      annualRatePercent: 8,
      years: 10,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(result.years.length, 17);
    assert.equal(result.totalContributed, 600_000);
    assert.equal(result.contributeYears, 10);
    assert.equal(result.withdrawYears, 17);
    assert.equal(result.valueWhenContributionsStop, atStop.futureValue);
    assert.ok(result.futureValue > atStop.futureValue);
    assert.equal(result.years[9]?.contributing, true);
    assert.equal(result.years[10]?.contributing, false);
    assert.equal(result.years[16]?.contributing, false);
    assert.equal(result.years[10]?.contributionsThisYear, 0);
  });

  it("keeps compounding after contributions stop", () => {
    const afterOneYear = calculateInvestment({
      principal: 1_000,
      monthlyContribution: 0,
      annualRatePercent: 12,
      years: 1,
      annualContributionIncreasePercent: 0,
    });
    const afterTwoYears = calculateInvestment({
      principal: 1_000,
      monthlyContribution: 0,
      annualRatePercent: 12,
      years: 1,
      withdrawYears: 2,
      annualContributionIncreasePercent: 0,
    });

    assert.equal(afterTwoYears.years.length, 2);
    assert.ok(afterTwoYears.futureValue > afterOneYear.futureValue);
    assert.equal(afterTwoYears.totalContributed, 1_000);
  });
});

describe("calculateAnnualGrowth", () => {
  it("returns 0% when start and end amounts are the same", () => {
    const result = calculateAnnualGrowth({
      startAmount: 10_000,
      endAmount: 10_000,
      years: 5,
    });

    assert.equal(result.error, null);
    assert.equal(result.annualGrowthPercent, 0);
    assert.equal(result.totalGrowthPercent, 0);
    assert.equal(result.profit, 0);
  });

  it("finds yearly compound growth from start, end, and duration", () => {
    const result = calculateAnnualGrowth({
      startAmount: 100_000,
      endAmount: 200_000,
      years: 7,
    });

    assert.equal(result.error, null);
    assert.equal(result.annualGrowthPercent, 10.41);
    assert.equal(result.totalGrowthPercent, 100);
    assert.equal(result.profit, 100_000);
  });

  it("requires a start amount greater than 0", () => {
    const result = calculateAnnualGrowth({
      startAmount: 0,
      endAmount: 50_000,
      years: 3,
    });

    assert.equal(result.annualGrowthPercent, null);
    assert.equal(result.error, "Start amount must be greater than 0.");
  });
});
