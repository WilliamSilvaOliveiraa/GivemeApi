const { google } = require("googleapis");
require("dotenv").config();

console.log("rodou");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const refresh_token = process.env.REFRESH_TOKEN;

console.log(client_id, client_secret, redirect_uri, refresh_token);
