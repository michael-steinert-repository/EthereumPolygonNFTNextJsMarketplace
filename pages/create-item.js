import {ethers} from "ethers";
import {useState} from "react";
import {useRouter} from "next/router";
/* Using to connect to a Wallet */
import Web3Modal from "web3modal";
/* Using to interact with IPFS */
import {create} from "ipfs-http-client";

import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarketplace from "../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

const ipfsClient = create("https://ipfs.infura.io:5001/api/v0");

export default function CreateItem() {
    const [fileUrl, setFileUrl] = useState("");
    const [formInput, setFormInput] = useState({
        price: "",
        name: "",
        description: ""
    });
    const router = useRouter();

    const onChange = async (event) => {
        const file = event.target.files[0];
        try {
            const response = await ipfsClient.add(file, {
                progress: (progress) => console.log(`Received of File: ${progress}`)
            });
            const fileUrl = `https://ipfs.infura.io/ipfs/${response.path}`;
            setFileUrl(fileUrl);
        } catch (error) {
            console.error(error);
        }
    }

    const createItem = async () => {
        const {name, description, price} = formInput;
        if (!name || !description || !price) {
            return;
        }
        /* Creating a JSON Object */
        const jsonData = JSON.stringify({
            name: name,
            description: description,
            image: fileUrl
        });
        try {
            const response = await ipfsClient.add(jsonData, {
                progress: (progress) => console.log(`Received of File: ${progress}`)
            });
            const fileUrl = `https://ipfs.infura.io/ipfs/${response.path}`;
            await createSale(fileUrl);
        } catch (error) {
            console.error(error);
        }
    }

    const createSale = async (fileUrl) => {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const nftContract = new ethers.Contract(process.env.nftAddress, NFT.abi, signer);
        let nftTransaction = await nftContract.createToken(fileUrl);
        nftTransaction = await nftTransaction.wait();
        /* Getting Result of Event of the Transaction */
        let event = nftTransaction.events[0];
        let tokenId = event.args[2].toNumber();

        const price = ethers.utils.parseUnits(formInput.price, "ether");

        const nftMarketplaceContract = new ethers.Contract(process.env.nftMarketplaceAddress, NFTMarketplace.abi, signer);
        let listingPrice = await nftMarketplaceContract.getListingPrice();
        listingPrice = listingPrice.toString();
        let nftMarketplaceTransaction = await nftMarketplaceContract.createMarketplaceItem(process.env.nftAddress, tokenId, price, {
            value: listingPrice
        });
        await nftMarketplaceTransaction.wait();
        /* Routing to Home Page */
        await router.push("/");
    }

    return (
        <div className="flex justify-center">
            <div className="w-1/2 flex flex-col pb-12">
                <input
                    placeholder="Name of Asset"
                    className="mt-8 border rounded p-4"
                    onChange={(event) => setFormInput({...formInput, name: event.target.value})}
                />
                <textarea
                    placeholder="Description of Asset"
                    className="mt-2 border rounded p-4"
                    onChange={(event) => setFormInput({...formInput, description: event.target.value})}
                />
                <input
                    placeholder="Price of Asset in MATIC"
                    className="mt-2 border rounded p-4"
                    onChange={(event) => setFormInput({...formInput, price: event.target.value})}
                />
                <input type="file" name="Asset" className="my-4" onChange={(event => onChange(event))}/>
                {
                    fileUrl && (
                        <img className="rounded mt-4" src={fileUrl} width="350" height="350"/>
                    )
                }
                <button
                    className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg"
                    onClick={(event) => createItem()}>
                    Create Asset
                </button>
            </div>
        </div>
    );
}