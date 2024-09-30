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
  const userId = req.userId;
  const fileId = req.params.fileId;

  try {
    // 1. Encontre o usuário e verifique se o arquivo existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ Erro: "Usuário não encontrado" });
    }

    const fileIndex = user.uploads.findIndex(
      (upload) => upload.fileId === fileId
    );
    if (fileIndex === -1) {
      return res
        .status(404)
        .json({ Erro: "Arquivo não encontrado no banco de dados do usuário" });
    }

    // 2. Tenta deletar o arquivo do Google Drive
    try {
      await drive.files.delete({ fileId: fileId });
    } catch (driveError) {
      console.error("Erro ao deletar arquivo do Google Drive:", driveError);
      // Se o erro for que o arquivo não foi encontrado, continuamos com a deleção no banco de dados
      if (driveError.code !== 404) {
        return res
          .status(500)
          .json({ Erro: "Erro ao deletar arquivo do Google Drive" });
      }
    }

    // 3. Remove o upload do array `uploads`
    user.uploads.splice(fileIndex, 1);

    // 4. Atualiza o contador de uploads restantes
    user.uploadCount += 1;

    // 5. Salva as alterações no usuário
    await user.save();

    res.status(200).json({
      message:
        "Arquivo deletado com sucesso do Google Drive e do banco de dados",
      uploadsRestantes: user.uploadCount,
    });
  } catch (err) {
    console.error("Erro ao processar a deleção do arquivo:", err);
    res.status(500).json({ Erro: "Erro ao processar a deleção do arquivo" });
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
