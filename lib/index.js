var express = require('express')
//var proto = require('./server').app //Leave proto for now to allow the other functions to work
var {initializeWSS, setCleanupIntervals, initializeHTTP} = require('./server')
var util = require('./util')
var http = require('http')
var https = require('https')

function ExpressServer(server, options) {
  var app = express()

  //util.extend(app, proto)

  options = app._options = util.extend({}, {
    debug: false,
    timeout: 5000,
    key: 'nodeOperator',
    ip_limit: 5000,
    concurrent_limit: 5000,
    allow_discovery: true,
    proxied: false
  }, options)

  // Connected clients
  app._clients = {}

  // Messages waiting for another peer.
  app._outstanding = {}

  // Mark concurrent users per ip
  app._ips = {}

  if (options.proxied) {
    app.set('trust proxy', options.proxied)
  }

  app.on('mount', function() {
    if (!server) {
      throw new Error('Server is not passed to constructor - '+
        'can\'t start BlockHubServer')
    }

    // Initialize HTTP routes. This is only used for the first few milliseconds
    // before a socket is opened for a Peer.
    initializeHTTP(app)
    setCleanupIntervals(app)
    initializeWSS(app, server)
  })

  return app
}

exports = module.exports = {
  ExpressServer: ExpressServer,
}
