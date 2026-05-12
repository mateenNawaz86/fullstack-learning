"use client";

import { useGetSummaryQuery } from "../../services/financeApi";

interface SummaryCardsProps {
  month: string; // "YYYY-MM"
}

// Formats a number as a currency string, e.g. 1234.5 → "1,234.50"
function formatAmount(amount: number, currency: string = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SummaryCards({ month }: SummaryCardsProps) {
  const { data, isLoading, isError } = useGetSummaryQuery({ month });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    );
  }

  if (isError || !data) return null;

  const { income, expense, net } = data.data;

  const cards = [
    {
      label: "Income",
      value: income,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Expenses",
      value: expense,
      color: "text-red-400",
      border: "border-red-500/20",
      bg: "bg-red-500/5",
    },
    {
      label: "Net Balance",
      value: net,
      // Green if positive, red if negative, neutral if zero
      color: net > 0 ? "text-emerald-400" : net < 0 ? "text-red-400" : "text-gray-400",
      border: net > 0 ? "border-emerald-500/20" : net < 0 ? "border-red-500/20" : "border-white/10",
      bg: net > 0 ? "bg-emerald-500/5" : net < 0 ? "bg-red-500/5" : "bg-white/5",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, color, border, bg }) => (
        <div
          key={label}
          className={`rounded-xl border ${border} ${bg} px-5 py-4`}
        >
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className={`mt-1 text-2xl font-semibold ${color}`}>
            {formatAmount(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
