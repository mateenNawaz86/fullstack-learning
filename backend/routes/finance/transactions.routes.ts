import express from "express";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} from "../../controllers/transactions.controller";
import { validate } from "../../middleware/validate";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../../validations/transaction.schema";
import { upload } from "../../lib/upload";

const router = express.Router();

// ── MIDDLEWARE ORDER ON POST / PATCH ──────────────────────────────────────────
// The order is critical and intentional:
//
//   1. upload.single("receipt")
//      Multer parses the multipart/form-data request.
//      After this: req.body has the text fields, req.file has the image (or undefined).
//
//   2. validate(schema)
//      Zod validates req.body. It must run AFTER Multer because req.body is empty
//      until Multer parses the multipart request.
//
//   3. controller
//      Runs only when input is valid. req.body has clean, coerced data.
//
// If there's no file, req.file is undefined and req.body still gets populated
// normally — the upload middleware is a no-op for JSON or missing file fields.

router.get("/", getTransactions);
router.get("/summary", getSummary); // must be defined before /:id or Express matches "summary" as an id
router.post("/", upload.single("receipt"), validate(createTransactionSchema), createTransaction);
router.patch("/:id", upload.single("receipt"), validate(updateTransactionSchema), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
