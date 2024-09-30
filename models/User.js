const mongoose = require("mongoose");

const uploadSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileId: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  uploadCount: { type: Number, default: 3 },
  uploads: [uploadSchema],
});

module.exports = mongoose.model("User", userSchema);
