const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

router.post("/refresh-token", tokenController.refreshToken);

module.exports = router;
