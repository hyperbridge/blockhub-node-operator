const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const ExpressServer = require('../lib/index').ExpressServer;
const bodyParser = require('body-parser');

app.use(morgan('dev'));

const productsRoutes = require('./routes/products');

app.use('/product', productsRoutes);


app.use((req, res, next) => res.status(404).json({ msg: 'Inappropriate request' }));

app.use((req, res, next, err) => {
  throw(err);
});



const server = ExpressServer(app.listen(9000), { debug: true });