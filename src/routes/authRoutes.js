import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { loginRules } from '../utils/validators.js';

const r = Router();
r.post('/login', loginRules(), login);
export default r;
