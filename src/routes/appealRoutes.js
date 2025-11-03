import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, getOne, create, update, remove, importCsv } from '../controllers/appealController.js';
import { appealCreateRules, appealIdRule, paginationRules } from '../utils/validators.js';
import multer from 'multer';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

const r = Router();
r.use(requireAuth);

r.get('/', paginationRules(), list);
r.get('/:id', appealIdRule(), getOne);
r.post('/', appealCreateRules(), create);
r.patch('/:id', appealIdRule(), update);
r.delete('/:id', appealIdRule(), remove);
r.post('/import-csv', upload.single('file'), importCsv);

export default r;
