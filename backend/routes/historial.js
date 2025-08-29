import express from 'express';
import { getHistorial, registrarCambio } from '../controllers/historialController.js';

const router = express.Router();

router.get('/', getHistorial);
router.post('/registro', registrarCambio);

export default router;