import express from "express";
import accountsRouter from "./accounts.routes";
import categoriesRouter from "./categories.routes";
import transactionsRouter from "./transactions.routes";
import { protect } from "../../middleware/auth.middleware";

const router = express.Router();

// Applying protect here means EVERY route under /api/finance is protected.
// We don't need to add protect individually to each sub-router.
// This is the same pattern as router.use(protect) in todos.routes.ts, but
// centralised here so all finance routes share one auth gate.
router.use(protect);

router.use("/categories", categoriesRouter);
router.use("/accounts", accountsRouter);
router.use("/transactions", transactionsRouter);

export default router;
