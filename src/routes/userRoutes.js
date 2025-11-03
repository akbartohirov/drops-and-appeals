import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listUsers, createUser, changePassword, removeUser } from '../controllers/userController.js';
import { createUserRules, changePasswordRules } from '../utils/validators.js';

const r = Router();
r.use(requireAuth, requireAdmin);

r.get('/', listUsers);
r.post('/', createUserRules(), createUser);
r.patch('/:id/password', changePasswordRules(), changePassword);
r.delete('/:id', removeUser);

export default r;
