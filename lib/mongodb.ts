import mongoose from "mongoose";

// Define the shape of our cached mongoose connection
interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedMongoose | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

const MONGODB_URI: string = process.env.MONGODB_URI;

let cached: CachedMongoose = global.mongoose ?? {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        family: 4, // Use IPv4, skip trying IPv6
      } as mongoose.ConnectOptions;

      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    const mongoose_instance = await cached.promise;
    cached.conn = mongoose_instance;
    return mongoose_instance;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export default connectDB;
