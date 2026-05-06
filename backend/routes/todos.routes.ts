import express from "express";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "../controllers/todos.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// All todo routes require a valid access token
router.use(protect);

router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
