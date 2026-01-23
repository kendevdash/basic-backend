import dotenv from "dotenv";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

let memoryServer = null;

/**
 * Connect to MongoDB with optional in-memory fallback.
 * Priority:
 * 1) process.env.MONGODB_URI or process.env.MONGO_URI
 * 2) In-memory Mongo when USE_IN_MEMORY_DB=true or no URI provided
 */
export const connectDB = async () => {
	try {
		let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

		if (process.env.USE_IN_MEMORY_DB === "true" || !uri) {
			memoryServer = await MongoMemoryServer.create();
			uri = memoryServer.getUri();
			console.log(`Using in-memory MongoDB at ${uri}`);
		}

		await mongoose.connect(uri);
		console.log("MongoDB connected");

		return { uri, memoryServer };
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error.message);
		throw error;
	}
};
