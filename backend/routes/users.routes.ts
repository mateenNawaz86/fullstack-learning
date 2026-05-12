import express from "express";
import { getUsers, updateUser, uploadAvatar } from "../controllers/users.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../lib/upload";

const router = express.Router();

// All user routes require a valid access token
router.get("/", protect, getUsers);

// PATCH is used because this is a partial update — only provided fields are changed
router.patch("/:id", protect, updateUser);

// Separate avatar-only endpoint so the text-update route stays plain JSON.
// upload.single("avatar") must run before the controller so req.file is populated.
router.patch("/:id/avatar", protect, upload.single("avatar"), uploadAvatar);

export default router;
