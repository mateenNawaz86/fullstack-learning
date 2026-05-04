import express from "express";
import { getUsers } from "../controllers/users.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// All user routes require a valid access token
router.get("/", protect, getUsers);

export default router;
