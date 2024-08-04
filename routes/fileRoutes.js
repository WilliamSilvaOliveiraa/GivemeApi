const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { checkToken } = require("../middlewares/authMiddleware");

router.post("/upload", checkToken, fileController.uploadFile);
router.delete("/delete/:fileId", fileController.deleteFile);
router.get("/public-url/:fileId", fileController.generatePublicUrl);

module.exports = router;
