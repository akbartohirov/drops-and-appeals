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
    const frauds = db.prepare(`
      SELECT f.*, u1.username as creator_name, u2.username as updater_name
      FROM fraud_registry f
      LEFT JOIN users u1 ON f.created_by = u1.id
      LEFT JOIN users u2 ON f.updated_by = u2.id
      ORDER BY f.fraud_date DESC, f.created_at DESC
    `).all();

    const attachments = db.prepare("SELECT * FROM fraud_attachments").all();

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

  try {
    const insertTransaction = db.transaction((data, fileList) => {
      const stmt = db.prepare(`
        INSERT INTO fraud_registry (
          fraud_type, description, victim_name, fraud_date, damage_amount, measures_taken, comments, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        data.fraud_type,
        data.description,
        data.victim_name,
        data.fraud_date,
        Number(data.damage_amount) || 0,
        data.measures_taken || null,
        data.comments || null,
        data.creatorId
      );
      const fraudId = info.lastInsertRowid;

      const attachStmt = db.prepare(`
        INSERT INTO fraud_attachments (fraud_id, original_name, file_path)
        VALUES (?, ?, ?)
      `);

      for (const file of fileList) {
        let decodedName = file.originalname;
        try {
          decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
        } catch (err) {}
        attachStmt.run(fraudId, decodedName, `/upload_files/${file.filename}`);
      }

      return fraudId;
    });

    const fraudId = insertTransaction({
      fraud_type,
      description,
      victim_name,
      fraud_date,
      damage_amount,
      measures_taken,
      comments,
      creatorId
    }, files);

    const created = db.prepare("SELECT * FROM fraud_registry WHERE id = ?").get(fraudId);
    const dbAttachments = db.prepare("SELECT * FROM fraud_attachments WHERE fraud_id = ?").all(fraudId);
    created.attachments = dbAttachments.map(a => ({
      id: a.id,
      originalName: a.original_name,
      filePath: a.file_path
    }));

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatini saqlashda xatolik!" });
  }
};


exports.deleteFraud = async (req, res) => {
  const { id } = req.params;

  try {
    const attachments = db.prepare("SELECT file_path FROM fraud_attachments WHERE fraud_id = ?").all(id);
    
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

    const stmt = db.prepare("DELETE FROM fraud_registry WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
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
  const nowStr = new Date().toISOString().replace("T", " ").split(".")[0];

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

  try {
    const updateTransaction = db.transaction((data, fileList) => {
      const updateStmt = db.prepare(`
        UPDATE fraud_registry
        SET fraud_type = ?, description = ?, victim_name = ?, fraud_date = ?, damage_amount = ?, measures_taken = ?, comments = ?, updated_by = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(
        data.fraud_type,
        data.description,
        data.victim_name,
        data.fraud_date,
        Number(data.damage_amount) || 0,
        data.measures_taken || null,
        data.comments || null,
        data.updaterId,
        data.nowStr,
        data.id
      );

      if (data.deleted_file_ids) {
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(data.deleted_file_ids);
        } catch (parseErr) {
          console.error("deleted_file_ids parsing error:", parseErr.message);
        }

        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          const placeholders = deletedIds.map(() => "?").join(",");
          const selectAttachments = db.prepare(`
            SELECT file_path FROM fraud_attachments 
            WHERE id IN (${placeholders}) AND fraud_id = ?
          `);
          const rows = selectAttachments.all(...deletedIds, data.id);

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

          const deleteAttachments = db.prepare(`
            DELETE FROM fraud_attachments 
            WHERE id IN (${placeholders}) AND fraud_id = ?
          `);
          deleteAttachments.run(...deletedIds, data.id);
        }
      }

      const attachStmt = db.prepare(`
        INSERT INTO fraud_attachments (fraud_id, original_name, file_path)
        VALUES (?, ?, ?)
      `);

      for (const file of fileList) {
        let decodedName = file.originalname;
        try {
          decodedName = Buffer.from(file.originalname, "latin1").toString("utf8");
        } catch (err) {}
        attachStmt.run(data.id, decodedName, `/upload_files/${file.filename}`);
      }

      return data.id;
    });

    updateTransaction({
      id,
      fraud_type,
      description,
      victim_name,
      fraud_date,
      damage_amount,
      measures_taken,
      comments,
      deleted_file_ids,
      updaterId,
      nowStr
    }, files);

    const updated = db.prepare("SELECT * FROM fraud_registry WHERE id = ?").get(id);
    const dbAttachments = db.prepare("SELECT * FROM fraud_attachments WHERE fraud_id = ?").all(id);
    updated.attachments = dbAttachments.map(a => ({
      id: a.id,
      originalName: a.original_name,
      filePath: a.file_path
    }));

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Firibgarlik holatini yangilashda xatolik!" });
  }
};
