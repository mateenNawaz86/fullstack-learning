import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import todosRoutes from "./routes/todos.routes";
import financeRoutes from "./routes/finance/index";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app = express();
const port = process.env.PORT;

// Set secure HTTP headers (XSS protection, content-type sniffing, etc.)
app.use(helmet());

// Allow cross-origin requests only from the configured client URL
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // required for cookies to be sent cross-origin
  }),
);

// HTTP request logging — "combined" for production (Apache format), "dev" for local
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Parse incoming JSON bodies and cookies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/todos", todosRoutes);
app.use("/api/finance", financeRoutes);

// Health check — used by load balancers and container orchestrators
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Global error handler — must be the last middleware registered
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Reusable shutdown logic for both signals
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down gracefully...`);
      await mongoose.connection.close();
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    };

    // Graceful shutdown on SIGTERM (Docker / Kubernetes stop signal)
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // Graceful shutdown on SIGINT (Ctrl+C in terminal)
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Server startup failed:", (error as Error).message);
    process.exit(1);
  }
};

startServer();
