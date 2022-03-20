const { utils } = require("ethers");

async function main() {
    // Get owner/deployer's wallet address
    const [owner] = await hre.ethers.getSigners();
    console.log("Owner:", owner.address);

    // Get contract that we want to deploy
    const contractFactory = await hre.ethers.getContractFactory("Payments");

    // Deploy contract with the correct constructor arguments
    const contract = await contractFactory.deploy();

    // Wait for this transaction to be mined
    await contract.deployed();

    // Get contract address
    console.log("Contract deployed to:", contract.address);

    // Set Revenues of sale evenly to 50% each for 2 accounts
    txn = await contract.new([payee1, payee2], [50, 50]) 
    await txn.wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });