const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const BANNED_EXTENSIONS = [".js", ".mjs", ".ts", ".html", ".htm", ".php", ".phtml", ".exe", ".dll", ".sh", ".bat", ".cmd", ".py", ".pl", ".jsp", ".asp", ".aspx", ".cgi", ".jar", ".vbs"];

const getSuspiciousFiles = (files) => {
  const suspicious = [];
  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BANNED_EXTENSIONS.includes(ext)) {
      suspicious.push(file.originalname);
    }
  }
  return suspicious;
};

const cleanupUploadedFiles = (files) => {
  for (const file of files) {
    const filePath = path.join(__dirname, "../upload_files", file.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Faylni o'chirishda xatolik:", err.message);
      }
    }
  }
};

exports.getFrauds = async (req, res) => {
  try {
    const frauds = await db.queryAll(`
      SELECT f.*, u1.username as creator_name, u2.username as updater_name
      FROM fraud_registry f
      LEFT JOIN users u1 ON f.created_by = u1.id
      LEFT JOIN users u2 ON f.updated_by = u2.id
      ORDER BY f.fraud_date DESC, f.created_at DESC
    `);

    const attachments = await db.queryAll("SELECT * FROM fraud_attachments ORDER BY id ASC");

    const fraudsWithAttachments = frauds.map(f => {
      const filtered = attachments.filter(a => a.fraud_id === f.id);
      f.attachments = filtered.map(a => ({
        id: a.id,
        originalName: a.original_name,
        filePath: a.file_path
      }));
      return f;
    });

    res.json(fraudsWithAttachments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatlarini yuklashda xatolik!" });
  }
};

exports.createFraud = async (req, res) => {
  const { fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments } = req.body;
  const creatorId = req.user.id;
  const files = req.files || [];

  if (!fraud_type || !description || !victim_name || !fraud_date) {
    return res.status(400).json({ message: "Majburiy maydonlar to'ldirilishi shart!" });
  }

  const suspicious = getSuspiciousFiles(files);
  if (suspicious.length > 0) {
    cleanupUploadedFiles(files);
    return res.status(400).json({
      message: `Yuklangan fayllar orasida taqiqlangan formatdagi shubhali fayl(lar) aniqlandi: ${suspicious.join(", ")}. Tizim xavfsizligi sababli dasturiy script yoki ishga tushuvchi fayllarni yuklash taqiqlanadi!`
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const insertResult = await client.query(
      `INSERT INTO fraud_registry (
        fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        fraud_type,
        description,
        victim_name,
        fraud_date,
        Number(damage_amount) || 0,
        measures_taken || null,
        comments || null,
        creatorId
      ]
    );

    const fraudId = insertResult.rows[0].id;

    for (const file of files) {
      let decodedName = file.originalname;
      try {
        decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
      } catch (err) {}

      await client.query(
        "INSERT INTO fraud_attachments (fraud_id, original_name, file_path) VALUES ($1, $2, $3)",
        [fraudId, decodedName, `/upload_files/${file.filename}`]
      );
    }

    await client.query("COMMIT");

    const created = await db.queryOne("SELECT * FROM fraud_registry WHERE id = $1", [fraudId]);
    const dbAttachments = await db.queryAll("SELECT * FROM fraud_attachments WHERE fraud_id = $1", [fraudId]);
    created.attachments = dbAttachments.map(a => ({
      id: a.id,
      originalName: a.original_name,
      filePath: a.file_path
    }));

    res.status(201).json(created);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatini saqlashda xatolik!" });
  } finally {
    client.release();
  }
};

exports.deleteFraud = async (req, res) => {
  const { id } = req.params;

  try {
    const attachments = await db.queryAll("SELECT file_path FROM fraud_attachments WHERE fraud_id = $1", [id]);
    
    for (const attach of attachments) {
      const fileName = path.basename(attach.file_path);
      const absoluteFilePath = path.join(__dirname, "../upload_files", fileName);
      if (fs.existsSync(absoluteFilePath)) {
        try {
          fs.unlinkSync(absoluteFilePath);
        } catch (fileErr) {
          console.error("Faylni o'chirishda xatolik:", fileErr.message);
        }
      }
    }

    const result = await db.query("DELETE FROM fraud_registry WHERE id = ?", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Yozuv topilmadi!" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatini o'chirishda xatolik!" });
  }
};

exports.updateFraud = async (req, res) => {
  const { id } = req.params;
  const { fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, deleted_file_ids } = req.body;
  const updaterId = req.user.id;
  const files = req.files || [];

  if (!fraud_type || !description || !victim_name || !fraud_date) {
    return res.status(400).json({ message: "Majburiy maydonlar to'ldirilishi shart!" });
  }

  const suspicious = getSuspiciousFiles(files);
  if (suspicious.length > 0) {
    cleanupUploadedFiles(files);
    return res.status(400).json({
      message: `Yuklangan fayllar orasida taqiqlangan formatdagi shubhali fayl(lar) aniqlandi: ${suspicious.join(", ")}. Tizim xavfsizligi sababli dasturiy script yoki ishga tushuvchi fayllarni yuklash taqiqlanadi!`
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE fraud_registry
       SET fraud_type = $1, description = $2, victim_name = $3, fraud_date = $4, damage_amount = $5, measures_taken = $6, comments = $7, updated_by = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        fraud_type,
        description,
        victim_name,
        fraud_date,
        Number(damage_amount) || 0,
        measures_taken || null,
        comments || null,
        updaterId,
        id
      ]
    );

    if (deleted_file_ids) {
      let deletedIds = [];
      try {
        deletedIds = JSON.parse(deleted_file_ids);
      } catch (parseErr) {
        console.error("deleted_file_ids parsing error:", parseErr.message);
      }

      if (Array.isArray(deletedIds) && deletedIds.length > 0) {
        const placeholders = deletedIds.map((_, i) => `$${i + 1}`).join(",");
        const selectQuery = `SELECT file_path FROM fraud_attachments WHERE id IN (${placeholders}) AND fraud_id = $${deletedIds.length + 1}`;
        const rows = (await client.query(selectQuery, [...deletedIds, id])).rows;

        for (const row of rows) {
          const fileName = path.basename(row.file_path);
          const absoluteFilePath = path.join(__dirname, "../upload_files", fileName);
          if (fs.existsSync(absoluteFilePath)) {
            try {
              fs.unlinkSync(absoluteFilePath);
            } catch (fileErr) {
              console.error("Faylni o'chirishda xatolik:", fileErr.message);
            }
          }
        }

        const deleteQuery = `DELETE FROM fraud_attachments WHERE id IN (${placeholders}) AND fraud_id = $${deletedIds.length + 1}`;
        await client.query(deleteQuery, [...deletedIds, id]);
      }
    }

    for (const file of files) {
      let decodedName = file.originalname;
      try {
        decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
      } catch (err) {}

      await client.query(
        "INSERT INTO fraud_attachments (fraud_id, original_name, file_path) VALUES ($1, $2, $3)",
        [id, decodedName, `/upload_files/${file.filename}`]
      );
    }

    await client.query("COMMIT");

    const updated = await db.queryOne("SELECT * FROM fraud_registry WHERE id = $1", [id]);
    const dbAttachments = await db.queryAll("SELECT * FROM fraud_attachments WHERE fraud_id = $1", [id]);
    updated.attachments = dbAttachments.map(a => ({
      id: a.id,
      originalName: a.original_name,
      filePath: a.file_path
    }));

    res.json(updated);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatini yangilashda xatolik!" });
  } finally {
    client.release();
  }
};
