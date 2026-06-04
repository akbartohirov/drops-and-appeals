const fs = require('fs');
const path = require('path');

// 1. Define folder structure
const dirs = [
  'config',
  'middleware',
  'controllers',
  'routes'
];

console.log('--- EXPRES-JS BACKEND LOYIHA TUZILMASINI YARATISH ---');

// Create directories
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[Palka] ${dir} papkasi yaratildi.`);
  }
});

// 2. Define files and their contents

const files = {};

// config/db.js
files['config/db.js'] = `const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database.db');
const db = new Database(dbPath, { verbose: console.log });

// Create Tables
db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    createdDate TEXT,
    status TEXT DEFAULT 'Faol'
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    clientName TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    organization TEXT,
    system TEXT,
    subject TEXT,
    direction TEXT,
    clientCode TEXT,
    cardNumber TEXT,
    date TEXT,
    lossAmount INTEGER DEFAULT 0,
    comment TEXT,
    operatorId TEXT,
    FOREIGN KEY(operatorId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drop_cards (
    cardNumber TEXT PRIMARY KEY,
    blockDate TEXT NOT NULL,
    blockTime TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    holderName TEXT,
    reason TEXT,
    comment TEXT,
    operatorId TEXT,
    FOREIGN KEY(operatorId) REFERENCES users(id)
  );
\`);

// Seed Initial Data if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  console.log('Seeding initial database data...');

  const insertUser = db.prepare(\`
    INSERT INTO users (id, username, email, password, role, createdDate, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  \`);

  // Standard passwords hashed (e.g. admin123 and operator123)
  const adminHash = bcrypt.hashSync('admin123', 10);
  const operatorHash = bcrypt.hashSync('operator123', 10);
  const shaxriyorHash = bcrypt.hashSync('shaxriyor123', 10);
  const madinaHash = bcrypt.hashSync('madina_n123', 10);

  insertUser.run('USR-1001', 'admin', 'azizov.b@bank.uz', adminHash, 'Admin', '12 May, 2023', 'Faol');
  insertUser.run('USR-1002', 'operator', 'rahmonov.a@bank.uz', operatorHash, 'User', '15 Iyun, 2023', 'Faol');
  insertUser.run('USR-1003', 'shaxriyor', 'karimov.s@bank.uz', shaxriyorHash, 'User', '22 Iyun, 2023', 'Oflayn');
  insertUser.run('USR-1004', 'madina_n', 'alisherova.m@bank.uz', madinaHash, 'Admin', '05 Avgust, 2023', 'Faol');

  // Seed Appeals
  const insertAppeal = db.prepare(\`
    INSERT INTO appeals (id, clientName, phone, address, organization, system, subject, direction, clientCode, cardNumber, date, lossAmount, comment, operatorId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  insertAppeal.run('CLI-90821', 'Abdullayev Anvar', '998901234567', 'Toshkent sh., Yunusobod 14-4', 'ATB "Hamkorbank"', 'MOBILE', 'To\'lov xatoligi', 'Transaksiyalar', 'CLI-90821', '8600123456784421', '2026-05-24', 1250000, 'Pul yechildi, lekin tushmadi...', 'USR-1002');
  insertAppeal.run('CLI-45123', 'Sattorova Madina', '998934567890', 'Samarqand sh., Registon k. 12', 'MB Bosh ofisi', 'WEB', 'Kredit so\'rovi', 'Kreditlash', 'CLI-45123', '9860054321001009', '2026-05-23', 0, 'Kredit liniyasi ochilmadi', 'USR-1003');
  insertAppeal.run('CORP-001', '"Global Logistics" MCHJ', '998999990011', 'Buxoro sh., S.Ayniy 45', 'Xalq Banki', 'ATM', 'Naqdlashtirish xatosi', 'Inkasatsiya', 'CORP-001', '5614332211228877', '2026-05-22', 4000000, 'ATM pulni bermadi, balansdan ayirildi', 'USR-1001');

  // Seed Drop Cards
  const insertDropCard = db.prepare(\`
    INSERT INTO drop_cards (cardNumber, blockDate, blockTime, balance, holderName, reason, comment, operatorId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  \`);
  insertDropCard.run('8600112233444912', '2026-05-24', '14:22:15', 12450000, 'Akbar Komilov', 'shubhali', 'Shubhali P2P tranzaksiyalar oqimi aniqlandi', 'USR-1002');
  insertDropCard.run('5614321098768821', '2026-05-23', '09:10:04', 2100000, 'Dilshod Tursunov', 'kredit', 'Kredit firibgarligi gumoni', 'USR-1003');
  insertDropCard.run('4263998877660032', '2026-05-22', '18:45:30', 58000200, 'Malika Abduvaliyeva', 'huquq', 'Huquqni muhofaza qilish organlari so\'rovi', 'USR-1001');
  insertDropCard.run('8600990088771199', '2026-05-22', '10:05:01', 0, 'Sardor Hakimov', 'boshqa', 'E\'tirozli hisob-kitoblar', 'USR-1002');

  console.log('Database seeded successfully.');
}

module.exports = db;
`;

// middleware/auth.js
files['middleware/auth.js'] = `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'banking_admin_secret_key_2026';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Token talab qilinadi!' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Noto\'g\'ri yoki muddati o\'tgan token!' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Kirish taqiqlangan! Faqat Adminlar uchun.' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin
};
`;

// controllers/authController.js
files['controllers/authController.js'] = `const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'banking_admin_secret_key_2026';

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Foydalanuvchi nomi va parol talab qilinadi!' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri!' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri!' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Tizim xatoligi yuz berdi!' });
  }
};
`;

// controllers/appealController.js
files['controllers/appealController.js'] = `const db = require('../config/db');

exports.getAppeals = async (req, res) => {
  try {
    const appeals = db.prepare('SELECT * FROM appeals ORDER BY date DESC').all();
    res.json(appeals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Murojaatlarni yuklashda xatolik!' });
  }
};

exports.createAppeal = async (req, res) => {
  const { clientName, phone, address, organization, system, subject, direction, clientCode, cardNumber, date, lossAmount, comment } = req.body;
  const operatorId = req.user.id;

  if (!clientName || !phone) {
    return res.status(400).json({ message: 'Murojaatchi nomi va telefoni talab qilinadi!' });
  }

  const id = \`CLI-\${Math.floor(10000 + Math.random() * 90000)}\`;
  const finalClientCode = clientCode || id;

  try {
    const stmt = db.prepare(\`
      INSERT INTO appeals (id, clientName, phone, address, organization, system, subject, direction, clientCode, cardNumber, date, lossAmount, comment, operatorId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);
    
    stmt.run(
      id,
      clientName,
      phone,
      address || null,
      organization || null,
      system || 'MOBILE',
      subject || null,
      direction || null,
      finalClientCode,
      cardNumber || '',
      date || new Date().toISOString().split('T')[0],
      Number(lossAmount) || 0,
      comment || null,
      operatorId
    );

    const created = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Murojaatni saqlashda xatolik!' });
  }
};
`;

// controllers/dropCardController.js
files['controllers/dropCardController.js'] = `const db = require('../config/db');

exports.getDropCards = async (req, res) => {
  try {
    const cards = db.prepare('SELECT * FROM drop_cards ORDER BY blockDate DESC, blockTime DESC').all();
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Drop kartalarni yuklashda xatolik!' });
  }
};

exports.createDropCard = async (req, res) => {
  const { cardNumber, blockDate, balance, holderName, reason, comment } = req.body;
  const operatorId = req.user.id;

  if (!cardNumber) {
    return res.status(400).json({ message: 'Karta raqami talab qilinadi!' });
  }

  const cleanCardNumber = cardNumber.replace(/\\D/g, '');
  const now = new Date();
  const timeString = now.toTimeString().split(' ')[0];

  try {
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO drop_cards (cardNumber, blockDate, blockTime, balance, holderName, reason, comment, operatorId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`);

    stmt.run(
      cleanCardNumber,
      blockDate || now.toISOString().split('T')[0],
      timeString,
      Number(balance) || 0,
      holderName || "Noma'lum Jismoniy shaxs",
      reason || 'boshqa',
      comment || null,
      operatorId
    );

    const created = db.prepare('SELECT * FROM drop_cards WHERE cardNumber = ?').get(cleanCardNumber);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Drop kartani qo\'shishda xatolik!' });
  }
};
`;

// controllers/userController.js
files['controllers/userController.js'] = `const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    // Return users without passwords
    const users = db.prepare('SELECT id, username, email, role, createdDate, status FROM users').all();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Xodimlarni yuklashda xatolik!' });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Foydalanuvchi nomi, parol va rol talab qilinadi!' });
  }

  const cleanUsername = username.toLowerCase().replace(/\\s/g, '');
  const hash = bcrypt.hashSync(password, 10);
  const createdDate = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const stmt = db.prepare(\`
      INSERT INTO users (username, email, password, role, createdDate, status)
      VALUES (?, ?, ?, ?, ?, 'Faol')
    \`);
    
    const info = stmt.run(cleanUsername, email || null, hash, role, createdDate);

    const created = db.prepare('SELECT id, username, email, role, createdDate, status FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Ushbu foydalanuvchi nomi band!' });
    }
    res.status(500).json({ message: 'Xodim yaratishda xatolik!' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi!' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Xodimni o\'chirishda xatolik!' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi!' });
    }

    const nextStatus = user.status === 'Faol' ? 'Oflayn' : 'Faol';
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(nextStatus, id);

    const updated = db.prepare('SELECT id, username, email, role, createdDate, status FROM users WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Statusni yangilashda xatolik!' });
  }
};
`;

// controllers/dashboardController.js
files['controllers/dashboardController.js'] = `const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const appealsCount = db.prepare('SELECT COUNT(*) as count FROM appeals').get().count;
    const lossSum = db.prepare('SELECT SUM(lossAmount) as sum FROM appeals').get().sum || 0;
    const dropCardsCount = db.prepare('SELECT COUNT(*) as count FROM drop_cards').get().count;

    res.json({
      totalAppeals: appealsCount,
      totalLoss: lossSum,
      totalBlockedCards: dropCardsCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Dashboard statistikasini olishda xatolik!' });
  }
};
`;

// routes/authRoutes.js
files['routes/authRoutes.js'] = `const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

module.exports = router;
`;

// routes/appealRoutes.js
files['routes/appealRoutes.js'] = `const express = require('express');
const router = express.Router();
const appealController = require('../controllers/appealController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, appealController.getAppeals);
router.post('/', verifyToken, appealController.createAppeal);

module.exports = router;
`;

// routes/dropCardRoutes.js
files['routes/dropCardRoutes.js'] = `const express = require('express');
const router = express.Router();
const dropCardController = require('../controllers/dropCardController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, dropCardController.getDropCards);
router.post('/', verifyToken, dropCardController.createDropCard);

module.exports = router;
`;

// routes/userRoutes.js
files['routes/userRoutes.js'] = `const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, userController.getUsers);
router.post('/', verifyToken, requireAdmin, userController.createUser);
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);
router.patch('/:id/status', verifyToken, requireAdmin, userController.toggleUserStatus);

module.exports = router;
`;

// routes/dashboardRoutes.js
files['routes/dashboardRoutes.js'] = `const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, dashboardController.getStats);

module.exports = router;
`;

// server.js
files['server.js'] = `const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const appealRoutes = require('./routes/appealRoutes');
const dropCardRoutes = require('./routes/dropCardRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/drop-cards', dropCardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Tizimda ichki xatolik yuz berdi!' });
});

app.listen(PORT, () => {
  console.log(\`Server \${PORT}-portda ishlamoqda.\`);
});
`;

// .env
files['.env'] = `PORT=5000
JWT_SECRET=banking_admin_secret_key_2026_super_secure_key
`;

// Create all files
Object.keys(files).forEach(file => {
  const filePath = path.join(__dirname, file);
  fs.writeFileSync(filePath, files[file]);
  console.log(`[Fayl] ${file} muvaffaqiyatli yaratildi.`);
});

console.log('\\n--- BARCHA FAYLLAR TAYYOR! LOYIHANI ISHGA TUSHIRISH: node server.js ---');
