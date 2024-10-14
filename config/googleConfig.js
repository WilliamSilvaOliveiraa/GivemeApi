const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Função para gerar a URL de autorização
function getAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    // Adicione outros escopos necessários aqui
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return url;
}

// Função para lidar com o callback e obter o refresh token
async function handleCallback(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retorna o refresh token
    return tokens.refresh_token;
  } catch (error) {
    console.error("Erro ao obter tokens:", error);
    throw error;
  }
}

module.exports = { getAuthUrl, handleCallback };
