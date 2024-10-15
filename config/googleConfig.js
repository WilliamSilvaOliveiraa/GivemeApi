const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

// Função para gerar a URL de autenticação
function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    include_granted_scopes: true,
  });

  console.log("URL de autorização gerada:", url);
  return url;
}

// Função para lidar com o callback da autenticação e obter tokens
async function handleCallback(code) {
  console.log("Código de autorização recebido:", code);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("Tokens obtidos com sucesso:", tokens);
    return {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date,
    };
  } catch (error) {
    console.error(
      "Erro detalhado ao obter tokens:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
}

// Instancia o serviço do Google Drive com o cliente autenticado
const drive = google.drive({ version: "v3", auth: oauth2Client });

module.exports = { getAuthUrl, handleCallback, drive };
