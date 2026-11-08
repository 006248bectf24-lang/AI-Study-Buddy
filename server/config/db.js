import mongoose from "mongoose";

// Connects to MongoDB using the URI from .env
const connectDB = async () => {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
