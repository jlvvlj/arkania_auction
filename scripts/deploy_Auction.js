//We get the address of the deployer/owner (us)

//We get the contract that we want to deploy.

//We send a request for the contract to be deployed and wait for a miner to pick this request and add it to the blockchain.

//Once mined, we get the contract address.

//We then call public functions of our contract. 

const { utils } = require("ethers");

async function main() {
    const baseTokenURI = "ipfs://QmPJNjcoZgMGttsQ38iH3kdTiHX4gwRu4w3m5qc5Ev4yNr/";
    // Get owner/deployer's wallet address
    const [owner] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);

    // Get contract that we want to deploy
    const contractFactory = await hre.ethers.getContractFactory("NFT");

    // Deploy contract with the correct constructor arguments
    const contract = await contractFactory.deploy(baseTokenURI);

    // Wait for this transaction to be mined
    await contract.deployed();

    // Get contract address
    console.log("Contract deployed to:", contract.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });