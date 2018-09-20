const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const ExpressServer = require('../lib/index').ExpressServer;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const web3Setup = require('./middleware/web3');

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@blockhub-89gr6.mongodb.net/test?retryWrites=true`,
  { useNewUrlParser: true }
);

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(web3Setup);

const productsRoutes = require('./routes/products');
const ethereumRoutes = require('./routes/ethereum');

app.use('/product', productsRoutes);
app.use('/eth', ethereumRoutes);


app.use((req, res, next) => res.status(404).json({ msg: 'Inappropriate request' }));

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500);
  res.json({ msg: err.msg || err.message || 'Internal server error' });
});


// app.listen(9000);
ExpressServer(app.listen(9000), { debug: true });