import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not defined.");
}

export async function connect() {
  try {
    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      console.log("Using existing MongoDB connection");
      return mongoose.connection;
    }

    // Connection options
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain a minimum of 2 socket connections
    };

    console.log("Creating new MongoDB connection...");
    await mongoose.connect(MONGO_URI, opts);
    
    const connection = mongoose.connection;

    connection.on('connected', () => {
      console.log("MongoDB connected successfully");
    });

    connection.on('error', (err: Error) => {
      console.error('MongoDB connection error:', err);
    });

    return connection;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}