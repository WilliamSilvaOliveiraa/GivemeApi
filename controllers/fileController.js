const fs = require("fs");
const path = require("path");
const { drive } = require("../config/googleConfig");
const User = require("../models/User");

exports.uploadFile = async (req, res) => {
  const userId = req.userId;
  const { fileName, filePath } = req.body;

  try {
    const user = await User.findById(userId);

    if (user.uploadCount > 0) {
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: "image/png",
        },
        media: {
          mimeType: "image/png",
          body: fs.createReadStream(filePath),
        },
      });

      user.uploadCount -= 1;
      await user.save();

      res.status(200).json({
        message: "Upload realizado com sucesso",
        uploadsRestantes: user.uploadCount,
        uploadInfo: response.data,
      });
    } else {
      res.status(403).json({ Erro: "Limite de uploads atingido" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ Erro: "Erro ao processar o upload" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const response = await drive.files.delete({
      fileId: req.params.fileId,
    });
    res
      .status(200)
      .json({ message: "Arquivo deletado com sucesso", data: response.data });
  } catch (err) {
    console.log("Erro ao deletar arquivo", err);
    res.status(500).json({ Erro: "Erro ao deletar arquivo" });
  }
};

exports.generatePublicUrl = async (req, res) => {
  try {
    const fileId = req.params.fileId;
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

    res.status(200).json(result.data);
  } catch (err) {
    console.log("Erro ao gerar URL pública", err);
    res.status(500).json({ Erro: "Erro ao gerar URL pública" });
  }
};
