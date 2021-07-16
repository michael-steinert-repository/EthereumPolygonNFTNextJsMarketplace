// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
/* Adding additional Functionality to ERC721 Standards for adding the URI to Token */
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/* ERC721URIStorage is inheriting the ERC721 */
contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;
    address marketplaceAddress;

    constructor(address _marketplaceAddress) ERC721("Marketplace Token", "MT") {
        marketplaceAddress = _marketplaceAddress;
    }

    function createToken(string memory _tokenURI) public returns (uint) {
        tokenIds.increment();
        uint256 tokenId = tokenIds.current();
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        /* Giving the Marketplace (Contract) the Approval to transfer Tokens between Users */
        setApprovalForAll(marketplaceAddress, true);
        return tokenId;
    }
}