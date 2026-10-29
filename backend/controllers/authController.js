const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "banking_admin_secret_key_2026";

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Foydalanuvchi nomi va parol talab qilinadi!" });
  }

  try {
    const user = await db.queryOne(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(?)",
      [username.trim()]
    );
    
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi nomi yoki parol noto'g'ri!" });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Foydalanuvchi nomi yoki parol noto'g'ri!" });
    }

    const isAdmin = user.is_admin === 1 || user.is_admin === true || user.is_admin === "1";
    const userRole = isAdmin ? "Admin" : "User";

    // Generate Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: userRole },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: userRole,
        createdDate: user.created_at || "12 May, 2023",
        status: "Faol"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tizim xatoligi yuz berdi!" });
  }
};
