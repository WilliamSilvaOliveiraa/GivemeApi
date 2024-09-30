// routes/fileRoutes.js
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
router.delete("/delete/:fileId", fileController.deleteFile);
// router.get("/user/files", checkToken, fileController.getUserFileIds);
router.get("/public-url/:fileId", fileController.generatePublicUrl);

module.exports = router;
