import {ethers} from "ethers";
import {useEffect, useState} from "react";
import axios from "axios";
/* Using to connect to a Wallet */
import Web3Modal from "web3modal";
/* Using to interact with IPFS */
import {create} from "ipfs-http-client";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function MyAssets() {
    const [nfts, setNfts] = useState([]);
    const [soldNFTs, setSoldNFTs] = useState([]);
    const [loadingState, setLoadingState] = useState(true);


    useEffect(() => {
        loadNFTs().then(response => {
            console.log(response);
        });
    }, []);

    const loadNFTs = async () => {
        /* Web3Modal is looking for the Ethereum Instance which is injected into the Browser */
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        /* Using Web3Provider because Information about User are necessary */
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        /* Creating a Reference for Smart Contract */
        const nftContract = new ethers.Contract(process.env.nftAddress, NFT.abi, provider);
        /* Signer is needed instead of Provider because it is needed to know who send the Transaction */
        const nftMarketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, NFTMarketplace.abi, signer);

        /* Fetching all Marketplace Items */
        const marketplaceItems = await nftMarketplaceContract.fetchMyMarketplaceItems();
        /* Asynchronous Mapping over all Marketplace Items */
        const items = await Promise.all(marketplaceItems.map(async marketplaceItem => {
            const tokenUri = await nftContract.tokenURI(marketplaceItem.tokenId);
            /* Fetching the Asset behind the URI, for Example: https://ipfs.io/.. */
            const asset = await axios.get(tokenUri);
            let price = ethers.utils.formatUnits(marketplaceItem.price.toString(), "ether");
            let item = {
                tokenId: marketplaceItem.tokenId.toNumber(),
                seller: marketplaceItem.seller,
                owner: marketplaceItem.owner,
                image: asset.data.image,
                price: price
            }
            return item;
        }));
        setNfts(items);
        /* Filtering all sold Marketplace Items */
        const soldItems = items.filter(MarketplaceItem => MarketplaceItem.isSold);
        setSoldNFTs(soldItems);
        setLoadingState(false);
    }

    if (loadingState === false && !nfts.length) {
        return (
            <h1 className="px-20 py-10 text-3xl">No Assets owned</h1>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="p-4 max-w-screen-2xl">
                <h2 className="text-2xl py-2">Assets created</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {nfts.map((nft, key) => (
                        <div key={key} className="border shadow rounded-xl overflow-x-hidden">
                            <img src={nft.image} className="rounded" height="350" width="350"/>
                            <div className="p-4 bg-black">
                                <p className="text-2xl font-bold h-8">Price - {nft.price} ETH</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 max-w-screen-2xl">
                <h2 className="text-2xl py-2">Assets have been sold</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        Boolean(soldNFTs.length) && soldNFTs.map((soldNFT, key) => (
                            <div key={key} className="border shadow rounded-xl overflow-x-hidden">
                                <img src={soldNFT.image} className="rounded" height="350" width="350"/>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl font-bold h-8">Price - {soldNFT.price} ETH</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}