'use strict';

/**
* Import Module
*/
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');


var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/7232c1c88ed249be9f104f74848a0a6b'));


/**
* Exports Module
*/
const fn = module.exports = {};



fn.send = async (config, items) => {

  // Rows
  const rows = [];
  // Accounts from csv file
  const data = fn.parse(items);
  // Decimal Places
  const decimals = web3.utils.toBN(18);
  // Transaction Count
  const txncount = await web3.eth.getTransactionCount(config.source);
  // Smart Contract
  const contract = new web3.eth.Contract(config.abi, config.contract, {from: config.source});


  for(let i in data) {
    var toAddress = data[i]['address'];
    var tokenAmount = data[i]['token'];

    // Check if address is valid
    if(web3.utils.isAddress(toAddress)) {
      var tokenAmount = web3.utils.toBN(tokenAmount);
      var tokenAmount = '0x' + tokenAmount.mul(web3.utils.toBN(10).pow(decimals)).toString('hex');

      var transaction = new Tx({
        "value":    "0x0",
        "from":     config.source,
        "to":       config.contract,
        "nonce":    web3.utils.toHex(txncount+Number(i)),
        "gasLimit": web3.utils.toHex(3000000),
        "gasPrice": web3.utils.toHex(2 * 1e9),
        "data":     contract.methods.transfer(toAddress, tokenAmount).encodeABI()
      });
      // Sign the transaction
      transaction.sign(Buffer.from(config.privatekey, 'hex'));
      // Send the transaction
      const send = await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
      if(send) {
        // Push each transaction
        rows[i] = {'status': true, 'address': toAddress, 'token': data[i]['token']};
      } else {
        rows[i] = {'status': false, 'address': toAddress, 'error': 'Something went wrong!'};
      }
    } else {
      rows[i] = {'status': false, 'address': toAddress, 'error': 'Invalid address'};
    }
  }
  return rows;
};




fn.parse = function(data) {
  var rows = [];

  data.shift();
  var data = data.filter((v) => v != null);

  for(let i in data) {
    const row = data[i].split(',');
    rows.push({'address': row[0], 'unix': row[1], 'date': row[2], 'eth': row[3], 'percentage': row[4], 'token': row[5]});
  }
  return rows;
};