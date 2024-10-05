const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { checkToken } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", checkToken, authController.logout);

module.exports = router;
