import express from "express";
import { getUsers, updateUser } from "../controllers/users.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// All user routes require a valid access token
router.get("/", protect, getUsers);

// PATCH is used because this is a partial update — only provided fields are changed
router.patch("/:id", protect, updateUser);

export default router;
