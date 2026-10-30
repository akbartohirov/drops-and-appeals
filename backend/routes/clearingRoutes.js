const express = require("express");
const router = express.Router();
const clearingController = require("../controllers/clearingController");
const auth = require("../middleware/auth");

// Clearing status va qo'lda sinxronizatsiya endpointlari
router.get("/status", clearingController.getStatus);
router.post("/sync-now", clearingController.syncNow);

// Shubhali kartalar va tranzaksiyalar tahlili endpointlari
router.post("/run-card-analysis", clearingController.runCardAnalysis);
router.get("/suspect-cards", clearingController.getSuspectCards);

module.exports = router;

