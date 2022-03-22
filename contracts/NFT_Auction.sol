// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFT_Auction is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    
    struct Auction{
        uint startTime;
        uint endTime;
        uint highestBid;
        address highestBidder; 
        uint tokenID; 
    }
    
    event AuctionCreated(
        uint indexed auctionID,
        uint indexed tokenID,
        uint startTime,
        uint endTime 
    );

     event AuctionEnded(
        uint indexed auctionID,
        uint indexed tokenID
    );

    event BidSubmitted(
        uint indexed auctionID,
        uint indexed tokenID,
        uint bidAmount,
        address bidder
    );

    event BidTokenClaimed(
        uint indexed auctionID,
        uint indexed tokenID,
        address highestBidder
    );

    event BidAmountWithdrawn(
        uint indexed auctionID,
        uint amount,
        address bidder
    );

    event NFTsWereMinted();

    mapping(uint=>Auction) public auctions;
    //auctionID=>bidderAddress=>bidAmount
    mapping(uint=>mapping(address=>uint)) biddings;
    //tokenID=>auctionID
    mapping(uint=>uint) currentTokenAuctionMapping;


    // Set to true when 10 NFTs are minted
    bool NFTsMinted = false;

    Counters.Counter private _auctionIDs;
    Counters.Counter private _tokenIds;
    string public baseTokenURI;

    constructor(string memory baseURI) ERC721("MyNFTs", "NFT") {
        setBaseURI(baseURI);
    }

    function startAuction(uint tokenID) public onlyOwner() returns(uint) {
        uint prevAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[prevAuctionID].endTime<block.timestamp,"Auction of this NFT was already started");
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];
        require(NFTsMinted == true, "NFTs shoud be minted first.");
        auctions[currentAuctionID].startTime=block.timestamp;
        auctions[currentAuctionID].endTime=block.timestamp + 10 minutes;
        auctions[currentAuctionID].tokenID=tokenID;
        currentTokenAuctionMapping[tokenID]=currentAuctionID;
        emit AuctionCreated(
            currentAuctionID,
            tokenID,
            auctions[currentAuctionID].startTime,
            auctions[currentAuctionID].endTime    
        );
        _auctionIDs.increment();
        return currentAuctionID;
    }

    function submitBid(uint tokenID) payable public{
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[currentAuctionID].tokenID==tokenID,"Invalid Token ID");
        require(auctions[currentAuctionID].endTime>block.timestamp,"Auction for the token has ended");
        uint currentBid = msg.value;
        uint previousBid= biddings[currentAuctionID][msg.sender];
        require(
            auctions[tokenID].highestBid<currentBid
            ,"Bid Amount should be higher than the highest Bid");
             if(previousBid>0){payable(msg.sender).transfer(previousBid);}
        biddings[currentAuctionID][msg.sender]=currentBid;
        auctions[currentAuctionID].highestBid=currentBid;
        auctions[currentAuctionID].highestBidder=msg.sender;


        emit BidSubmitted(
            currentAuctionID,
            tokenID,
            currentBid,
            msg.sender
        );     
    }

    function mintNFTs(uint _count) public payable {
        for (uint i = 0; i < _count; i++) {
            _mintSingleNFT();
        }
    }

    function _mintSingleNFT() private {
        uint newTokenID = _tokenIds.current();
        _safeMint(msg.sender, newTokenID);
        _tokenIds.increment();
    }

    function mintTenNFTs() public onlyOwner {

        for (uint i = 0; i < 10; i++) {
            _mintSingleNFT();
        }

        NFTsMinted = true;

        emit NFTsWereMinted();

    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

 

    function getHighestBid(uint tokenID) public view returns (uint highestBid) {
          uint currentAuctionID=currentTokenAuctionMapping[tokenID];
          return auctions[currentAuctionID].highestBid;
    }

    function getHighestBidder(uint tokenID) public view returns (address highestBidder) {
          uint currentAuctionID=currentTokenAuctionMapping[tokenID];
          return auctions[currentAuctionID].highestBidder;
    }

    function withdrawNFT(uint tokenID) public{
       
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[currentAuctionID].endTime<block.timestamp,"Auction is still ongoing");

        if(auctions[currentAuctionID].highestBidder==msg.sender){
            _transfer(owner(), msg.sender, auctions[currentAuctionID].tokenID);
            emit BidTokenClaimed(
                currentAuctionID,
                auctions[currentAuctionID].tokenID,
                msg.sender
            );
        }
    }

    function withdrawLastBid(uint tokenID) public{
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[currentAuctionID].endTime<block.timestamp,"Auction is still ongoing");
        require(auctions[currentAuctionID].highestBidder!=msg.sender, "You won the auction and cannot take your bid back!");
        uint previousBid= biddings[currentAuctionID][msg.sender];
        biddings[currentAuctionID][msg.sender] = 0;
        if(previousBid>0){payable(msg.sender).transfer(previousBid);}
    }

    function tokensOfOwner(address _owner) external view returns (uint[] memory) {

        uint tokenCount = balanceOf(_owner);
        uint[] memory tokensId = new uint256[](tokenCount);

        for (uint i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    function endAuction(uint tokenID) public payable onlyOwner {
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[currentAuctionID].endTime<block.timestamp,"Auction is still ongoing");
        require(auctions[currentAuctionID].highestBid > 0, "No bid left to withdraw");
        (bool success, ) = (msg.sender).call{value: auctions[currentAuctionID].highestBid}("");
        require(success, "Transfer failed.");
        emit AuctionEnded(currentAuctionID, tokenID);
    }

    function withdraw() public payable onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");
        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Transfer failed.");
    }

}