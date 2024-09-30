/* imports */
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

/* variables */
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const refresh_token = process.env.REFRESH_TOKEN;

/* app config */
const app = express();

//Middleware
app.use(express.json());

//Models
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const tokenRoutes = require("./routes/tokenRoutes");

//Credentials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

const multer = require("multer");

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose
  .connect(
    // console.log(dbUser, dbPassword),
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

app.listen(3000, () => console.log("Server is running"));
app.get("/", (req, res) => {
  res.status(200).json({ message: "Estou funcionando!" });
});

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

oauth2Client.setCredentials({ refresh_token: refresh_token });

const drive = google.drive({ version: "v3", auth: oauth2Client });

const filePath = path.resolve(__dirname, "teste.png");

fs.access(filePath, fs.constants.F_OK, (err) => {
  console.log(`${filePath} ${err ? "não existe" : "existe"}`);
});

async function deleteFile() {
  try {
    const response = await drive.files.delete({
      fileId: "1InU48x8Lry1pO_KlLrgSKPc6zOG2B9Ac",
    });
    console.log(response.data, "deletado");
  } catch (err) {
    console.log("Erro para deletar imagem", err);
  }
}

// deleteFile();

async function generatePublicUrl() {
  try {
    const fileId = "1Zuqb9oxFw8HKPyfXTSsakA4700agdudF";
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const result = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink, webContentLink",
    });

    console.log(result.data);
  } catch (err) {
    console.log("Erro para gerar url publica", err);
  }
}

// generatePublicUrl();

//private route

app.get("/auth/user/:id", checkToken, async (req, res) => {
  const { id } = req.params;

  // Check if the ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ Erro: "ID inválido" });
  }

  try {
    const user = await User.findById(id, "-password");
    if (!user) {
      return res.status(422).json({ Erro: "Usuario não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Erro: "Erro ao buscar usuário" });
  }
});

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ Erro: "Acesso negado" });
  }

  try {
    const secret = process.env.SECRET;
    const verified = jwt.verify(token, secret);
    req.userId = verified.userId; // Adiciona o userId ao objeto req
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ Erro: "Erro ao verificar token" });
  }
}

app.post("/upload", checkToken, async (req, res) => {
  const userId = req.userId; // ID do usuário extraído pelo middleware checkToken
  const { fileName, filePath } = req.body; // Supondo que o nome e caminho do arquivo sejam passados no corpo da requisição

  try {
    const user = await User.findById(userId);

    if (user.uploadCount > 0) {
      // Permitir upload e chamar a função uploadFile
      const uploadResponse = await uploadFile(fileName, filePath);

      // Diminuir o contador de uploads
      user.uploadCount -= 1;
      await user.save();

      res.status(200).json({
        message: "Upload realizado com sucesso",
        uploadsRestantes: user.uploadCount,
        uploadInfo: uploadResponse,
      });
    } else {
      res.status(403).json({ Erro: "Limite de uploads atingido" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ Erro: "Erro ao processar o upload" });
  }
});
