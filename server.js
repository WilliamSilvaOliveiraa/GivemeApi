const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

// Importar configurações e rotas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const { connectDB } = require("./config/dbConfig");

// Inicializar o app
const app = express();
app.use(express.json());

// Conectar ao MongoDB
connectDB();

// Configurar rotas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/files", fileRoutes);

const PORT = process.env.PORT;

// Inicializar o servidor
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
