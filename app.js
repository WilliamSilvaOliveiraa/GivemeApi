/* imports */
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/dbConfig");
require("dotenv").config();

/* app config */
const app = express();

//Middleware
app.use(express.json());
app.use(cors());

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// Conexão com o banco de dados
connectDB();

//Routes
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const UserRoutes = require("./routes/userRoutes");

//Credentials
const PORT = process.env.PORT;

// Routes
app.use("/auth", authRoutes);
app.use("/file", fileRoutes);
app.use("/token", tokenRoutes);
app.use("/user", UserRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
app.get("/", (req, res) => {
  res.status(200).json({ message: "Estou funcionando!" });
});
