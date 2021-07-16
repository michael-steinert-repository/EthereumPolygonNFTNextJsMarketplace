import {ethers} from "ethers";
import {useEffect, useState} from "react";
import axios from "axios";
/* Using to connect to a Wallet */
import Web3Modal from "web3modal";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export default function Home() {
    const [nfts, setNFTs] = useState([]);
    const [loadingState, setLoadingState] = useState(true);

    useEffect(() => {
        loadNFTs().then(response => {
            console.log(response);
        });
    }, []);

    const loadNFTs = async () => {
        /* Using a generic Provider because Information about User are not necessary */
        const provider = new ethers.providers.JsonRpcProvider();
        /* Creating a Reference for Smart Contract */
        const nftContract = new ethers.Contract(process.env.nftAddress, NFT.abi, provider);
        const nftMarketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, NFTMarketplace.abi, provider);
        /* Fetching all Marketplace Items */
        const marketplaceItems = await nftMarketplaceContract.fetchMarketplaceItems();
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
                name: asset.data.name,
                description: asset.data.description,
                price: price
            }
            return item;
        }));
        setNFTs(items);
        setLoadingState(false);
    }

    const buyNft = async (_nft) => {
        /* Web3Modal is looking for the Ethereum Instance which is injected into the Browser */
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        /* Using Web3Provider because Information about User are necessary */
        const provider = new ethers.providers.Web3Provider(connection);

        const signer = provider.getSigner();
        const nftMarketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, NFTMarketplace.abi, signer);

        const price = ethers.utils.parseUnits(_nft.price.toString(), "ether");

        const transaction = await nftMarketplaceContract.createMarketplaceSale(process.env.nftAddress, _nft.tokenId, {
            value: price
        });

        await transaction.wait();
        /* Loading the new NFT into the Marketplace */
        loadNFTs().then(response => {
            console.log(response);
        });
    }

    if (loadingState === false && !Boolean(nfts.length)) {
        return (
            <h1 className="px-20 py-10 text-3xl">No Assets in Marketplace</h1>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="px-4 max-w-screen-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {
                        nfts.map((nft, key) => (
                            <div key={key} className="border shadow rounded-xl overflow-x-hidden">
                                <img src={nft.image} className="rounded" height="350" width="350"/>
                                <div className="p-4">
                                    <p className="text-2xl font-bold h-8">{nft.name}</p>
                                    <div className="h-20 overflow-hidden">
                                        <p className="text-gray-400">{nft.description}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-black">
                                    <p className="text-2xl mb-4 font-bold text-white">{nft.price} MATIC(Polygon)</p>
                                    <button
                                        className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                                        onClick={() => buyNft(nft)}>
                                        Buy
                                    </button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
