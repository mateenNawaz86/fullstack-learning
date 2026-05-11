import express from "express";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../../controllers/accounts.controller";
import { validate } from "../../middleware/validate";
import {
  createAccountSchema,
  updateAccountSchema,
} from "../../validations/account.schema";

const router = express.Router();

router.get("/", getAccounts);
router.post("/", validate(createAccountSchema), createAccount);
router.patch("/:id", validate(updateAccountSchema), updateAccount);
router.delete("/:id", deleteAccount);

export default router;
