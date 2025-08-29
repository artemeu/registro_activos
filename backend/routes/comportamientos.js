import express from 'express';
import { getComportamientos, createComportamiento } from '../controllers/comportamientosController.js';

const router = express.Router();

router.get('/', getComportamientos);
router.post('/', createComportamiento);

export default router;