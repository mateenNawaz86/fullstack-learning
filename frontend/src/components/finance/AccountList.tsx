"use client";

import { useState } from "react";
import {
  useGetAccountsQuery,
  useDeleteAccountMutation,
} from "../../services/financeApi";
import { CreateAccountModal } from "./CreateAccountModal";
import type { Account } from "../../types/finance";

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  cash: "Cash",
  bank: "Bank",
  credit_card: "Credit Card",
  savings: "Savings",
};

// Formats balance with currency code, e.g. 12500 → "PKR 12,500"
function formatBalance(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function AccountList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, isError } = useGetAccountsQuery();
  const [deleteAccount] = useDeleteAccountMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account? This cannot be undone.")) return;
    try {
      await deleteAccount(id).unwrap();
    } catch (err) {
      alert(
        (err as { data?: { message?: string } })?.data?.message ??
          "Failed to delete account."
      );
    }
  };

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Accounts</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white"
          >
            + Add
          </button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-red-400">Failed to load accounts.</p>
        )}

        {!isLoading && !isError && (
          <ul className="space-y-2">
            {data?.accounts.map((account) => (
              <li
                key={account._id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{account.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {ACCOUNT_TYPE_LABELS[account.type]}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      account.balance >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatBalance(account.balance, account.currency)}
                  </span>
                  <button
                    onClick={() => handleDelete(account._id)}
                    className="cursor-pointer text-xs text-red-400/60 transition-colors hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}

            {data?.accounts.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-500">
                No accounts yet. Add one to get started.
              </p>
            )}
          </ul>
        )}
      </div>

      <CreateAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
