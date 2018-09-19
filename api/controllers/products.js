const Joi = require('joi');
const productSchema = require('../schemas/product');
const Product = require('../models/product');

exports.get_product = async req => {
  const { productId } = req.params;

  const product = await Product.findOne({ _id: productId });

  return {
    product
  };
};

exports.post_product = async req => {
  const { product } = req.body;
  await Joi.validate(product, productSchema);

  const { _id: id } = await new Product(product).save();

  return {
    status: 201,
    msg: `Product has been successfully created with id ${id}`,
    id
  };
};

exports.patch_product = async req => {
  const { productId } = req.params;
  const { product } = req.body;

  await Product.where({ _id: productId }).updateOne(product);

  return {
    msg: `Product with id ${productId} has been successfully updated`
  };
};

exports.delete_product = async req => {
  const { productId } = req.params;

  await Product.deleteOne({ _id: productId });

  return {
    msg: `Product with id ${productId} has been successfully deleted`
  };
};