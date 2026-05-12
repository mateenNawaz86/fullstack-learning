"use client";

import { useState } from "react";
import { useGetTransactionsQuery } from "../../services/financeApi";
import { useGetCategoriesQuery } from "../../services/financeApi";
import { useGetAccountsQuery } from "../../services/financeApi";
import { TransactionItem } from "./TransactionItem";
import { CreateTransactionModal } from "./CreateTransactionModal";
import type { TransactionFilters } from "../../types/finance";

export function TransactionList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters are held in component state. When any filter changes we reset to page 1
  // so the user always sees results from the beginning of the filtered set.
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isError, isFetching } = useGetTransactionsQuery(filters);
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data: accountsData } = useGetAccountsQuery();

  // Helper: update one filter key and reset to page 1
  const setFilter = <K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K],
  ) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const pagination = data?.pagination;

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Transactions</h2>
            {pagination && (
              <p className="mt-0.5 text-xs text-gray-500">
                {pagination.total} total
              </p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            + Add
          </button>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        {/* Each control updates the filters state; the RTK Query hook re-runs automatically */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search…"
            value={filters.search ?? ""}
            onChange={(e) => setFilter("search", e.target.value || undefined)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Type filter */}
          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilter("type", (e.target.value as TransactionFilters["type"]) || undefined)
            }
            className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category filter */}
          <select
            value={filters.category ?? ""}
            onChange={(e) => setFilter("category", e.target.value || undefined)}
            className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
          >
            <option value="">All categories</option>
            {categoriesData?.categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Account filter */}
          <select
            value={filters.account ?? ""}
            onChange={(e) => setFilter("account", e.target.value || undefined)}
            className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
          >
            <option value="">All accounts</option>
            {accountsData?.accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => setFilter("startDate", e.target.value || undefined)}
            title="From date"
            className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
          />
          <input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => setFilter("endDate", e.target.value || undefined)}
            title="To date"
            className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/60"
          />

          {/* Clear all filters */}
          {Object.keys(filters).some(
            (k) => k !== "page" && k !== "limit" && filters[k as keyof TransactionFilters],
          ) && (
            <button
              onClick={() => setFilters({ page: 1, limit: 10 })}
              className="cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Transaction list ─────────────────────────────────────────────── */}
        {/* isFetching is true during any re-fetch (filter change, page change).
            isLoading is only true on the very first load. We show a subtle opacity
            change during refetches so the user knows new data is coming. */}
        <div className={`space-y-2 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5"
              />
            ))}

          {isError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400"
            >
              Failed to load transactions. Please try again.
            </div>
          )}

          {!isLoading && !isError && data?.data.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">
              No transactions found.{" "}
              {Object.keys(filters).some(
                (k) => k !== "page" && k !== "limit" && filters[k as keyof TransactionFilters],
              )
                ? "Try clearing some filters."
                : "Add one above!"}
            </p>
          )}

          {!isLoading &&
            !isError &&
            data?.data.map((transaction) => (
              <TransactionItem key={transaction._id} transaction={transaction} />
            ))}
        </div>

        {/* ── Pagination controls ──────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
                }
                disabled={pagination.page <= 1 || isFetching}
                className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
                }
                disabled={pagination.page >= pagination.totalPages || isFetching}
                className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
