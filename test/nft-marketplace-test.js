const {expect} = require("chai");

describe("NFTMarketplace", function () {
    it("Should create and execute NFT Market Sales", async function () {
        const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
        const nftMarketplace = await NFTMarketplace.deploy();
        await nftMarketplace.deployed();
        const nftMarketplaceAddress = nftMarketplace.address;

        const NFT = await ethers.getContractFactory("NFT");
        const nft = await NFT.deploy(nftMarketplaceAddress);
        await nft.deployed();
        const nftAddress = nft.address;

        let listingPrice = await nftMarketplace.getListingPrice();
        listingPrice = listingPrice.toString();

        /* Price in MATIC the Polygon Coin */
        const price = ethers.utils.parseUnits('0.025', 'ether');

        /* Creating some NFTs */
        await nft.createToken("myURI1");
        await nft.createToken("myURI2");

        /* The last Argument contains the Value which is passed in the Transaction */
        await nftMarketplace.createMarketplaceItem(nftAddress, 1, price, {value: listingPrice});
        await nftMarketplace.createMarketplaceItem(nftAddress, 2, price, {value: listingPrice});

        /* Ignoring the first Address from the Test Accounts because it is the Deployer of these Smart Contract by Default */
        const [_, buyerAddress] = await ethers.getSigners();
        /* Using the second Address from the Test Accounts to create a Marketplace Sale */
        await nftMarketplace.connect(buyerAddress).createMarketplaceSale(nftAddress, 1, {value: listingPrice});

        let marketplaceItems = await nftMarketplace.fetchMarketplaceItems();

        /* Asynchronous Mapping */
        marketplaceItems = await Promise.all(marketplaceItems.map(async marketplaceItem => {
            const tokenURI = await nft.tokenURI(marketplaceItem.tokenId);
            let item = {
                price: marketplaceItem.price.toString(),
                tokenId: marketplaceItem.tokenId.toString(),
                seller: marketplaceItem.seller,
                owner: marketplaceItem.owner,
                tokenURI: tokenURI
            }
            return item;
        }));
        console.log(marketplaceItems);
    });
});
