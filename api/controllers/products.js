const Joi = require('joi');
const productSchema = require('../schemas/product');
const Product = require('../models/product');

exports.get_product = async (req, res, next) => {
  return { msg: 'This is GET /product route !' };
};

exports.post_product = async (req, res, next) => {
  const { product } = req.body;
  await Joi.validate(product, productSchema);
  
  const newProduct = new Product(product);

  const addedProduct = await newProduct.save();

  return {
    status: 202,
    addedProduct
  };
};