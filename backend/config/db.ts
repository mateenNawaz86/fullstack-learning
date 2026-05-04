import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      // Auto-indexing is safe in dev but can cause write locks on large collections in production
      autoIndex: process.env.NODE_ENV !== "production",
      connectTimeoutMS: 10000, // abort connection attempt after 10s
      socketTimeoutMS: 45000,  // close idle sockets after 45s
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Error] MongoDB Connection Failed: ${(error as Error).message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("[Database] MongoDB disconnected.");
});

mongoose.connection.on("error", (err: Error) => {
  console.error(`[Database] Connection error: ${err.message}`);
});

export default connectDB;
