const clearingSyncService = require("../services/clearingSyncService");
const cardAnalysisService = require("../services/cardAnalysisService");

exports.getStatus = async (req, res) => {
  try {
    const status = await clearingSyncService.getSyncStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.syncNow = async (req, res) => {
  try {
    const result = await clearingSyncService.syncPendingClearingFiles();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Shubhali kartalar tahlilini qo'lda ishga tushirish
exports.runCardAnalysis = async (req, res) => {
  try {
    const result = await cardAnalysisService.runCardAnalysisPipeline();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tahlil natijalarini olish
exports.getSuspectCards = async (req, res) => {
  try {
    const data = await cardAnalysisService.getSuspectCards(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

