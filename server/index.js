const express = require('express');
const app = express();
const http = require("http").createServer(app);
const fs = require('fs');
const cors = require('cors');
const SHA256 = require('crypto-js/sha256');
const rs = require('jsrsasign');
const rsu = require('jsrsasign-util');
const { MerkleTree } = require('merkletreejs');

app.use(cors());
app.use(express.json());
let merkleTree;
let merkleRoot;

const A_PRIVATE_KEY = rsu.readFile('./private_keys/A.key');
const prvA = rs.KEYUTIL.getKey(A_PRIVATE_KEY);
const A_PUBLIC_KEY = rsu.readFile('./public_keys/A.key.pub');
const pubA = rs.KEYUTIL.getKey(A_PUBLIC_KEY);
const B_PRIVATE_KEY = rsu.readFile('./private_keys/B.key');
const prvB = rs.KEYUTIL.getKey(B_PRIVATE_KEY);
const B_PUBLIC_KEY = rsu.readFile('./public_keys/B.key.pub');
const pubB = rs.KEYUTIL.getKey(B_PUBLIC_KEY);

function getHashWithZeros(block, minZeros = 5) {
  let hash;
  
  for (let nonce = 1; true; nonce++) {
    hash = SHA256(block.index + block.precedingHash + JSON.stringify(block.data) + nonce).toString();

    if (hash.substring(0, minZeros) === Array(minZeros + 1).join('0'))
      break;
  }

  return hash;
}

function signTx(block) {
  let sig = new rs.KJUR.crypto.Signature({alg: 'SHA1withRSA'});

  if (block.data.from === 'A') {
    sig.init(prvA);
  } else {
    sig.init(prvB);
  }

  sig.updateString(block.data.from + block.data.to + block.data.amount);
  let sigHex = sig.sign();
  return sigHex;
}

function verifySign(block) {
  let sigHex = block.sign;
  let sig = new rs.KJUR.crypto.Signature({alg: 'SHA1withRSA'});
  if (block.data.from === 'A') {
    sig.init(pubA)
  } else {
    sig.init(pubB);
  }

  sig.updateString(block.data.from + block.data.to + block.data.amount);
  let isValid = sig.verify(sigHex);

  return isValid;
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

    MerkleTree.print(merkleTree);
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
    newTx.sign = signTx(newTx);
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

function verify(hash) {
  const proof = merkleTree.getProof(hash);
  console.log(merkleTree.verify(proof, hash, merkleRoot));
}

http.listen(3000, () => {
  console.log('Listening on: localhost:3000');
});