const express = require('express');
const app = express();
const http = require("http").createServer(app);
const fs = require('fs');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256');
const { MerkleTree } = require('merkletreejs');

app.use(cors());
app.use(express.json());
let merkleTree;
let merkleRoot;

function getHashWithZeros(block, minZeros = 5) {
  let hash;
  for (let nonce = 0; true; nonce++) {
    hash = SHA256(block.index + block.precedingHash + block.timestamp + JSON.stringify(block.data) + nonce).toString();

    if (hash.substring(0, minZeros) === Array(minZeros + 1).join('0'))
      break;
  }

  return hash;
}

(() => {
  fs.readFile('blockchain.json', (err, data) => {
    if (err) {
      throw (Error);
    }

    const jsonData = JSON.parse(data);
    if (jsonData.blocks.length == 0) {
      const genesisBlock = {
        index: 0,
        timestamp: Date.now(),
        data: "Genesis block",
        precedingHash: "0"
      };

      genesisBlock.hash = getHashWithZeros(genesisBlock);
      jsonData.blocks.push(genesisBlock);

      fs.writeFile('blockchain.json', JSON.stringify(jsonData), (err) => {
        if (err) {
          throw (Error);
        }

        console.log('Sikeres genesisblock létrehozás!');
      });
    }

    const hashes = jsonData.blocks.map(x => x.hash);

    merkleTree = new MerkleTree(hashes, SHA256);
    merkleRoot = merkleTree.getRoot().toString('hex');

    // checkTree('c39598dbed1a1d2cf912c62d037ea89c67728e3b0dc12bf3aa80ba9b62bd6d2c');
    // checkTree('ac5eb7d2c7ef176eddbc84a7dffe6e61291bc6cc7a8c413a9fd5b21cd27040b2');
    // checkTree('84629c255547ce43b73a0dc46d781c457b68e35327060121eb3a69355a113171');
    // MerkleTree.print(merkleTree);
  })
})()

app.get('/getBlockChain', (req, res) => {
  fs.readFile('blockchain.json', (err, data) => {
    if (err) {
      res.send({ error: err.message });
    }

    res.status(200).send(JSON.parse(data));
  });
});

app.get('/getLastBlock', (req, res) => {
  fs.readFile('blockchain.json', (err, data) => {
    if (err) {
      res.send({ error: err.message });
    }

    const jsonData = JSON.parse(data);
    const last = jsonData.blocks[jsonData.blocks.length - 1];

    res.status(200).send(last);
  });
});

app.post('/makeTransaction', (req, res) => {
  fs.readFile('blockchain.json', (err, data) => {
    if (err) {
      res.send({ error: err.message });
    }

    const jsonData = JSON.parse(data);
    const newTx = {
      index: jsonData.blocks.length,
      timestamp: Date.now(),
      data: req.body,
      precedingHash: jsonData.blocks[jsonData.blocks.length - 1].hash
    };

    newTx.hash = getHashWithZeros(newTx);
    jsonData.blocks.push(newTx);

    fs.writeFile('blockchain.json', JSON.stringify(jsonData), (err) => {
      if (err) {
        res.send({ error: err.message });
      }

      console.log('Sikeres tranzakció!');
      res.sendStatus(200);
    });
  })
})


function checkTree(hash) {
  const proof = merkleTree.getProof(hash);
  console.log(merkleTree.verify(proof, hash, merkleRoot));
}


http.listen(3000, () => {
  console.log('Listening on: localhost:3000');
});