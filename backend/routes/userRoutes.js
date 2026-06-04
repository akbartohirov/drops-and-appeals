const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

router.get("/", verifyToken, userController.getUsers);
router.post("/", verifyToken, requireAdmin, userController.createUser);
router.delete("/:id", verifyToken, requireAdmin, userController.deleteUser);
router.patch("/:id/status", verifyToken, requireAdmin, userController.toggleUserStatus);

module.exports = router;
