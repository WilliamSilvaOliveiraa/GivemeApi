const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");
const { checkToken } = require("../middlewares/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/upload",
  checkToken,
  upload.single("file"),
  fileController.uploadFile
);

router.delete("/delete/:fileId", checkToken, fileController.deleteFile);

router.get("/public-url/:fileId", checkToken, fileController.generatePublicUrl);

module.exports = router;
