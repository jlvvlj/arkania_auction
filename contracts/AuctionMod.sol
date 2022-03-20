// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTMOD is ERC721Enumerable, Ownable {
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

    mapping(uint=>Auction) public auctions;
    //auctionID=>bidderAddress=>bidAmount
    mapping(uint=>mapping(address=>uint)) biddings;
    //tokenID=>auctionID
    mapping(uint=>uint) currentTokenAuctionMapping;

    Counters.Counter private _auctionIDs;
    Counters.Counter private _tokenIds;
    string public baseTokenURI;

    constructor(string memory baseURI) ERC721("MyNFTs", "NFT") {
        setBaseURI(baseURI);
    }

    function startAuction(uint tokenID) public onlyOwner() returns(uint) {
        uint prevAuctionID=currentTokenAuctionMapping[tokenID];
        require(auctions[prevAuctionID].endTime<block.timestamp,"Auction of the same NFT is ongoing");
        uint currentAuctionID=_auctionIDs.current();
        auctions[currentAuctionID].startTime=block.timestamp;
        auctions[currentAuctionID].endTime=block.timestamp+1 minutes;
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
        uint bidAmount=msg.value.add(biddings[currentAuctionID][msg.sender]);
           
        require(
            auctions[tokenID].highestBid<bidAmount
            ,"Bid Amount should be higher than the highest Bid");
             if(biddings[currentAuctionID][msg.sender]>0)
            {
                uint amount = biddings[currentAuctionID][msg.sender];
                payable(msg.sender).transfer(amount);
            }
        biddings[currentAuctionID][msg.sender]=bidAmount;
        auctions[currentAuctionID].highestBid=bidAmount;
        auctions[currentAuctionID].highestBidder=msg.sender;


        emit BidSubmitted(
            currentAuctionID,
            tokenID,
            bidAmount,
            msg.sender
        );     
    }

    function withdrawFromAuction(uint tokenID) public{
        //require(auctions[auctionID].endTime<block.timestamp,"Auction is still ongoing");
        uint currentAuctionID=currentTokenAuctionMapping[tokenID];

        if(auctions[currentAuctionID].highestBidder==msg.sender){
            _transfer(owner(), msg.sender, auctions[currentAuctionID].tokenID);
            emit BidTokenClaimed(
                currentAuctionID,
                auctions[currentAuctionID].tokenID,
                msg.sender
            );
        }
    }

    function mintTenNFTs() public onlyOwner {

        for (uint i = 0; i < 10; i++) {
            _mintSingleNFT();
        }
    }
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
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

    function tokensOfOwner(address _owner) external view returns (uint[] memory) {

        uint tokenCount = balanceOf(_owner);
        uint[] memory tokensId = new uint256[](tokenCount);

        for (uint i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    function withdraw() public payable onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");
        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Transfer failed.");
    }

}