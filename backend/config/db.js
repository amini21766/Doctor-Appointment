import mongoose from "mongoose";

export const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(mongoUri, {
    autoIndex: process.env.NODE_ENV !== "production",
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

export default connectDB;