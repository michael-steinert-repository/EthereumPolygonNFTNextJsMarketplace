const hre = require("hardhat");

async function main() {

    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy();
    await nftMarketplace.deployed();
    console.log("NFTMarketplace deployed to:", nftMarketplace.address);

    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(nftMarketplace.address);
    await nft.deployed();
    console.log("NFT deployed to:", nft.address);
}

main().then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
