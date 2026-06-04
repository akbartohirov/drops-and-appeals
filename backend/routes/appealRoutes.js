const express = require("express");
const router = express.Router();
const appealController = require("../controllers/appealController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, appealController.getAppeals);
router.post("/", verifyToken, appealController.createAppeal);

module.exports = router;
