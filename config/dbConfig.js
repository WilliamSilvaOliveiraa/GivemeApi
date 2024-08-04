const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASS;
    await mongoose.connect(
      `mongodb+srv://${dbUser}:${dbPassword}@jwt.uhtowq0.mongodb.net/?retryWrites=true&w=majority&appName=JWT`
    );
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

module.exports = { connectDB };
