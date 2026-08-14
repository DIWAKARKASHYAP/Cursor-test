import { formatCurrency } from "@/lib/format";
import type { YearProjection } from "@/lib/calculate";

export function ProjectionTable({ years }: { years: YearProjection[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Money you get after each year</caption>
        <thead>
          <tr className="border-b border-mist text-ink-soft">
            <th scope="col" className="py-3 pr-4 font-medium">
              Year
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              Phase
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              Invested this year (Rs.)
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              Total invested (Rs.)
            </th>
            <th scope="col" className="py-3 pr-4 font-medium">
              Interest this year (Rs.)
            </th>
            <th scope="col" className="py-3 font-medium">
              Money you get (Rs.)
            </th>
          </tr>
        </thead>
        <tbody>
          {years.map((row) => (
            <tr key={row.year} className="border-b border-mist/70 last:border-0">
              <th scope="row" className="py-3 pr-4 font-semibold text-ink">
                {row.year}
              </th>
              <td className="py-3 pr-4 text-ink-soft">
                {row.contributing ? "Investing" : "Growing only"}
              </td>
              <td className="py-3 pr-4 text-ink-soft">
                {formatCurrency(row.contributionsThisYear)}
              </td>
              <td className="py-3 pr-4 text-ink-soft">
                {formatCurrency(row.totalContributed)}
              </td>
              <td className="py-3 pr-4 text-tide-deep">
                {formatCurrency(row.interestThisYear)}
              </td>
              <td className="py-3 font-semibold text-ink">
                {formatCurrency(row.endingBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
