import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connect to MongoDB database
 */
const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options are no longer needed in Mongoose 6+, but included for compatibility
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

// Handle connection events
mongoose.connection.on("connected", () => {
    console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
    console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
});

export default connectDatabase;
