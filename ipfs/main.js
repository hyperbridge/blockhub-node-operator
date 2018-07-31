const IPFS = require("ipfs");
const fs = require("fs");
//const OrbitDB = require("orbit-db");
//const path = require("path");


const ipfsNode = new IPFS();
let hash = "";

const files = [
    {
        path: "/tmp/test.html",
        content: fs.readFileSync(__dirname + "/tmp/test.html")
    }
]

ipfsNode.on("error", (e) => console.log(e));
ipfsNode.on("ready", async () => {

    //ipfs.swarm
    console.log("IPFS node is online");

    //ipfsId = await IPFS.id();
    //console.log(ipfsId);

    await ipfsNode.files.add(files, function(err, returnFiles) {
        console.log(returnFiles);
        hash = returnFiles.find(x => x.path === "/tmp/test.html").hash;
        console.log(hash);

        ipfsNode.pin.add(hash, function(err, res) {
            console.log("Pin Res:", res);
            ipfsNode.files.cat(hash, function(err, res) {
                console.log(res);
            })
        })
    
        
    })

    

    

    // node.stop(() => {
    //     console.log("IPFS node is now offine");
    // })
})



// const ipfsOptions = {
//     config: {
//       "Addresses": {
//         "Swarm": [
//           "/ip4/127.0.0.1/tcp/4001",
//           "/ip6/::/etcp/4001",
//           "/ip4/127.0.0.1/tcp/4002/ws"
//         ],
//         "Announce": [],
//         "NoAnnounce": [],
//         "API": "/ip4/127.0.0.1/tcp/5001",
//         "Gateway": "/ip4/127.0.0.1/tcp/8080"
//       }
//     },
//     EXPERIMENTAL: {
//       pubsub: true
//     }
//   }