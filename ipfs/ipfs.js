/**
 * IFPS Test
 * 
 * Setup prior to running:
 * - Install IPFS globally
 * - Run commands in terminal: 
 *      ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/9000
 *      ipfs daemon
 *      
 */


const IPFS = require("ipfs-api");
const fs = require("fs");

var ipfsHost    = 'localhost',
    ipfsAPIPort = '5001',
    ipfsWebPort = '9000'
const ipfsDataHost = "http://" + ipfsHost + ':' + ipfsWebPort + "/ipfs"


module.exports= {
    ipfsInit,
    ipfsFindPeers,
    ipfsAddFile
}

/** Initialize an IPFS instance */
var ipfsInit = () => {
    console.log("Creating IPFS node");
    return new IPFS('localhost', '5001');
}


/** Create files for uploading */
var createFileStream = (path) => {
    const files = [
        {
            path: path,
            content: fs.createReadStream(__dirname + path)
        }
    ]
    return files
}

/** Returns all Peers ipfs node is connected to */
var ipfsFindPeers = (ipfs) => {
    let allPeers = ipfs.swarm.peers()
    return allPeers;
}

/** Add files to IPFS network */
var ipfsAddFile = (ipfs, path) => {
    const files = createFileStream(path)

    ipfs.add(files, (err, result) => {
        //fs.unlink(__dirname + "/tmp/test.txt");
        if (err) {
            console.error('ERROR: IPFS daemon has not been started ', err);
            return null;
        }
        else {
            var textURL = ipfsDataHost + "/" + result[0].hash;
            console.log('File: ', result[0].hash);
            console.log(textURL);
        }
        console.log(result);
        console.log(result[0].hash);
    })
}



var ipfsInstance = ipfsInit();

ipfsFindPeers(ipfsInstance).then((numberOfPeers) => {
    console.log(`IPFS - connected to ${numberOfPeers.length} peers`)
}).catch((e) => {
    console.log(e);
})

ipfsAddFile(ipfsInstance, "/tmp/test.html");