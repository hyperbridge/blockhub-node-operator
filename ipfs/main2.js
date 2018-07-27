const IPFS = require("ipfs-api");
const fs = require("fs");

const ipfs = new IPFS('localhost', '5001', {protocol: 'http'});

const files = [
    {
        path: "/tmp/test.txt",
        content: fs.readFileSync(__dirname + "/tmp/test.txt")
    }
]

ipfs.add(fs.readFileSync(__dirname + "/tmp/test.txt"), (err, ipfshash) => {
    console.log(err, ipfshash);
})