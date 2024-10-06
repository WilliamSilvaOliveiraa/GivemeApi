const express = require("express");
const { connectDB } = require("./config/dbConfig");

require("dotenv").config();

//Routes
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const UserRoutes = require("./routes/userRoutes");

// Inicializar o app
const app = express();
app.use(express.json());

// Conectar ao MongoDB
connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/file", fileRoutes);
app.use("/token", tokenRoutes);
app.use("/user", UserRoutes);

const PORT = process.env.PORT;

// Inicializar o servidor
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
