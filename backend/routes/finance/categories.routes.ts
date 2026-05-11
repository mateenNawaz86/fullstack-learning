import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/categories.controller";
import { validate } from "../../middleware/validate";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../../validations/category.schema";

const router = express.Router();

// validate() runs BEFORE the controller.
// If validation fails → 422 is returned and the controller never executes.
// If validation passes → req.body is replaced with Zod's parsed (clean) data.
router.get("/", getCategories);
router.post("/", validate(createCategorySchema), createCategory);
router.patch("/:id", validate(updateCategorySchema), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
