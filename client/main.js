const resultDiv = document.querySelector('.result-div');

(async () => {
  const sendButton = document.querySelector('.send-button');
  const getButton = document.querySelector('.get-button');
  const getLastButton = document.querySelector('.get-last-button');

  sendButton.addEventListener('click', () => {
    makeTransaction();
  });

  getButton.addEventListener('click', async () => {
    const chain = await getChain();
    resultDiv.innerHTML = '';
    chain.blocks.forEach(block => renderBlock(block));
  });

  getLastButton.addEventListener('click', async () => {
    const lastBlock = await getLastBlock();
    resultDiv.innerHTML = '';
    renderBlock(lastBlock);
  })
})()

async function getChain() {
  const bc = await fetch('http://127.0.0.1:3000/getBlockChain');

  return bc.json();
}

async function getLastBlock() {
  const bc = await fetch('http://127.0.0.1:3000/getLastBlock');

  return bc.json();
}

async function makeTransaction() {
  const from = document.querySelector('#from');
  const to = document.querySelector('#to');
  const amount = document.querySelector('#amount');
  const resultText = document.querySelector('.result-text');

  const data = { from: from.value, to: to.value, amount: amount.value };

  from.value = '';
  to.value = '';
  amount.value = '';

  resultText.innerHTML = 'Kérem várjon a tranzakció befejezéséig!';
  
  const result = await fetch('http://127.0.0.1:3000/makeTransaction', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (result.status == 200) {
    resultText.innerHTML = 'Sikeres tranzakció!';
  } else {
    resultText.innerHTML = 'Sikertelen tranzakció!';
  }
}

function renderBlock(block) {
  let newBlock;
  if (block.data.from) {
    newBlock = `
    <div>
      <p>From: ${block.data.from}</p>
      <p>To: ${block.data.to}</p>
      <p>Amount: ${block.data.amount}</p>
      <p>Hash: ${block.hash}</p>
      <p>Preceding hash: ${block.precedingHash}</p>
      <br />
    </div>
  `;
  } else {
    newBlock = `
    <div>
      <p>From: ${block.data}</p>
      <p>To: ${block.hash}</p>
      <p>Preceding hash: ${block.precedingHash}</p>
      <br />
    </div>
  `;
  }

  resultDiv.innerHTML += newBlock;
}