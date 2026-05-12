"use client";

import { useState } from "react";
import { useDeleteTransactionMutation } from "../../services/financeApi";
import { EditTransactionModal } from "./EditTransactionModal";
import type { Transaction } from "../../types/finance";

interface TransactionItemProps {
  transaction: Transaction;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation();

  const handleDelete = async () => {
    if (!confirm("Delete this transaction?")) return;
    await deleteTransaction(transaction._id);
  };

  const isIncome = transaction.type === "income";

  return (
    <>
      <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:bg-white/[0.07]">
        {/* Type indicator dot */}
        <span
          className={`size-2 shrink-0 rounded-full ${
            isIncome ? "bg-emerald-400" : "bg-red-400"
          }`}
        />

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">
              {transaction.title}
            </p>
            {/* Category badge with its color */}
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: transaction.category.color + "33" /* 20% opacity */ }}
            >
              <span style={{ color: transaction.category.color }}>
                {transaction.category.name}
              </span>
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            <span>{transaction.account.name}</span>
            <span>·</span>
            <span>{formatDate(transaction.date)}</span>
            {transaction.notes && (
              <>
                <span>·</span>
                <span className="truncate max-w-[160px]">{transaction.notes}</span>
              </>
            )}
          </div>
        </div>

        {/* Amount + receipt link + actions */}
        <div className="flex shrink-0 items-center gap-3">
          {transaction.receiptUrl && (
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View receipt"
              className="text-xs text-gray-500 transition-colors hover:text-gray-300"
            >
              📎
            </a>
          )}

          <span
            className={`text-sm font-semibold ${
              isIncome ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isIncome ? "+" : "−"}
            {formatAmount(transaction.amount, transaction.account.currency)}
          </span>

          <button
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      <EditTransactionModal
        transaction={transaction}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
