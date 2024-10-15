const { drive } = require("../config/googleConfig");
const User = require("../models/User");
const { Readable } = require("stream");

exports.uploadFile = async (req, res) => {
  console.log("[DEBUG] Starting uploadFile function");
  const userId = req.userId;
  const file = req.file;

  console.log(`[DEBUG] User ID: ${userId}`);
  console.log(`[DEBUG] File info:`, file);

  if (!file) {
    console.log("[DEBUG] No file sent");
    return res.status(400).json({ error: "No files sent" });
  }

  try {
    console.log(`[DEBUG] Finding user with ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.error(`[ERROR] User not found for ID: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(`[DEBUG] User found:`, user);

    if (user.uploadCount <= 0) {
      console.log(`[DEBUG] Upload limit reached for user ${userId}`);
      return res.status(403).json({ error: "Upload limit reached (3)" });
    }

    // Create or get folder
    const folderName = `${user.name}_${userId}`;
    let folderId;

    try {
      console.log(`[DEBUG] Searching for folder: ${folderName}`);

      const folderResponse = await drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
        fields: "files(id, name)",
      });

      console.log(
        "[DEBUG] Folder search response:",
        JSON.stringify(folderResponse.data)
      );

      if (
        folderResponse.data &&
        folderResponse.data.files &&
        folderResponse.data.files.length > 0
      ) {
        folderId = folderResponse.data.files[0].id;
        console.log(`[DEBUG] Existing folder found with ID: ${folderId}`);
      } else {
        console.log(
          `[DEBUG] Folder not found. Attempting to create new folder: ${folderName}`
        );

        const newFolderResponse = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          },
        });
        folderId = newFolderResponse.data.id;

        console.log(`[DEBUG] New folder created with ID: ${folderId}`);
      }
    } catch (folderError) {
      console.error("[ERROR] Detailed error handling folder:", folderError);
      console.error("[ERROR] Error stack:", folderError.stack);
      if (folderError.response) {
        console.error("[ERROR] Error response:", folderError.response.data);
      }
      return res.status(500).json({
        error: "Error creating/accessing folder",
        details: folderError.message,
      });
    }

    // Upload file
    try {
      console.log("[DEBUG] Starting file upload process");
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      console.log("[DEBUG] Creating file in Google Drive");
      const response = await drive.files.create({
        requestBody: {
          name: file.originalname,
          mimeType: file.mimetype,
          parents: [folderId],
        },
        media: {
          mimeType: file.mimetype,
          body: bufferStream,
        },
      });

      const fileId = response.data.id;
      console.log(`[DEBUG] File created with ID: ${fileId}`);

      console.log("[DEBUG] Setting file permissions");
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      console.log("[DEBUG] Getting file public URL");
      const result = await drive.files.get({
        fileId: fileId,
        fields: "webViewLink, webContentLink",
      });

      const publicUrl = result.data.webViewLink;
      console.log(`[DEBUG] Public URL: ${publicUrl}`);

      const newUpload = {
        fileName: file.originalname,
        fileId: fileId,
        link: publicUrl,
        uploadDate: new Date(),
      };

      console.log("[DEBUG] Updating user document");
      user.uploads.push(newUpload);
      user.uploadCount -= 1;
      await user.save();

      console.log("[DEBUG] Upload process completed successfully");
      return res.status(200).json({
        message: "Upload completed successfully",
        uploadsRemaining: user.uploadCount,
        uploadInfo: {
          ...response.data,
          link: publicUrl,
          localUploadId: newUpload._id,
        },
      });
    } catch (uploadError) {
      console.error("[ERROR] Error during file upload:", uploadError);
      console.error("[ERROR] Error stack:", uploadError.stack);
      if (uploadError.response) {
        console.error("[ERROR] Error response:", uploadError.response.data);
      }
      return res.status(500).json({
        error: "Error uploading file to Google Drive",
        details: uploadError.message,
      });
    }
  } catch (err) {
    console.error("[ERROR] Unexpected error during upload process:", err);
    console.error("[ERROR] Error stack:", err.stack);
    return res.status(500).json({
      error: "Unexpected error during upload process",
      details: err.message,
    });
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
