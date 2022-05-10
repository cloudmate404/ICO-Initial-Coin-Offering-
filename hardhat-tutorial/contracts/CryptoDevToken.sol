  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.10;

  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./ICryptoDevs.sol";

  contract CryptoDevToken is ERC20, Ownable{
    // Price of one Crypto Dev token
    uint public constant tokenPrice = 0.001 ether;

    // CryptoDevsNFT contract instance
    ICryptoDevs CryptoDevsNFT;

    // Each NFT would give the user 10 tokens
    // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
    // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
    // is actually equal to (10 ^ -18) tokens.
    // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
    uint public constant tokensPerNFT = 10 * 10**18;
    // the max total supply is 10000 for Crypto Dev Tokens
    uint public constant maxTotalSupply = 10000 * 10**18;

    // Mapping to keep track of which tokenIds have been claimed
    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevContractAddress) ERC20("Crypto Dev Token", "CDT") {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevContractAddress);

    }

    /**
    * @dev Mints `amount` number of CryptoDevTokens
    * Requirements:
    * - `msg.value` should be equal or greater than the tokenPrice * amount
    */
    function mint(uint amount) public payable{
        uint _requiredAmount = tokenPrice * amount;
        require(msg.value >= _requiredAmount, "ETH sent is inadequate");

        uint256 amountWithDecimals = amount * 10**18;
        require(totalSupply() + amountWithDecimals <= maxTotalSupply, "Exceeds the max total supply available");

        // Mint the tokens
        _mint(msg.sender, amountWithDecimals);
    }


    /**
    * @dev Mints tokens based on the number of NFT's held by the sender
    * Requirements:
    * balance of Crypto Dev NFT's owned by the sender should be greater than 0
    * Tokens should have not been claimed for all the NFTs owned by the sender
    */
    function claim() public{
        address sender = msg.sender;
        // Get the number of CryptoDev NFT's held by a given sender address
        uint balance = CryptoDevsNFT.balanceOf(sender);
        // If the balance is zero, revert the transaction
        require(balance > 0, "You don't own any crypto dev NFTs");
        // amount keeps track of number of unclaimed tokenIds
        uint amount = 0;

        for(uint i = 0; i < balance; i++){
            uint tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            if(!tokenIdsClaimed[tokenId]){
                amount += 1;
                tokenIdsClaimed[tokenId] = true;

            }
        }
        // If all the token Ids have been claimed, revert the transaction;
        require(amount > 0, "You have no unclaimed crypto dev NFTs");
        _mint(msg.sender, amount * tokensPerNFT);
    }


    receive() external payable{}

    fallback() external payable{}
  }