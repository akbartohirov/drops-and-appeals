const db = require("../config/db");

exports.getDropCards = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate } = req.query;

  try {
    let query = "SELECT * FROM drop_cards";
    let countQuery = "SELECT COUNT(*) as count, SUM(balance) as totalAmount FROM drop_cards";
    let params = [];
    let conditions = [];

    if (search && search.trim() !== "") {
      const cleanSearch = search.replace(/\D/g, "");
      if (cleanSearch !== "") {
        conditions.push("(card_number LIKE ? OR comment LIKE ?)");
        params.push(`%${cleanSearch}%`, `%${search.trim()}%`);
      } else {
        conditions.push("comment LIKE ?");
        params.push(`%${search.trim()}%`);
      }
    }

    if (startDate && startDate.trim() !== "") {
      conditions.push("date(blocked_at) >= ?");
      params.push(startDate.trim());
    }
    if (endDate && endDate.trim() !== "") {
      conditions.push("date(blocked_at) <= ?");
      params.push(endDate.trim());
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += " ORDER BY blocked_at DESC, created_at DESC";

    const totalStats = db.prepare(countQuery).get(...params);
    const totalItems = totalStats.count || 0;
    const totalFilteredAmount = totalStats.totalAmount || 0;

    let cards;
    if (limit === "all") {
      cards = db.prepare(query).all(...params);
    } else {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
      cards = db.prepare(paginatedQuery).all(...params, limitNum, offset);
    }

    // Calculate current month blocked count (overall unfiltered)
    const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentMonthResult = db.prepare(
      "SELECT COUNT(*) as count FROM drop_cards WHERE strftime('%Y-%m', blocked_at) = ?"
    ).get(currentMonthStr);
    const currentMonthBlockedCount = currentMonthResult.count || 0;

    res.json({
      data: cards,
      pagination: {
        page: limit === "all" ? 1 : (parseInt(page) || 1),
        limit: limit === "all" ? totalItems : (parseInt(limit) || 10),
        totalItems,
        totalPages: limit === "all" ? 1 : Math.ceil(totalItems / (parseInt(limit) || 10))
      },
      stats: {
        totalFilteredCount: totalItems,
        currentMonthBlockedCount,
        totalFilteredAmount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drop kartalarni yuklashda xatolik!" });
  }
};

exports.createDropCard = async (req, res) => {
  const { card_number, blocked_at, balance, comment } = req.body;
  const operatorId = req.user.id;

  if (!card_number) {
    return res.status(400).json({ message: "Karta raqami talab qilinadi!" });
  }

  const cleanCardNumber = card_number.replace(/\D/g, "");
  const now = new Date();
  const formattedNowStr = now.toISOString().replace("T", " ").split(".")[0]; // YYYY-MM-DD HH:MM:SS
  const finalBlockedAt = blocked_at || formattedNowStr;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO drop_cards (card_number, blocked_at, balance, comment, blocked_by)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      cleanCardNumber,
      finalBlockedAt,
      Number(balance) || 0,
      comment || null,
      operatorId
    );

    const created = db.prepare("SELECT * FROM drop_cards WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drop kartani qo'shishda xatolik!" });
  }
};
