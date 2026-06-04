const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "banking_admin_secret_key_2026";

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    return res.status(403).json({ message: "Token talab qilinadi!" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Noto'g'ri yoki muddati o'tgan token!" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    return res.status(403).json({ message: "Kirish taqiqlangan! Faqat Adminlar uchun." });
  }
};

module.exports = {
  verifyToken,
  requireAdmin
};
