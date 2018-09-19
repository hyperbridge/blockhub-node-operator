const router = require('express').Router();
const handler = require('../middleware/handler');

const productsController = require('../controllers/products');

router.get('/:productId', handler(productsController.get_product));

router.post('/', handler(productsController.post_product));

router.patch('/:productId', handler(productsController.patch_product));

router.delete('/:productId', handler(productsController.delete_product));

module.exports = router;