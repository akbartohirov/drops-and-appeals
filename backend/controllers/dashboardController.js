const db = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const appealsCount = db.prepare("SELECT COUNT(*) as count FROM appeals").get().count;
    const lossSum = db.prepare("SELECT SUM(damage_amount) as sum FROM appeals").get().sum || 0;
    const dropCardsCount = db.prepare("SELECT COUNT(*) as count FROM drop_cards").get().count;

    res.json({
      totalAppeals: appealsCount,
      totalLoss: lossSum,
      totalBlockedCards: dropCardsCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard statistikasini olishda xatolik!" });
  }
};
