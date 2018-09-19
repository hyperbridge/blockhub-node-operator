const Joi = require('joi');
const productSchema = require('../schemas/product');

exports.get_product = async (req, res, next) => {
  return { msg: 'This is GET /product route !' };
};

exports.post_product = async (req, res, next) => {
  const { product } = req.body;
  await Joi.validate(product, productSchema);
  

  return { status: 202 };
};