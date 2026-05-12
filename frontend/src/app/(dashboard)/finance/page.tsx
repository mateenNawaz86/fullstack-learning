import { SummaryCards } from "@/src/components/finance/SummaryCards";
import { TransactionList } from "@/src/components/finance/TransactionList";
import { AccountList } from "@/src/components/finance/AccountList";
import { CategoryManager } from "@/src/components/finance/CategoryManager";

// Derive the current month as "YYYY-MM" once per page render.
// Passed to SummaryCards so it shows this month's income/expense/net by default.
function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7); // "2026-05"
}

export default function FinancePage() {
  const month = getCurrentMonth();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Finance</h1>
        <p className="mt-1 text-sm text-gray-400">
          {new Date().toLocaleString("en-PK", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Monthly summary cards: income / expenses / net */}
      <SummaryCards month={month} />

      {/* Transactions — the main section: filters, pagination, add/edit/delete */}
      <TransactionList />

      {/* Account and category management — side by side on wider screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AccountList />
        <CategoryManager />
      </div>
    </div>
  );
}
