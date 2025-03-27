
import express from 'express';
import { 
  getAllBackgrounds, 
  getBackgroundByCategory,
  getBackgroundById,
  createBackground, 
  updateBackground, 
  deleteBackground 
} from '../controllers/backgroundController.js';

const router = express.Router();

router.get('/', getAllBackgrounds);
router.get('/category/:category', getBackgroundByCategory);
router.get('/:id', getBackgroundById);
router.post('/', createBackground);
router.put('/:id', updateBackground);
router.delete('/:id', deleteBackground);

export default router;
