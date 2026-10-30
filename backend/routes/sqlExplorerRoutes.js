const express = require("express");
const router = express.Router();
const sqlExplorerController = require("../controllers/sqlExplorerController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// SQL Explorer faqat Admin foydalanuvchilar uchun ruxsat etiladi
router.use(verifyToken, requireAdmin);

router.post("/execute", sqlExplorerController.executeSql);
router.get("/tables", sqlExplorerController.getTables);

module.exports = router;

