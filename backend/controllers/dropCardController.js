const db = require("../config/db");

exports.getDropCards = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate } = req.query;

  try {
    let query = "SELECT drop_cards.*, u1.username AS creator_name, u2.username AS updater_name FROM drop_cards LEFT JOIN users u1 ON drop_cards.blocked_by = u1.id LEFT JOIN users u2 ON drop_cards.updated_by = u2.id";
    let countQuery = 'SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as "totalAmount" FROM drop_cards';
    let params = [];
    let conditions = [];

    if (search && search.trim() !== "") {
      const cleanSearch = search.replace(/\D/g, "");
      if (cleanSearch !== "") {
        conditions.push("(card_number LIKE ? OR comment ILIKE ?)");
        params.push(`%${cleanSearch}%`, `%${search.trim()}%`);
      } else {
        conditions.push("comment ILIKE ?");
        params.push(`%${search.trim()}%`);
      }
    }

    if (startDate && startDate.trim() !== "") {
      conditions.push("LEFT(blocked_at::text, 10) >= ?");
      params.push(startDate.trim());
    }
    if (endDate && endDate.trim() !== "") {
      conditions.push("LEFT(blocked_at::text, 10) <= ?");
      params.push(endDate.trim());
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += " ORDER BY blocked_at DESC, drop_cards.created_at DESC";

    const totalStats = await db.queryOne(countQuery, params);
    const totalItems = parseInt(totalStats?.count || 0, 10);
    const totalFilteredAmount = Number(totalStats?.totalAmount || 0);

    let cards;
    if (limit === "all") {
      cards = await db.queryAll(query, params);
    } else {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
      cards = await db.queryAll(paginatedQuery, [...params, limitNum, offset]);
    }

    // Calculate current month blocked count & sum (overall unfiltered)
    const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const currentMonthResult = await db.queryOne(
      'SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as "totalAmount" FROM drop_cards WHERE LEFT(blocked_at::text, 7) = ?',
      [currentMonthStr]
    );
    const currentMonthBlockedCount = parseInt(currentMonthResult?.count || 0, 10);
    const currentMonthBlockedAmount = Number(currentMonthResult?.totalAmount || 0);

    res.json({
      data: cards,
      pagination: {
        page: limit === "all" ? 1 : (parseInt(page, 10) || 1),
        limit: limit === "all" ? totalItems : (parseInt(limit, 10) || 10),
        totalItems,
        totalPages: limit === "all" ? 1 : Math.ceil(totalItems / (parseInt(limit, 10) || 10))
      },
      stats: {
        totalFilteredCount: totalItems,
        currentMonthBlockedCount,
        currentMonthBlockedAmount,
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
    const upsertQuery = `
      INSERT INTO drop_cards (card_number, blocked_at, balance, comment, blocked_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (card_number) DO UPDATE SET
        blocked_at = EXCLUDED.blocked_at,
        balance = EXCLUDED.balance,
        comment = EXCLUDED.comment,
        blocked_by = EXCLUDED.blocked_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const info = await db.queryOne(upsertQuery, [
      cleanCardNumber,
      finalBlockedAt,
      Number(balance) || 0,
      comment || null,
      operatorId
    ]);

    const created = await db.queryOne(`
      SELECT drop_cards.*, u1.username AS creator_name, u2.username AS updater_name
      FROM drop_cards
      LEFT JOIN users u1 ON drop_cards.blocked_by = u1.id
      LEFT JOIN users u2 ON drop_cards.updated_by = u2.id
      WHERE drop_cards.id = ?
    `, [info.id]);

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drop kartani qo'shishda xatolik!" });
  }
};

exports.updateDropCard = async (req, res) => {
  const { id } = req.params;
  const { card_number, blocked_at, balance, comment } = req.body;
  const operatorId = req.user.id;

  if (!card_number) {
    return res.status(400).json({ message: "Karta raqami talab qilinadi!" });
  }

  const cleanCardNumber = card_number.replace(/\D/g, "");

  try {
    const updateQuery = `
      UPDATE drop_cards 
      SET card_number = ?, blocked_at = ?, balance = ?, comment = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const info = await db.query(updateQuery, [
      cleanCardNumber,
      blocked_at,
      Number(balance) || 0,
      comment || null,
      operatorId,
      id
    ]);

    if (info.rowCount === 0) {
      return res.status(404).json({ message: "Karta topilmadi!" });
    }

    const updated = await db.queryOne(`
      SELECT drop_cards.*, u1.username AS creator_name, u2.username AS updater_name
      FROM drop_cards
      LEFT JOIN users u1 ON drop_cards.blocked_by = u1.id
      LEFT JOIN users u2 ON drop_cards.updated_by = u2.id
      WHERE drop_cards.id = ?
    `, [id]);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drop kartani yangilashda xatolik!" });
  }
};

exports.deleteDropCard = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM drop_cards WHERE id = ?", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Karta topilmadi!" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Drop kartani o'chirishda xatolik!" });
  }
};
