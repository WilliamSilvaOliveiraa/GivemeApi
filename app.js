/* imports */
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

/* app config */
const app = express();

//Middleware
app.use(express.json());
app.use(cors());

app.use(
  cors({
    origin: "http://localhost:5173", // permite apenas esse domínio
  })
);

//Routes
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const UserRoutes = require("./routes/userRoutes");

//Credentials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const PORT = process.env.PORT;

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@jwt.uhtowq0.mongodb.net/?retryWrites=true&w=majority&appName=JWT`
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

//AuthUser
app.use("/auth", authRoutes);

//File
app.use("/file", fileRoutes);

//Token
app.use("/token", tokenRoutes);

//User
app.use("/user", UserRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
app.get("/", (req, res) => {
  res.status(200).json({ message: "Estou funcionando!" });
});
