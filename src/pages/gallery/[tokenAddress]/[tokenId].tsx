import * as React from 'react';
import {Grid, Cell, BEHAVIOR} from 'baseui/layout-grid';
import {SizeMeProps, withSize} from 'react-sizeme';
import * as Web3 from 'web3';
import { ethers } from "ethers";
import {OpenSeaPort, orderFromJSON} from 'opensea-js';
import {OpenSeaAsset, OrderSide, Order} from 'opensea-js/lib/types';
import Page from '../../../containers/page';
import {H1, HeadingXLarge, ParagraphLarge} from 'baseui/typography';
import {ListItem, ListItemLabel} from 'baseui/list';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
} from 'baseui/modal';
import {Tag, VARIANT} from 'baseui/tag';
import {Spinner} from 'baseui/spinner';
import {useStyletron} from 'baseui';
import {Block} from 'baseui/block';
import {Button} from 'baseui/button';
import Context from '../../../context';
import dynamic from 'next/dynamic';
import {
  getPriceLabel,
  truncate,
  getOSNetwork,
  getInfuraNetwork,
} from '../../../helpers/utilities';
import {getOSAssetOrder} from '../../../helpers/openseaUtils';

const ReactViewer = dynamic(() => import('react-viewer'), {ssr: false});

const AUCTIONMOD_CONTRACT_ADDRESS = "0xA5EbDDF1F581E3B2b69BcA985B7F58c774Db8089"
import NFTMOD from '../../../utils/NFTMOD.json'
import { clearConfigCache } from 'prettier';


interface GalleryItemDetailsProps extends SizeMeProps {
  asset?: OpenSeaAsset;
  getOrder: Order;
  //fetchOrder: any;
  tokenAddress?: string;
  tokenId?: string;
}

export async function getServerSideProps({params}) {
  const {tokenAddress, tokenId} = params;
  const infuraNetwork = getInfuraNetwork();
  const provider = new Web3.default.providers.HttpProvider(infuraNetwork);

  const seaport = new OpenSeaPort(provider, {
    networkName: getOSNetwork(),
    apiKey: process.env.OPEN_SEA_API_KEY,
  });

  // original getAsset
  const assetResponse: OpenSeaAsset = await seaport.api.getAsset({
    tokenAddress,
    tokenId,
  });
  const asset = JSON.parse(JSON.stringify(assetResponse));

  /* // using OS API and parse thru orderFromJSON to get valid order obj, this is temporary as the opensea sdk is not working as expected
  let fetchOrder = await getOSAssetOrder({
    tokenAddress,
    tokenId,
    orderSide: OrderSide.Sell,
  }); */

 /*  if (!fetchOrder) fetchOrder = {} */

  return {props: {asset, tokenAddress, tokenId}};
}

function GalleryItemDetails({
  asset,
  size,
}: GalleryItemDetailsProps) {
  const [css] = useStyletron();
  const [showTransactionModal, setShowTransactionModal] = React.useState(false);
  const [creatingOrder, setCreatingOrder] = React.useState(false);
  const [dialogMessage, setDialogMessage] = React.useState(null);
  const {addressValue, providerValue, connectedValue} =
    React.useContext(Context);
  const [address] = addressValue;
  const [provider] = providerValue;
  const [connected] = connectedValue;
  const [seaport, setSeaport] = React.useState(null);
  const [showImageViewer, setShowImageViewer] = React.useState(false);
  const [bid, setBid] = React.useState("");
  const [highestBid, sethighestBid] = React.useState(null);
  const [currentAccount, setCurrentAccount] = React.useState("");

  //const sellOrder = asset.sellOrders.length > 0 ? asset.sellOrders[0] : null;
  //const buyOrder = asset.buyOrders.length > 0 ? asset.buyOrders[0] : null;

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
    } else {
        console.log("No authorized account found")
    }
}
  
  const askContractToMint = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);
        
        // This is the minting transaction.
          console.log("Your wallet will be opened to pay gas for this minting transaction.")
          let nftTxn = await connectedContract.mintTenNFTs();
  
          console.log("Currently Mining...")
          await nftTxn.wait();
          console.log(nftTxn);
          console.log(`Minted, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractToStartAuction = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);

        // This is the minting transaction.
          console.log("Your wallet will be opened to pay gas for this minting transaction.")
          let nftTxn = await connectedContract.startAuction(9);
  
          console.log("Starting auction...")
          await nftTxn.wait();
          console.log(nftTxn);
          console.log(`Minted, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractToSubmitBid = async (bid) => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);
        
        // This is the minting transaction.
          console.log("Your wallet will be opened to pay gas for this transaction.")
          let nftTxn = await connectedContract.submitBid(9, { value: ethers.utils.parseEther(bid) });
  
          console.log("Registering bid...")
          setShowTransactionModal(true)
          setDialogMessage("Registering bid...")
          await nftTxn.wait();
          setShowTransactionModal(false)
          console.log(nftTxn);
          setShowTransactionModal(true)
          setDialogMessage(`You submited a Bid for ${bid} Eth, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)
          console.log(`Bid submited, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
          sethighestBid(bid)
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractwithdrawFromAuction = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);
        
        // This is the minting transaction.
          setShowTransactionModal(true)
          console.log("Your wallet will be opened to pay gas for this transaction.")
          setDialogMessage("Withdrawing from auction...")
          let nftTxn = await connectedContract.withdrawFromAuction(9);
          console.log("Sending NFT...")
          setDialogMessage("Sending NFT...")
          await nftTxn.wait();
          console.log(nftTxn);
          console.log(`Sent, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
          setDialogMessage(`Sent, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`)
      
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractTokensOfOwner = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);
        
        // This is the minting transaction.
          console.log("Your wallet will be opened to pay gas for this transaction.")
          let nftTxn = await connectedContract.tokensOfOwner();
  
          console.log("Getting owner tokens information...")
          await nftTxn.wait();
          console.log(nftTxn);
          console.log(`Retrieved, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const askContractToWithdraw = async () => {
    try {
      const { ethereum } = window;
  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(AUCTIONMOD_CONTRACT_ADDRESS, NFTMOD.abi, signer);
        
        // This is the minting transaction.
          console.log("Your wallet will be opened to pay gas for this transaction.")
          let nftTxn = await connectedContract.withdraw();
  
          console.log("Withdrawing...")
          await nftTxn.wait();
          console.log(nftTxn);
          console.log(`Withdrawn, the transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      
        } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }
  

  const submitBid = (e) => {
    e.preventDefault();
    let stringBid = bid.toString();
    askContractToSubmitBid(stringBid);
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
    console.log(address)
  }, [])

  React.useEffect(() => {
    if (provider != null) {
      console.log('SEAPORT NOT NULL');
      console.log({provider});
      setSeaport(
        new OpenSeaPort(provider, {
          networkName: getOSNetwork(),
          apiKey: process.env.OPEN_SEA_API,
        }),
      );
    } else {
      console.log('SEAPORT NULL');
      setSeaport(null);
    }
  }, [provider]);

  const initiatePurchase = () => {
    const buyAsset = async () => {
      if (asset.owner.address != address) {
        try {
          setCreatingOrder(true);
          setShowTransactionModal(true);

          //const parsedFetchOrder = orderFromJSON(fetchOrder);

          await seaport.fulfillOrder({
            //order: parsedFetchOrder, // change the order here to see diff results
            accountAddress: address,
          });
          setDialogMessage('Order was a success!');
        } catch (error) {
          console.log(error);
          setDialogMessage(error.message);
        } finally {
          setCreatingOrder(false);
        }
      }
    };
    buyAsset();
  };

  return (
    <div>
      <Page pageRoute="gallery">
        <ReactViewer
          visible={showImageViewer}
          onClose={() => {
            setShowImageViewer(false);
          }}
          images={[{src: asset.imageUrl.replace('s250', 's600')}]}
          noToolbar={true}
          noNavbar={true}
        />
        <Modal isOpen={showTransactionModal} closeable={false}>
          <ModalHeader>Creating Order</ModalHeader>
          <ModalBody>
            {creatingOrder && <Spinner />}
            {dialogMessage && `${dialogMessage}`}
          </ModalBody>
          {!creatingOrder && (
            <ModalFooter>
              <ModalButton
                onClick={() => {
                  setShowTransactionModal(false);
                  setDialogMessage(null);
                }}
              >
                Close
              </ModalButton>
            </ModalFooter>
          )}
        </Modal>
        <Grid
          behavior={BEHAVIOR.fixed}
          gridMargins={0}
          gridGutters={100}
          gridColumns={[6, 6, 12, 12]}
        >
          <Cell
            span={6}
            overrides={{
              Cell: {
                style: (_) => ({
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  'padding-left': '0px !important',
                  'padding-right': '0px !important',
                }),
              },
            }}
          >
            <img
              onClick={() => {
                setShowImageViewer(true);
              }}
              style={{maxHeight: '90vh', width: '100%', objectFit: 'contain'}}
              src={asset.imageUrl.replace('s250', 's600')}
            />
          </Cell>
          <Cell span={6}>
            <HeadingXLarge
              overrides={{
                Block: {
                  props: {$marginTop: ['scale800', 'scale800', 'scale800', 0]},
                },
              }}
            >
              <Block></Block>
              {asset.name}
            </HeadingXLarge>
            <ParagraphLarge>{asset.description}</ParagraphLarge>
            <ul
              className={css({
                paddingLeft: 0,
                paddingRight: 0,
              })}
            >
              <ListItem
                overrides={{Content: {style: {paddingLeft: 0, marginLeft: 0}}}}
              >
                <ListItemLabel description="Collection">
                  {asset.collection.name}
                </ListItemLabel>
              </ListItem>

              {asset.lastSale && (
                <ListItem
                  overrides={{
                    Content: {style: {paddingLeft: 0, marginLeft: 0}},
                  }}
                >
                  <ListItemLabel description="Last Buyer">
                    {asset.lastSale.transaction.fromAccount.user
                      ? asset.lastSale.transaction.fromAccount.user.username
                      : truncate(
                          asset.lastSale.transaction.fromAccount.address,
                          20,
                        )}
                  </ListItemLabel>
                </ListItem>
                 
              )}

               {/*  <ListItem
                  overrides={{
                    Content: {style: {paddingLeft: 0, marginLeft: 0}},
                  }}
                >
                  <ListItemLabel description="Price">
                    {getPriceLabel(asset.sellOrders[0])}
                  </ListItemLabel>
                </ListItem> */}
              
              
              {connected ? (
                <>
                {address == "0xE332D0F29eCBf2E90bAb8D227a8D8571C6f819F1" ? 
                (  
                  <>
                    <Button onClick={askContractToStartAuction}>Start Auction</Button>
                  </>
                ) : 
                (
                  <>
                    <Button onClick={askContractwithdrawFromAuction}>Withdraw NFT</Button>
                    <ListItem
                overrides={{
                  Content: {style: {paddingLeft: 0, marginLeft: 0}},
                }}>
                  <ListItemLabel description={highestBid}>
                 Current Highest Bid
                  </ListItemLabel>
                    </ListItem>
                    <ListItem>           
                  <form onSubmit={submitBid}>
                    <label>
                      <input
                      style={{width: '50%', marginRight: '10px', fontSize: '1.5rem'}}
                        type="text"
                        value={bid}
                        onChange={e => setBid(e.target.value)}
                      />
                    </label>
                    <Button type="submit" >Submit Bid</Button>
                  </form>
                    </ListItem>
                  </>
                )
                }
                </>
              ) : <h1 style={{color:"white", fontFamily: "Helvetica Neue", fontSize: "23px"}}>Connect your wallet above to bid on this item.</h1>}
              
            </ul>

            {(() => {
              if (connected && asset.lastSale) {
                if (
                  asset.lastSale.transaction.fromAccount.address.toLowerCase() ===
                    address.toLowerCase() /* ||
                  (sellOrder &&
                    sellOrder.makerAccount.address.toLowerCase() ===
                      address.toLowerCase()) */
                ) {
                  return (
                    <Tag
                      closeable={false}
                      variant={VARIANT.outlined}
                      kind="positive"
                    >
                      You own this item
                    </Tag>
                  );
                }
              }
            })}

            {(() => {
              /* if (sellOrder) { */
                if (connected) {
                  if (
                    (asset.lastSale &&
                      asset.lastSale.transaction.fromAccount.address ===
                        address.toLowerCase()) /* ||
                    sellOrder.makerAccount === address */
                  ) {
                    return <div />;
                  } else {
                    return (
                      <Button
                        disabled={asset.owner.address == address}
                        onClick={() => {
                          //initiatePurchase(sellOrder);
                        }}>
                       {/*  {`Buy for ${getPriceLabel(sellOrder)}`} */}
                        </Button>
                    );
                  }
                } else {
                  return <Button kind="secondary">Connect Wallet</Button>;
                }
              })
            }
          </Cell>
        </Grid>
      </Page>
    </div>
  );
}
export default withSize()(GalleryItemDetails);
