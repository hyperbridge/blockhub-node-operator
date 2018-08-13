var express = require('express')
var http = require('http')
var https = require('https')
var {ExpressServer} = require('./index')
var {ipfsInit, ipfsFindPeers, ipfsAddFile} = require('./../ipfs/ipfs')


exports.init = (options, callback) => {
    var app = express()
  
    options = options || {}
    var path = options.path || '/'
    var port = options.port || 80
  
    delete options.path
  
    if (path[0] !== '/') {
      path = '/' + path
    }
  
    if (path[path.length - 1] !== '/') {
      path += '/'
    }
  
    var server
    if (options.ssl) {
      if (options.ssl.certificate) {
        // Preserve compatibility with 0.2.7 API
        options.ssl.cert = options.ssl.certificate
        delete options.ssl.certificate
      }
  
      server = https.createServer(options.ssl, app)
      delete options.ssl
    } else {
      server = http.createServer(app)
    }
  
    var nodeOperator = ExpressServer(server, options)
    app.use(path, nodeOperator)
  
    if (callback) {
      server.listen(port, function() {
        callback(server)
      })
    } else {
      server.listen(port)
    }

    var ipfs = ipfsInit()

    ipfsFindPeers(ipfs).then((numberOfPeers) => {
        console.log(`IPFS - connected to ${numberOfPeers.length} peers`)
    }).catch((e) => {
        console.log(e);
    })
  
  
  
    return nodeOperator
  }