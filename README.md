[![Build Status](https://travis-ci.org/hyperbridge/blockhub-node-operator.png?branch=master)](https://travis-ci.org/hyperbridge/blockhub-node-operator)

# BlockHub Node Operator

BlockHub Node Operator helps broker connections between BlockHub clients. Data is not proxied through the server.

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://www.heroku.com/deploy/?template=https://github.com/hyperbridge/blockhub-node-operator)

### Run Server

Install the library:

```bash
$> yarn add blockhub-node-operator
```

Run the server:

```bash
$> blockhub-node-operator --port 9000 --key nodeOperator
```

Or, create a custom server:

```js
let BlockHubServer = require('blockhub-node-operator').BlockHubServer
let server = BlockHubServer({ port: 9000, path: '/myapp' })
```

Connecting to the server from frontend:

```html
<script>
    let peer = new Peer('someid', { host: 'localhost', port: 9000, path: '/myapp' })
</script>
```

Using HTTPS: Simply pass in PEM-encoded certificate and key.

```js
let fs = require('fs')
let BlockHubServer = require('peer').BlockHubServer

let server = BlockHubServer({
  port: 9000,
  ssl: {
    key: fs.readFileSync('/path/to/your/ssl/key/here.key'),
    cert: fs.readFileSync('/path/to/your/ssl/certificate/here.crt')
  }
})
```

#### Running BlockHubServer behind a reverse proxy

Make sure to set the `proxied` option, otherwise IP based limiting will fail.
The option is passed verbatim to the
[expressjs `trust proxy` setting](http://expressjs.com/4x/api.html#app-settings)
if it is truthy.

```js
let BlockHubServer = require('blockhub-node-operator').BlockHubServer
let server = BlockHubServer({ port: 9000, path: '/myapp', proxied: true })
```

### Combining with existing express app

```js
let express = require('express')
let app = express()
let ExpressServer = require('blockhub-node-operator').ExpressServer

app.get('/', function(req, res, next) { res.send('Hello world!') })

// =======

let server = app.listen(9000)

let options = {
    debug: true
}

let expressServer = ExpressServer(server, options)

app.use('/api', expressServer)

// == OR ==

let server = require('http').createServer(app)
let expressServer = ExpressServer(server, options)

app.use('/nodeOperator', expressServer)

server.listen(9000)

// ========
```

### Events

The `'connection'` event is emitted when a peer connects to the server.

```js
expressServer.on('connection', function(id) { ... })
```

The `'disconnect'` event is emitted when a peer disconnects from the server or
when the peer can no longer be reached.

```js
expressServer.on('disconnect', function(id) { ... })
```

## Problems?

Discuss Node Operator on our Gitter:
https://gitter.im/Hyperbridge/Lobby

Please post any bugs as a Github issue.
