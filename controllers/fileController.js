const fs = require("fs");
const path = require("path");
const { drive } = require("../config/googleConfig");
const User = require("../models/User");
const { Readable } = require("stream");

exports.uploadFile = async (req, res) => {
  const userId = req.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ Erro: "No files sent" });
  }

  try {
    const user = await User.findById(userId);

    if (user.uploadCount > 0) {
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      // Faz upload do arquivo para o Google Drive
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

      const fileId = response.data.id;

      // Gera a URL pública para o arquivo
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

      const publicUrl = result.data.webViewLink;

      // Criar um novo objeto de upload com as informações do arquivo e URL
      const newUpload = {
        fileName: file.originalname,
        fileId: fileId,
        link: publicUrl, // Atribui a URL pública
        uploadDate: new Date(),
      };

      // Adicionar o novo upload ao array de uploads do usuário
      user.uploads.push(newUpload);

      user.uploadCount -= 1;
      await user.save();

      res.status(200).json({
        message: "Upload completed successfully",
        uploadsRestantes: user.uploadCount,
        uploadInfo: {
          ...response.data,
          link: publicUrl,
          localUploadId: newUpload._id,
        },
      });
    } else {
      res.status(403).json({ Erro: "Upload limit reached (3)" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ Erro: "Error processing the upload" });
  }
};

exports.deleteFile = async (req, res) => {
  const userId = req.userId;
  const fileId = req.params.fileId;

  try {
    // 1. Encontre o usuário e verifique se o arquivo existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ Erro: "User not found" });
    }

    const fileIndex = user.uploads.findIndex(
      (upload) => upload.fileId === fileId
    );
    if (fileIndex === -1) {
      return res.status(404).json({ Erro: "File not found in user database" });
    }

    // 2. Tenta deletar o arquivo do Google Drive
    try {
      await drive.files.delete({ fileId: fileId });
    } catch (driveError) {
      console.error("Error deleting file from Google Drive:", driveError);
      // Se o erro for que o arquivo não foi encontrado, continuamos com a deleção no banco de dados
      if (driveError.code !== 404) {
        return res
          .status(500)
          .json({ Erro: "Error deleting file from Google Drive" });
      }
    }

    // 3. Remove o upload do array `uploads`
    user.uploads.splice(fileIndex, 1);

    // 4. Atualiza o contador de uploads restantes
    user.uploadCount += 1;

    // 5. Salva as alterações no usuário
    await user.save();

    res.status(200).json({
      message: "File successfully deleted from Google Drive and database",
      uploadsRestantes: user.uploadCount,
    });
  } catch (err) {
    console.error("Error processing file deletion:", err);
    res.status(500).json({ Erro: "Error processing file deletion" });
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
    console.log("Error generating public URL", err);
    res.status(500).json({ Erro: "Error generating public URL" });
  }
};
