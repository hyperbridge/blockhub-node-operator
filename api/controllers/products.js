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
  const { id } = req.userData;
  await Joi.validate(product, productSchema);

  const newProduct = {
    ...product,
    author: id,
    createdAt: Date.now,
    updatedAt: Date.now
  }

  const { _id: id } = await new Product(newProduct).save();

  return {
    status: 201,
    msg: `Product has been successfully created with id ${id}`,
    id
  };
};

exports.patch_product = async req => {
  const { productId } = req.params;
  const { product } = req.body;
  const { id } = req.userData;

  await Joi.validate(product, productSchema);
  await Product.where({ _id: productId, author: id }).updateOne(product);

  return {
    msg: `Product with id ${productId} has been successfully updated`
  };
};

exports.delete_product = async req => {
  const { productId } = req.params;

  await Product.deleteOne({ _id: productId, author: id });

  return {
    msg: `Product with id ${productId} has been successfully deleted`
  };
};

exports.get_products_tags = async req => {
  const { tagsType } = req.params;
  if (tagsType !== 'developer' && tagsType !== 'system') {
    return { msg: `You have provided invalid type of tags`, status: 400 };
  }
  const tags = req.params.tags.split(',');
  const products = await Product.find({ [tagsType + '_tags']: { $in: tags } });
  return { items: products.length, tags, products };
};

exports.get_products_name = async req => {
  const { productName } = req.params;
  const products = await Product.find({ name: { $regex: productName, $options: 'i' } });
  return { 
    items: products.length,
    products
  };
};