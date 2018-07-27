const IPFS = require("ipfs");
const fs = require("fs");
//const path = require("path");

const node = new IPFS();
let hash = "";

const files = [
    {
        path: "/tmp/test.txt",
        content: fs.readFileSync(__dirname + "/tmp/test.txt")
    }
]

node.on("ready", async () => {
    console.log("IPFS node is online");

    await node.files.add(files, function(err, returnFiles) {
        console.log(returnFiles);
        hash = returnFiles.find(x => x.path === "/tmp/test.txt").hash;
        console.log(hash);

        node.pin.add(hash, function(err, res) {
            console.log(res);
        })
    })

    

    // node.stop(() => {
    //     console.log("IPFS node is now offine");
    // })
})