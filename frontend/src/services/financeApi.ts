import { baseApi } from "./baseApi";
import type {
  GetCategoriesResponse,
  CreateCategoryRequest,
  CategoryResponse,
  DeleteResponse,
  GetAccountsResponse,
  CreateAccountRequest,
  AccountResponse,
  GetTransactionsResponse,
  TransactionFilters,
  TransactionResponse,
  GetSummaryResponse,
  SummaryFilters,
} from "../types/finance";

// ─── Helper ───────────────────────────────────────────────────────────────────

// Converts a TransactionFilters object into a URL query string, omitting empty values.
// e.g. { page: 1, type: "expense", search: "" } → "?page=1&type=expense"
function buildTransactionQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.account) params.set("account", filters.account);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return `/finance/transactions${qs ? `?${qs}` : ""}`;
}

// ─── Finance API ──────────────────────────────────────────────────────────────

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Categories ────────────────────────────────────────────────────────────

    getCategories: builder.query<GetCategoriesResponse, void>({
      query: () => "/finance/categories",
      providesTags: ["Categories"],
    }),

    createCategory: builder.mutation<CategoryResponse, CreateCategoryRequest>({
      query: (body) => ({
        url: "/finance/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories"],
    }),

    deleteCategory: builder.mutation<DeleteResponse, string>({
      query: (id) => ({
        url: `/finance/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories"],
    }),

    // ── Accounts ──────────────────────────────────────────────────────────────

    getAccounts: builder.query<GetAccountsResponse, void>({
      query: () => "/finance/accounts",
      providesTags: ["Accounts"],
    }),

    createAccount: builder.mutation<AccountResponse, CreateAccountRequest>({
      query: (body) => ({
        url: "/finance/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Accounts"],
    }),

    deleteAccount: builder.mutation<DeleteResponse, string>({
      query: (id) => ({
        url: `/finance/accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Accounts"],
    }),

    // ── Transactions ──────────────────────────────────────────────────────────

    getTransactions: builder.query<GetTransactionsResponse, TransactionFilters>({
      query: (filters) => buildTransactionQuery(filters),
      providesTags: ["Transactions"],
    }),

    // Transactions are submitted as FormData (multipart/form-data) to support
    // an optional receipt image. fetchBaseQuery detects FormData and does NOT
    // serialize it as JSON, letting the browser set Content-Type with the boundary.
    createTransaction: builder.mutation<TransactionResponse, FormData>({
      query: (formData) => ({
        url: "/finance/transactions",
        method: "POST",
        body: formData,
      }),
      // Creating a transaction changes the account balance and the monthly summary
      invalidatesTags: ["Transactions", "Accounts", "Summary"],
    }),

    updateTransaction: builder.mutation<
      TransactionResponse,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/finance/transactions/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["Transactions", "Accounts", "Summary"],
    }),

    deleteTransaction: builder.mutation<DeleteResponse, string>({
      query: (id) => ({
        url: `/finance/transactions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Transactions", "Accounts", "Summary"],
    }),

    // ── Summary ───────────────────────────────────────────────────────────────

    getSummary: builder.query<GetSummaryResponse, SummaryFilters>({
      query: ({ month, account }) => {
        const params = new URLSearchParams();
        if (month) params.set("month", month);
        if (account) params.set("account", account);
        const qs = params.toString();
        return `/finance/transactions/summary${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Summary"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetSummaryQuery,
} = financeApi;
