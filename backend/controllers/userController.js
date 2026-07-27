const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getUsers = async (req, res) => {
  try {
    const users = db.prepare("SELECT id, username, is_admin, created_at FROM users").all();
    const mappedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.is_admin === 1 ? "Admin" : "User",
      createdDate: u.created_at,
    }));
    res.json(mappedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xodimlarni yuklashda xatolik!" });
  }
};

exports.createUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || role === undefined || role === null) {
    return res.status(400).json({ message: "Foydalanuvchi nomi, parol va rol talab qilinadi!" });
  }

  const cleanUsername = username.toLowerCase().replace(/\s/g, "");
  const hash = bcrypt.hashSync(password, 10);
  const isAdmin = role === "Admin" ? 1 : 0;
  const createdDate = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });

  try {
    const stmt = db.prepare("INSERT INTO users (username, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?)");
    const info = stmt.run(cleanUsername, hash, isAdmin, createdDate);

    const created = db.prepare("SELECT id, username, is_admin, created_at FROM users WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({
      id: created.id,
      username: created.username,
      email: `${created.username}@bank.uz`,
      role: created.is_admin === 1 ? "Admin" : "User",
      createdDate: created.created_at,
      status: "Faol"
    });
  } catch (err) {
    console.error(err);
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ message: "Ushbu foydalanuvchi nomi band!" });
    }
    res.status(500).json({ message: "Xodim yaratishda xatolik!" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi!" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xodimni o'chirishda xatolik!" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi!" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: `${user.username}@bank.uz`,
      role: user.is_admin === 1 ? "Admin" : "User",
      createdDate: user.created_at,
      status: "Faol"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Statusni yangilashda xatolik!" });
  }
};
