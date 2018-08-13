var util = require('./util')
var bodyParser = require('body-parser')
var WebSocketServer = require('ws').Server
var url = require('url')
var cors = require('cors')

var app = {}

module.exports = {
  app,
  initializeWSS,
  setCleanupIntervals,
  initializeHTTP
}

/** Initialize WebSocket server. */
function initializeWSS(expressApp, server) {
  var self = expressApp; 

  if (expressApp.mountpath instanceof Array) {
    throw new Error("expressApp app can only be mounted on a single path")    
  }

  var path = expressApp.mountpath ? expressApp.mountpath : ''
  var path = path + (path[path.length - 1] != '/' ? '/' : '') + 'peerjs'

  expressApp._wss = new WebSocketServer({ path: path, server: server})

  expressApp._wss.on('connection', function(socket, req) {
    var query = url.parse(req.url, true).query
    var id = query.id
    var token = query.token
    var key = query.key
    var ip = req.socket.remoteAddress

    if (!id || !token || !key) {
      socket.send(JSON.stringify({ type: 'ERROR', payload: { msg: 'No id, token, or key supplied to websocket server' } }))
      socket.close()
      return
    }

    if (!self._clients[key] || !self._clients[key][id]) {
      checkKey(expressApp, key, ip, function(err) {
        if (!err) {
          if (!self._clients[key][id]) {
            self._clients[key][id] = { token: token, ip: ip }
            self._ips[ip]++
            socket.send(JSON.stringify({ type: 'OPEN' }))
          }
          configureWS(expressApp, expresssocket, key, id, token)
        } else {
          socket.send(JSON.stringify({ type: 'ERROR', payload: { msg: err } }))
        }
      })
    } else {
      configureWS(expressApp, socket, key, id, token)
    }
  })
}



function configureWS(expressApp, socket, key, id, token) {

  var self = expressApp
  var client = expressApp._clients[key][id]

  if (token === client.token) {
    // res 'close' event will delete client.res for us
    client.socket = socket
    // Client already exists
    if (client.res) {
      client.res.end()
    }
  } else {
    // ID-taken, invalid token
    socket.send(JSON.stringify({ type: 'ID-TAKEN', payload: { msg: 'ID is taken' } }))
    socket.close()
    return
  }

  processOutstanding(expressApp, key, id)

  // Cleanup after a socket closes.
  socket.on('close', function() {
    log(expressApp, 'Socket closed:', id)
    if (client.socket == socket) {
      removePeer(expressApp, key, id)
    }
  })

  // Handle messages from peers.
  socket.on('message', function(data) {
    try {
      var message = JSON.parse(data)

      if (['LEAVE', 'CANDIDATE', 'OFFER', 'ANSWER'].indexOf(message.type) !== -1) {
        handleTransmission(expressApp, key, {
          type: message.type,
          src: id,
          dst: message.dst,
          payload: message.payload
        })
      } else {
        util.prettyError('Message unrecognized')
      } 
    } catch(e) {
      log(expressApp, 'Invalid message', data)
      throw e
    }
  })

  // We're going to emit here, because for XHR we don't *know* when someone
  // disconnects.
  expressApp.emit('connection', id)
}

function checkAllowsDiscovery(expressApp, key, cb) {
  cb(expressApp._options.allow_discovery)
}

function checkKey(expressApp, key, ip, cb) {
  if (key == expressApp._options.key) {
    if (!expressApp._clients[key]) {
      expressApp._clients[key] = {}
    }
    if (!expressApp._outstanding[key]) {
      expressApp._outstanding[key] = {}
    }
    if (!expressApp._ips[ip]) {
      expressApp._ips[ip] = 0
    }
    // Check concurrent limit
    if (Object.keys(expressApp._clients[key]).length >= expressApp._options.concurrent_limit) {
      cb('Server has reached its concurrent user limit')
      return
    }
    if (expressApp._ips[ip] >= expressApp._options.ip_limit) {
      cb(ip + ' has reached its concurrent user limit')
      return
    }
    cb(null)
  } else {
    cb('Invalid key provided')
  }
}

/** Initialize HTTP server routes. */
function initializeHTTP(expressApp) {
  var self = expressApp

  expressApp.use(cors())

  expressApp.get('/', function(req, res, next) {
    res.send(require('../app.json'))
  })

  // Retrieve guaranteed random ID.
  expressApp.get('/:key/id', function(req, res, next) {
    res.contentType = 'text/html'
    res.send(generateClientId(expressApp, req.params.key))
  })

  // Server sets up HTTP streaming when you get post an ID.
  expressApp.post('/:key/:id/:token/id', function(req, res, next) {
    var id = req.params.id
    var token = req.params.token
    var key = req.params.key
    var ip = req.connection.remoteAddress

    if (!self._clients[key] || !self._clients[key][id]) {
      checkKey(expressApp, key, ip, function(err) {
        if (!err && !self._clients[key][id]) {
          self._clients[key][id] = { token: token, ip: ip }
          self._ips[ip]++
          startStreaming(expressApp, res, key, id, token, true)
        } else {
          res.send(JSON.stringify({ type: 'HTTP-ERROR' }))
        }
      })
    } else {
      startStreaming(expressApp, res, key, id, token)
    }
  })

  // Get a list of all peers for a key, enabled by the `allowDiscovery` flag.
  expressApp.get('/:key/peers', function(req, res, next) {
    var key = req.params.key

    if (self._clients[key]) {
      checkAllowsDiscovery(expressApp, key, function(isAllowed) {
        if (isAllowed) {
          res.send(Object.keys(self._clients[key]))
        } else {
          res.sendStatus(401)
        }
      })
    } else {
      res.sendStatus(404)
    }
  })

  var handle = function(req, res, next) {
    var key = req.params.key
    var id = req.params.id

    var client
    if (!self._clients[key] || !(client = self._clients[key][id])) {
      if (req.params.retry) {
        res.sendStatus(401)
        return
      } else {
        // Retry expressApp request
        req.params.retry = true
        setTimeout(handle, 25, req, res)
        return
      }
    }

    // Auth the req
    if (req.params.token !== client.token) {
      res.sendStatus(401)
      return
    } else {
      handleTransmission(expressApp, key, {
        type: req.body.type,
        src: id,
        dst: req.body.dst,
        payload: req.body.payload
      })
      res.sendStatus(200)
    }
  }

  var jsonParser = bodyParser.json()

  expressApp.post('/:key/:id/:token/offer', jsonParser, handle)

  expressApp.post('/:key/:id/:token/candidate', jsonParser, handle)

  expressApp.post('/:key/:id/:token/answer', jsonParser, handle)

  expressApp.post('/:key/:id/:token/leave', jsonParser, handle)
}

/** Saves a streaming response and takes care of timeouts and headers. */
function startStreaming(expressApp, res, key, id, token, open) {
  var self = expressApp

  res.writeHead(200, {'Content-Type': 'application/octet-stream'})

  var pad = '00'
  for (var i = 0; i < 10; i++) {
    pad += pad
  }
  res.write(pad + '\n')

  if (open) {
    res.write(JSON.stringify({ type: 'OPEN' }) + '\n')
  }

  var client = expressApp._clients[key][id]

  if (token === client.token) {
    // Client already exists
    res.on('close', function() {
      if (client.res === res) {
        if (!client.socket) {
          // No new request yet, peer dead
          removePeer(expressApp, key, id)
          return
        }
        delete client.res
      }
    })
    client.res = res
    processOutstanding(expressApp, key, id)
  } else {
    // ID-taken, invalid token
    res.end(JSON.stringify({ type: 'HTTP-ERROR' }))
  }
}

function pruneOutstanding(expressApp) {
  var keys = Object.keys(expressApp._outstanding)
  for (var k = 0, kk = keys.length; k < kk; k += 1) {
    var key = keys[k]
    var dsts = Object.keys(expressApp._outstanding[key])
    for (var i = 0, ii = dsts.length; i < ii; i += 1) {
      var offers = expressApp._outstanding[key][dsts[i]]
      var seen = {}
      for (var j = 0, jj = offers.length; j < jj; j += 1) {
        var message = offers[j]
        if (!seen[message.src]) {
          handleTransmission(expressApp, key, { type: 'EXPIRE', src: message.dst, dst: message.src })
          seen[message.src] = true
        }
      }
    }
    expressApp._outstanding[key] = {}
  }
}

/** Cleanup */
function setCleanupIntervals(expressApp) {
  var self = expressApp

  // Clean up ips every 10 minutes
  setInterval(function() {
    var keys = Object.keys(self._ips)
    for (var i = 0, ii = keys.length; i < ii; i += 1) {
      var key = keys[i]
      if (self._ips[key] === 0) {
        delete self._ips[key]
      }
    }
  }, 600000)

  // Clean up outstanding messages every 5 seconds
  setInterval(function() {
    pruneOutstanding(expressApp)
  }, 5000)
}

/** Process outstanding peer offers. */
function processOutstanding(expressApp, key, id) {
  var offers = expressApp._outstanding[key][id]
  if (!offers) {
    return
  }
  for (var j = 0, jj = offers.length; j < jj; j += 1) {
    handleTransmission(expressApp, key, offers[j])
  }
  delete expressApp._outstanding[key][id]
}

function removePeer(key, id) {
  if (expressApp._clients[key] && expressApp._clients[key][id]) {
    expressApp._ips[expressApp._clients[key][id].ip]--
    delete expressApp._clients[key][id]
    expressApp.emit('disconnect', id)
  }
}

/** Handles passing on a message. */
function handleTransmission(key, message) {
  var type = message.type
  var src = message.src
  var dst = message.dst
  var data = JSON.stringify(message)

  var destination = expressApp._clients[key][dst]

  // User is connected!
  if (destination) {
    try {
      log(expressApp, type, 'from', src, 'to', dst)
      if (destination.socket) {
        destination.socket.send(data)
      } else if (destination.res) {
        data += '\n'
        destination.res.write(data)
      } else {
        // Neither socket no res available. Peer dead?
        throw "Peer dead"
      }
    } catch (e) {
      // expressApp happens when a peer disconnects without closing connections and
      // the associated WebSocket has not closed.
      // Tell other side to stop trying.
      removePeer(expressApp, key, dst)
      handleTransmission(expressApp, key, {
        type: 'LEAVE',
        src: dst,
        dst: src
      })
    }
  } else {
    // Wait for expressApp client to connect/reconnect (XHR) for important
    // messages.
    if (type !== 'LEAVE' && type !== 'EXPIRE' && dst) {
      var self = expressApp
      if (!expressApp._outstanding[key][dst]) {
        expressApp._outstanding[key][dst] = []
      }
      expressApp._outstanding[key][dst].push(message)
    } else if (type === 'LEAVE' && !dst) {
      removePeer(expressApp, key, src)
    } else {
      // Unavailable destination specified with message LEAVE or EXPIRE
      // Ignore
    }
  }
}

function generateClientId(expressApp, key) {
  var clientId = util.randomId()
  if (!expressApp._clients[key]) {
    return clientId
  }
  while (!!expressApp._clients[key][clientId]) {
    clientId = util.randomId()
  }
  return clientId
}

log = function() {
  if (expressApp._options.debug) {
    console.log.apply(console, arguments)
  }
}

