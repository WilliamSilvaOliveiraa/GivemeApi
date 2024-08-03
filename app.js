const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

console.log("rodou");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const refresh_token = process.env.REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

oauth2Client.setCredentials({ refresh_token: refresh_token });

const drive = google.drive({ version: "v3", auth: oauth2Client });

const filePath = path.join(__dirname, "teste.png");

async function uploadFile() {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: "teste.png",
        mimeType: "image/png",
      },
      media: {
        mimeType: "image/png",
        body: fs.createReadStream(filePath),
      },
    });

    console.log(response.data);
  } catch (err) {
    console.log("Erro para dar upload na imagem", err);
  }
}

// uploadFile();

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

generatePublicUrl();
