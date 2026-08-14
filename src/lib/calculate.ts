export type CalculatorInputs = {
  principal: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  withdrawYears?: number;
  annualContributionIncreasePercent: number;
};

export type YearProjection = {
  year: number;
  contributing: boolean;
  contributionsThisYear: number;
  interestThisYear: number;
  endingBalance: number;
  totalContributed: number;
};

export type CalculatorResult = {
  futureValue: number;
  totalContributed: number;
  totalInterest: number;
  contributeYears: number;
  withdrawYears: number;
  valueWhenContributionsStop: number | null;
  years: YearProjection[];
};

const MONTHS_PER_YEAR = 12;

function isFiniteNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sanitizeInputs(inputs: CalculatorInputs): CalculatorInputs & {
  contributeYears: number;
  withdrawYears: number;
} {
  const contributeYears = Math.min(
    60,
    Math.max(1, Math.round(isFiniteNumber(inputs.years) ? inputs.years : 1)),
  );
  const requestedWithdraw = isFiniteNumber(inputs.withdrawYears)
    ? Math.round(inputs.withdrawYears)
    : contributeYears;
  const withdrawYears = Math.min(60, Math.max(contributeYears, requestedWithdraw));

  return {
    principal: Math.max(0, isFiniteNumber(inputs.principal) ? inputs.principal : 0),
    monthlyContribution: Math.max(
      0,
      isFiniteNumber(inputs.monthlyContribution) ? inputs.monthlyContribution : 0,
    ),
    annualRatePercent: Math.min(
      50,
      Math.max(0, isFiniteNumber(inputs.annualRatePercent) ? inputs.annualRatePercent : 0),
    ),
    years: contributeYears,
    withdrawYears,
    contributeYears,
    annualContributionIncreasePercent: Math.min(
      20,
      Math.max(
        0,
        isFiniteNumber(inputs.annualContributionIncreasePercent)
          ? inputs.annualContributionIncreasePercent
          : 0,
      ),
    ),
  };
}

export function calculateInvestment(rawInputs: CalculatorInputs): CalculatorResult {
  const inputs = sanitizeInputs(rawInputs);
  const monthlyRate = inputs.annualRatePercent / 100 / MONTHS_PER_YEAR;
  const contributionGrowth = inputs.annualContributionIncreasePercent / 100;

  let balance = inputs.principal;
  let totalContributed = inputs.principal;
  let valueWhenContributionsStop: number | null = null;
  const years: YearProjection[] = [];

  for (let year = 1; year <= inputs.withdrawYears; year += 1) {
    const startBalance = balance;
    const contributing = year <= inputs.contributeYears;
    const monthlyContribution = contributing
      ? inputs.monthlyContribution * (1 + contributionGrowth) ** (year - 1)
      : 0;
    let contributionsThisYear = 0;

    for (let month = 0; month < MONTHS_PER_YEAR; month += 1) {
      balance += monthlyContribution;
      contributionsThisYear += monthlyContribution;
      totalContributed += monthlyContribution;
      balance *= 1 + monthlyRate;
    }

    const endingBalance = roundCents(balance);

    if (year === inputs.contributeYears) {
      valueWhenContributionsStop = endingBalance;
    }

    years.push({
      year,
      contributing,
      contributionsThisYear: roundCents(contributionsThisYear),
      interestThisYear: roundCents(balance - startBalance - contributionsThisYear),
      endingBalance,
      totalContributed: roundCents(totalContributed),
    });
  }

  const futureValue = roundCents(balance);
  const contributed = roundCents(totalContributed);

  return {
    futureValue,
    totalContributed: contributed,
    totalInterest: roundCents(futureValue - contributed),
    contributeYears: inputs.contributeYears,
    withdrawYears: inputs.withdrawYears,
    valueWhenContributionsStop:
      inputs.withdrawYears > inputs.contributeYears ? valueWhenContributionsStop : null,
    years,
  };
}

export type GrowthInputs = {
  startAmount: number;
  endAmount: number;
  years: number;
};

export type GrowthResult = {
  annualGrowthPercent: number | null;
  totalGrowthPercent: number | null;
  profit: number;
  years: number;
  error: string | null;
};

export function calculateAnnualGrowth(raw: GrowthInputs): GrowthResult {
  const startAmount = Math.max(
    0,
    isFiniteNumber(raw.startAmount) ? raw.startAmount : 0,
  );
  const endAmount = Math.max(0, isFiniteNumber(raw.endAmount) ? raw.endAmount : 0);
  const years = Math.min(
    60,
    Math.max(1, Math.round(isFiniteNumber(raw.years) ? raw.years : 1)),
  );
  const profit = roundCents(endAmount - startAmount);

  if (startAmount <= 0) {
    return {
      annualGrowthPercent: null,
      totalGrowthPercent: null,
      profit,
      years,
      error: "Start amount must be greater than 0.",
    };
  }

  const totalGrowthPercent = ((endAmount - startAmount) / startAmount) * 100;
  const annualGrowthPercent = ((endAmount / startAmount) ** (1 / years) - 1) * 100;

  return {
    annualGrowthPercent: Number(annualGrowthPercent.toFixed(2)),
    totalGrowthPercent: Number(totalGrowthPercent.toFixed(2)),
    profit,
    years,
    error: null,
  };
}
