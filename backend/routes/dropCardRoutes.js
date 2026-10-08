const express = require("express");
const router = express.Router();
const dropCardController = require("../controllers/dropCardController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, dropCardController.getDropCards);
router.post("/", verifyToken, dropCardController.createDropCard);
router.put("/:id", verifyToken, dropCardController.updateDropCard);
router.delete("/:id", verifyToken, dropCardController.deleteDropCard);

module.exports = router;

