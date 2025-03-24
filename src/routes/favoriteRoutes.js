import express from 'express';
import { 
  addFavorite, 
  removeFavorite, 
  getUserFavorites,
  checkFavorite
} from '../controllers/favoriteController.js';


const router = express.Router();

router.get('/:id', getUserFavorites);
router.post('/', addFavorite);
router.delete('/', removeFavorite);
router.get('/check/:userId/:productId', checkFavorite);


export default router;
