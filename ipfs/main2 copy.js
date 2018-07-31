const IPFS = require("ipfs-api");
const fs = require("fs");

const ipfs = new IPFS('localhost', '5001');

var ipfsHost    = 'localhost',
    ipfsAPIPort = '5001',
    ipfsWebPort = '8080'
const ipfsDataHost = "http://" + ipfsHost + ':' + ipfsWebPort + "/ipfs"

const files = [
    {
        path: "/tmp/wallet-twoInteractions.mp4",
        content: fs.createReadStream(__dirname + "/tmp/wallet-twoInteractions.mp4")
    }
]


ipfs.swarm.peers(function(err, response) {
    if (err) {
        console.error(err);
    } else {
        //console.log(response);
        console.log("IPFS - connected to " + response.length + " peers");
        
    }
});

ipfs.add(files, async (err, result) => {
    //fs.unlink(__dirname + "/tmp/test.txt");
    if (err) {
        console.error('Error sending file: ', err);
        return null;
    }
    else {
        var textURL = await ipfsDataHost + "/" + result[0].hash;
        await console.log('File: ', result[0].hash);
        await console.log(textURL);
    }
    console.log(result);
    console.log(result[0].hash);
})