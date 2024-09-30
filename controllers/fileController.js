const fs = require("fs");
const path = require("path");
const { drive } = require("../config/googleConfig");
const User = require("../models/User");
const { Readable } = require("stream");

exports.uploadFile = async (req, res) => {
  const userId = req.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ Erro: "Nenhum arquivo enviado" });
  }

  try {
    const user = await User.findById(userId);

    if (user.uploadCount > 0) {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          mimeType: file.mimetype,
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
      });

      // Criar um novo objeto de upload com as informações do arquivo
      const newUpload = {
        fileName: file.originalname,
        fileId: response.data.id, // Salvando o ID do arquivo do Google Drive
        uploadDate: new Date(),
      };

      // Adicionar o novo upload ao array de uploads do usuário
      user.uploads.push(newUpload);

      user.uploadCount -= 1;
      await user.save();

      res.status(200).json({
        message: "Upload realizado com sucesso",
        uploadsRestantes: user.uploadCount,
        uploadInfo: {
          ...response.data,
          localUploadId: newUpload._id,
        },
      });
    } else {
      res.status(403).json({ Erro: "Limite de uploads atingido" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ Erro: "Erro ao processar o upload" });
  }
};

exports.deleteFile = async (req, res) => {
  const userId = req.userId; // Supondo que você tenha o ID do usuário na requisição
  const fileId = req.params.fileId; // O ID do arquivo do Google Drive

  try {
    // 1. Tenta deletar o arquivo do Google Drive
    const response = await drive.files.delete({
      fileId: fileId,
    });

    // 2. Agora, remova o arquivo do banco de dados
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ Erro: "Usuário não encontrado" });
    }

    // Remove o upload do array `uploads`
    user.uploads = user.uploads.filter((upload) => upload.fileId !== fileId);

    // Atualiza o contador de uploads restantes
    user.uploadCount += 1;

    // Salva as alterações no usuário
    await user.save();

    res.status(200).json({
      message:
        "Arquivo deletado com sucesso do Google Drive e do banco de dados",
      data: response.data,
    });
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
