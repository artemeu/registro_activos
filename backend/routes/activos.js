import express from 'express';
import { getActivos, createActivo } from '../controllers/activosController.js';

const router = express.Router();

router.get('/', getActivos);
router.post('/', createActivo);

export default router;