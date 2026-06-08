const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fraudController = require("../controllers/fraudController");
const { verifyToken } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "../upload_files");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage: storage });

router.get("/", verifyToken, fraudController.getFrauds);
router.post("/", verifyToken, upload.array("files", 10), fraudController.createFraud);
router.put("/:id", verifyToken, upload.array("files", 10), fraudController.updateFraud);
router.delete("/:id", verifyToken, fraudController.deleteFraud);

module.exports = router;
