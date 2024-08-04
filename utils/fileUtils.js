const fs = require("fs");
const path = require("path");

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { fileExists };
