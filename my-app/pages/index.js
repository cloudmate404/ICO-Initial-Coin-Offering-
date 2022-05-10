import Head from "next/head";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { BigNumber, utils, Contract, providers } from "ethers";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  // 1. YOU WANT USERS TO BE ABLE TO CONNECT THEIR WALLETS
  // 2. KEEPING TRACK AND DISPLAYING TOKENS MINTED
  // 3. TOKEN MINTING FUNCTIONS
  // 4. LOADING STATE
  // 5. USERS HAVING NFT SHOULD BE ABLE TO CLAIM THEIR FREE TOKENS

  //1. Function to keep track of whether walletConnected
  const [walletConnected, setWalletConnected] = useState(false);

  //4. keep track of loading
  const [loading, setLoading] = useState(false);

  //2. Create a BigNumber '0'
  const zero = BigNumber.from(0);

  // 5 tokensToBeClaimed
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);

  //2. keep track of tokens minted
  const [tokensMinted, setTokensMinted] = useState(zero);

  //2. keep track of the tokens the current user connected has
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);

  // 3. amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);

  //1. We need to persist it as long as this page is open
  const web3ModalRef = useRef();

  // 3. Function to MintTokens
  const mintCryptoDevToken = async (amount) => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      // Create an instance of tokenContract
      const signer = await getProviderOrSigner(true);

      // Create an instance of tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted cryptoDev token 🎊 ");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  };

  //5.  getTokensToBeClaimed
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();

      const NFTContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await NFTContract.balanceOf(address);
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;

        for (var i = 0; i < balance; i++) {
          const tokenId = await NFTContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  };

  //5.  function to claimCryptoDevTokens
  const claimCryptoDevTokens = async () => {
    try {
      setLoading(true);
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      await tx.wait();
      setLoading(false);
      window.alert("Successfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  };

  //3. getBalanceOfCryptoDevTokens
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      const address = signer.getAddress();
      // call the balanceOf from the token contract to get the number of tokens held by the user
      const balance = await tokenContract.balanceOf(address);
      // balance is already a big number, so we dont need to convert it before setting it
      setBalanceOfCryptoDevTokens(balance);
    } catch (error) {
      console.error(error);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      const provider = await getProviderOrSigner();

      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const _tokenMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokenMinted);
    } catch (error) {
      console.error(error);
    }
  };

  // 1. Helper function, to get provider or signer
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  // 1. function to connect wallet
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  const onPageLoad = async () => {
    connectWallet();
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();

    setInterval(() => {
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }, 2 * 1000);
  };

  useEffect(() => {
    if (!walletConnected) {
      // 1. We need to assign web3ModalRef to a web3modal instance
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      onPageLoad();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
