export interface Category {
  _id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  _id: string;
  name: string;
  type: "cash" | "bank" | "credit_card" | "savings";
  balance: number;
  currency: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

// After .populate(), category and account are embedded objects, not just IDs.
export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: Category;
  account: Account;
  date: string;
  notes?: string;
  receiptUrl?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

// Passed to useGetTransactionsQuery — each field maps to a backend query param.
export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: "income" | "expense" | "";
  category?: string;
  account?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ─── Category API ─────────────────────────────────────────────────────────────

export interface GetCategoriesResponse {
  success: boolean;
  count: number;
  categories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  type: "income" | "expense";
  color?: string;
}

export interface CategoryResponse {
  success: boolean;
  category: Category;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ─── Account API ──────────────────────────────────────────────────────────────

export interface GetAccountsResponse {
  success: boolean;
  count: number;
  accounts: Account[];
}

export interface CreateAccountRequest {
  name: string;
  type: Account["type"];
  balance?: number;
  currency?: string;
}

export interface AccountResponse {
  success: boolean;
  account: Account;
}

// ─── Transaction API ──────────────────────────────────────────────────────────

export interface GetTransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: Pagination;
}

// Transactions are sent as FormData (multipart) to support file uploads.
// The API service builds the FormData from these values.
export interface CreateTransactionRequest {
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  account: string;
  date?: string;
  notes?: string;
  receipt?: File;
}

export interface TransactionResponse {
  success: boolean;
  transaction: Transaction;
}

// ─── Summary API ──────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  category: string;
  color: string;
  type: "income" | "expense";
  total: number;
  count: number;
}

export interface SummaryData {
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  byCategory: CategoryBreakdown[];
}

export interface GetSummaryResponse {
  success: boolean;
  data: SummaryData;
}

export interface SummaryFilters {
  month?: string; // "YYYY-MM"
  account?: string;
}
