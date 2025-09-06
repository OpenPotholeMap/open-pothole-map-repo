import mongoose from "mongoose"

export const connectDB = async (mongoUri: string) => {
    try {
        console.log("Connecting to database: ", mongoUri);
        await mongoose.connect(mongoUri);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed", error);
        process.exit(1);
    }
}