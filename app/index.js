const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const ExpressServer = require('../lib/index').ExpressServer;

app.use(morgan('dev'));

app.get('/', (req, res, next) => {
  res.send('Hello world!');
});



const server = ExpressServer(app.listen(9000), { debug: true });





// app.listen(4000);