//We get the address of the deployer/owner (us)

//We get the contract that we want to deploy.

//We send a request for the contract to be deployed and wait for a miner to pick this request and add it to the blockchain.

//Once mined, we get the contract address.

//We then call public functions of our contract. We reserve 10 NFTs, mint 3 NFTs by sending 0.03 ETH to the contract, and check the NFTs owned by us. Note that the first two calls require gas (because they’re writing to the blockchain) whereas the third simply reads from the blockchain.


const { utils } = require("ethers");

async function main() {
  const baseTokenURI = "ipfs://QmPJNjcoZgMGttsQ38iH3kdTiHX4gwRu4w3m5qc5Ev4yNr/";

    // Get owner/deployer's wallet address
    const [owner] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);

    // Get contract that we want to deploy
    const contractFactory = await hre.ethers.getContractFactory("ArkaniansNFTs");

    // Deploy contract with the correct constructor arguments
    const contract = await contractFactory.deploy(baseTokenURI);

    // Wait for this transaction to be mined
    await contract.deployed();

    // Get contract address
    console.log("Contract deployed to:", contract.address);

     // Set Royalties to 10% for OpenSea and Rarible
     txn = await contract.setRoyalties(0, accounts[0], 1000)
     await txn.wait()
     console.log("10% royalties have been set for OpenSea and Rarible")
     
    //Mint NFTs
    //let txn = await contract.mintArkanians();
    //await txn.wait();
    //console.log("10 Arkania NFTs have been minted");
   
    // Get all token IDs of the owner
    let tokens = await contract.tokensOfOwner(owner.address)
    console.log("Owner has tokens: ", tokens);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });