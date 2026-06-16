const db = require("../config/db");

exports.getAppeals = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate, direction, system } = req.query;

  try {
    let query = "SELECT appeals.*, u1.username AS creator_name, u2.username AS updater_name FROM appeals LEFT JOIN users u1 ON appeals.created_by = u1.id LEFT JOIN users u2 ON appeals.updated_by = u2.id";
    let countQuery = "SELECT COUNT(*) as count FROM appeals";
    let params = [];
    let conditions = [];

    if (search && search.trim() !== "") {
      const cleanSearch = search.replace(/\D/g, "");
      if (cleanSearch !== "") {
        conditions.push("(applicant_name LIKE ? OR client_code LIKE ? OR card LIKE ?)");
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${cleanSearch}%`);
      } else {
        conditions.push("(applicant_name LIKE ? OR client_code LIKE ?)");
        params.push(`%${search.trim()}%`, `%${search.trim()}%`);
      }
    }

    if (startDate && startDate.trim() !== "") {
      conditions.push("appeal_date >= ?");
      params.push(startDate.trim());
    }
    if (endDate && endDate.trim() !== "") {
      conditions.push("appeal_date <= ?");
      params.push(endDate.trim());
    }

    if (direction && direction !== "Barchasi") {
      conditions.push("LOWER(direction) = LOWER(?)");
      params.push(direction.trim());
    }

    if (system && system !== "Barchasi") {
      conditions.push("LOWER(source_system) = LOWER(?)");
      params.push(system.trim());
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    query += " ORDER BY appeal_date DESC, appeals.created_at DESC";

    const totalCountResult = db.prepare(countQuery).get(...params);
    const totalItems = totalCountResult.count || 0;

    let appeals;
    if (limit === "all") {
      appeals = db.prepare(query).all(...params);
    } else {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const paginatedQuery = `${query} LIMIT ? OFFSET ?`;
      appeals = db.prepare(paginatedQuery).all(...params, limitNum, offset);
    }

    // Calculate system statistics (unfiltered / overall)
    const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const totalStats = db.prepare("SELECT COUNT(*) as count, SUM(damage_amount) as totalLoss FROM appeals").get();
    const totalAppeals = totalStats.count || 0;
    const totalLoss = totalStats.totalLoss || 0;

    const currentMonthStats = db.prepare(
      "SELECT COUNT(*) as count, SUM(damage_amount) as monthLoss FROM appeals WHERE strftime('%Y-%m', appeal_date) = ?"
    ).get(currentMonthStr);
    const currentMonthAppeals = currentMonthStats.count || 0;
    const currentMonthLoss = currentMonthStats.monthLoss || 0;

    res.json({
      data: appeals,
      pagination: {
        page: limit === "all" ? 1 : (parseInt(page) || 1),
        limit: limit === "all" ? totalItems : (parseInt(limit) || 10),
        totalItems,
        totalPages: limit === "all" ? 1 : Math.ceil(totalItems / (parseInt(limit) || 10))
      },
      stats: {
        totalAppeals,
        currentMonthAppeals,
        totalLoss,
        currentMonthLoss
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Murojaatlarni yuklashda xatolik!" });
  }
};

exports.createAppeal = async (req, res) => {
  const { applicant_name, phone, address, source_org, source_system, subject, direction, client_code, card, appeal_date, damage_amount, comment } = req.body;
  const operatorId = req.user.id;

  if (!applicant_name || !phone) {
    return res.status(400).json({ message: "Murojaatchi nomi va telefoni talab qilinadi!" });
  }

  const tempCode = `CLI-${Math.floor(10000 + Math.random() * 90000)}`;
  const finalClientCode = client_code || tempCode;

  try {
    const stmt = db.prepare(`
      INSERT INTO appeals (applicant_name, phone, address, source_org, source_system, subject, direction, client_code, card, appeal_date, damage_amount, comment, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      applicant_name,
      phone,
      address || null,
      source_org || null,
      source_system || "MOBILE",
      subject || null,
      direction || null,
      finalClientCode,
      card || "",
      appeal_date || new Date().toISOString().split("T")[0],
      Number(damage_amount) || 0,
      comment || null,
      operatorId
    );

    const created = db.prepare(`
      SELECT appeals.*, u1.username AS creator_name, u2.username AS updater_name
      FROM appeals
      LEFT JOIN users u1 ON appeals.created_by = u1.id
      LEFT JOIN users u2 ON appeals.updated_by = u2.id
      WHERE appeals.id = ?
    `).get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Murojaatni saqlashda xatolik!" });
  }
};

exports.updateAppeal = async (req, res) => {
  const { id } = req.params;
  const { applicant_name, phone, address, source_org, source_system, subject, direction, client_code, card, appeal_date, damage_amount, comment } = req.body;
  const operatorId = req.user.id;

  if (!applicant_name || !phone) {
    return res.status(400).json({ message: "Murojaatchi nomi va telefoni talab qilinadi!" });
  }

  try {
    const stmt = db.prepare(`
      UPDATE appeals 
      SET applicant_name = ?, phone = ?, address = ?, source_org = ?, source_system = ?, subject = ?, direction = ?, client_code = ?, card = ?, appeal_date = ?, damage_amount = ?, comment = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const info = stmt.run(
      applicant_name,
      phone,
      address || null,
      source_org || null,
      source_system || "MOBILE",
      subject || null,
      direction || null,
      client_code || "",
      card || "",
      appeal_date || new Date().toISOString().split("T")[0],
      Number(damage_amount) || 0,
      comment || null,
      operatorId,
      id
    );

    if (info.changes === 0) {
      return res.status(404).json({ message: "Murojaat topilmadi!" });
    }

    const updated = db.prepare(`
      SELECT appeals.*, u1.username AS creator_name, u2.username AS updater_name
      FROM appeals
      LEFT JOIN users u1 ON appeals.created_by = u1.id
      LEFT JOIN users u2 ON appeals.updated_by = u2.id
      WHERE appeals.id = ?
    `).get(id);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Murojaatni yangilashda xatolik!" });
  }
};

