

exports.get_product = async (req, res, next) => {
  return { msg: 'This is GET /product route !' };
};

exports.post_product = async (req, res, next) => {
  return { status: 202 };
};