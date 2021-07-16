// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
/* Security Mechanism to prevent Reentry Attacks */
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private itemIds;
    Counters.Counter private itemsSold;

    address payable owner;
    /* Price in MATIC the Polygon Coin */
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketplaceItem {
        uint itemId;
        address nftAddress;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool isSold;
    }

    mapping(uint256 => MarketplaceItem) private idToMarketplaceItem;

    event MarketplaceItemCreated (
        uint itemId,
        address nftAddress,
        uint256 tokenId,
        address payable seller,
        address payable owner,
        uint256 price,
        bool isSold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function createMarketplaceItem(address _nftAddress, uint256 _tokenId, uint256 _price) public payable nonReentrant {
        require(_price > 0, "Price must be at least 1 Wei");
        require(msg.value == listingPrice, "Price must be equal to Listing Price");

        itemIds.increment();
        uint256 itemId = itemIds.current();
        address payable _seller = payable(msg.sender);
        address payable _owner = payable(address(0x0));
        bool isSold = false;

        idToMarketplaceItem[itemId] = MarketplaceItem(itemId, _nftAddress, _tokenId, _seller, _owner, _price, isSold);

        /* Changing the Ownership of the created NFT to the Marketplace */
        /* Then can the Contract transfer the NFT to the new Owner */
        IERC721(_nftAddress).transferFrom(msg.sender, address(this), _tokenId);

        emit MarketplaceItemCreated(itemId, _nftAddress, _tokenId, _seller, _owner, _price, isSold);
    }

    function createMarketplaceSale(address _nftAddress, uint256 _itemId) public payable nonReentrant {
        uint256 price = idToMarketplaceItem[_itemId].price;
        uint256 tokenId = idToMarketplaceItem[_itemId].tokenId;

        require(msg.value == price, "Price must be equal to Price in Order to complete the Purchase");

        /* Transferring the Price for the NFT to the Seller */
        idToMarketplaceItem[_itemId].seller.transfer(msg.value);
        /* Transferring the Ownership of the NFT (from these Contract) to the new Owner */
        IERC721(_nftAddress).transferFrom(address(this), msg.sender, tokenId);
        /* Updating the local Value for the MarketplaceItem */
        idToMarketplaceItem[_itemId].owner = payable(msg.sender);
        idToMarketplaceItem[_itemId].isSold = true;
        itemsSold.increment();
        /* Transferring the Listing Price to the Contract Owner */
        payable(owner).transfer(listingPrice);
    }

    function fetchMarketplaceItems() public view returns (MarketplaceItem[] memory) {
        uint256 itemCount = itemIds.current();
        uint256 unsoldItemCount = itemIds.current() - itemsSold.current();
        uint256 currentIndex = 0;

        /* Keyword storage is for pointing to global (State) Variables, and Keyword memory is for allocating local Variables */
        MarketplaceItem[] memory marketplaceItems = new MarketplaceItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            /* Checking if MarketplaceItem is unsold */
            if (idToMarketplaceItem[i + 1].owner == payable(address(0x0))) {
                uint256 currentId = idToMarketplaceItem[i + 1].itemId;
                MarketplaceItem storage currentMarketplaceItem = idToMarketplaceItem[currentId];
                marketplaceItems[currentIndex] = currentMarketplaceItem;
                currentIndex++;
            }
        }
        return marketplaceItems;
    }

    function fetchOwnNFTs() public view returns (MarketplaceItem[] memory) {
        uint256 itemCount = itemIds.current();
        uint256 totalItemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            /* Checking if Sender is Owner of NFT */
            if (idToMarketplaceItem[i + 1].owner == payable(msg.sender)) {
                totalItemCount++;
            }
        }

        MarketplaceItem[] memory marketplaceItems = new MarketplaceItem[](totalItemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            /* Checking if Sender is Owner of NFT */
            if (idToMarketplaceItem[i + 1].owner == payable(msg.sender)) {
                uint256 currentId = idToMarketplaceItem[i + 1].itemId;
                MarketplaceItem storage currentMarketplaceItem = idToMarketplaceItem[currentId];
                marketplaceItems[currentIndex] = currentMarketplaceItem;
                currentIndex++;
            }
        }
        return marketplaceItems;
    }

    function fetchMyMarketplaceItems() public view returns (MarketplaceItem[] memory) {
        uint256 itemCount = itemIds.current();
        uint256 totalItemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            /* Checking if Sender is Seller of NFT */
            if (idToMarketplaceItem[i + 1].seller == payable(msg.sender)) {
                totalItemCount++;
            }
        }

        MarketplaceItem[] memory marketplaceItems = new MarketplaceItem[](totalItemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            /* Checking if Sender is Seller of NFT */
            if (idToMarketplaceItem[i + 1].seller == payable(msg.sender)) {
                uint256 currentId = idToMarketplaceItem[i + 1].itemId;
                MarketplaceItem storage currentMarketplaceItem = idToMarketplaceItem[currentId];
                marketplaceItems[currentIndex] = currentMarketplaceItem;
                currentIndex++;
            }
        }
        return marketplaceItems;
    }
}
