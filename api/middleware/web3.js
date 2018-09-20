const web3 = require('web3');

const web3Setup = async (req, res, next) => {

  const Web3 = new web3(new web3.providers.HttpProvider(
    process.env.ETH_PROVIDER || 'http://localhost:8545'
  ));

  const connect = false;

  if (connect && await Web3.isConnected()) {
    const [networkId, coinBase] = await Promise.all([
      web3.eth.net.getId(),
      web3.eth.getCoinbase()
    ]);
  
    const balance = await Web3.eth.getBalance(coinBase);
  
    req.web3 = {
      networkId,
      coinBase,
      balance,
      Web3
    };
  }
  next();
};

module.exports = web3Setup;