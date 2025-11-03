import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import { notFound, errorHandler } from './src/middleware/errors.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import appealRoutes from './src/routes/appealRoutes.js';
import dropcardRoutes from './src/routes/dropcardRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});


app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/drops', dropcardRoutes);

app.use('/api', notFound);

console.log(__dirname);

const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});


app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`REST up on http://localhost:${port}`));
