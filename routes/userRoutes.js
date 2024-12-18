const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { checkToken } = require("../middlewares/authMiddleware");

router.get("/getList/:id", checkToken, userController.getUserById);

module.exports = router;
