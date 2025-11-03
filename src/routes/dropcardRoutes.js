import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, getOne, create, update, remove, importCsv } from '../controllers/dropcardController.js';
import { paginationRules, dropIdRule, dropCreateRules } from '../utils/validators.js';
import multer from 'multer';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

const r = Router();
r.use(requireAuth);

r.get('/', paginationRules(), list);
r.get('/:id', dropIdRule(), getOne);
r.post('/', dropCreateRules(), create);
r.patch('/:id', dropIdRule(), update);
r.delete('/:id', dropIdRule(), remove);
r.post('/import-csv', upload.single('file'), importCsv);

export default r;
