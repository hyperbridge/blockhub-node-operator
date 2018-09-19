const router = require('express').Router();
const handler = require('../middleware/handler');

const productsController = require('../controllers/products');

router.get('/:productId', handler(productsController.get_product));

router.post('/', handler(productsController.post_product));

module.exports = router;