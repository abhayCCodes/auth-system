const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("⏳ Initializing MongoDB connection sequence...");
    
    // Forces Mongoose 7+ to handle queries smoothly
    mongoose.set('strictQuery', false);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging for 2 minutes
      socketTimeoutMS: 45000,         // Close inactive sockets after 45s
    });
    
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ Critical MongoDB connection failure:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;