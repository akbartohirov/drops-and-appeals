const db = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const appealsRes = await db.queryOne("SELECT COUNT(*) as count, COALESCE(SUM(damage_amount), 0) as sum FROM appeals");
    const dropCardsRes = await db.queryOne("SELECT COUNT(*) as count FROM drop_cards");

    res.json({
      totalAppeals: parseInt(appealsRes?.count || 0, 10),
      totalLoss: Number(appealsRes?.sum || 0),
      totalBlockedCards: parseInt(dropCardsRes?.count || 0, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard statistikasini olishda xatolik!" });
  }
};
