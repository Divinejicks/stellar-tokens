require('dotenv').config();

const StellarSdk = require("stellar-sdk");
const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org")

// Generate issuer and distribution accounts
const issuerKeypair = StellarSdk.Keypair.fromSecret(process.env.issuerSecret);
const distributionKeypair = StellarSdk.Keypair.fromSecret(process.env.distributorSecret);

// Create assets
const assetA = new StellarSdk.Asset("TokenA", issuerKeypair.publicKey());
const assetB = new StellarSdk.Asset("TokenB", issuerKeypair.publicKey());

// Step 2: Create trustline for the asset on the distribution account
async function createTrustline() {
    const account = await server.loadAccount(distributionKeypair.publicKey());
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: assetA
        })
      )
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: assetB
        })
      )
      .setTimeout(30)
      .build();
  
    transaction.sign(distributionKeypair);
  
    // Submit the transaction
    try {
      const result = await server.submitTransaction(transaction);
      console.log("Trustline created:", result);
    } catch (error) {
      console.error("Error creating trustline:", error);
    }
  }

  // Step 3: Issue assets to distribution account
async function issueAssets() {
    const account = await server.loadAccount(issuerKeypair.publicKey());
  
    // Create transaction to send some assets to the distribution account
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: distributionKeypair.publicKey(),
          asset: assetA,
          amount: "1000"  // amount of TokenA to send
        })
      )
      .addOperation(
        StellarSdk.Operation.payment({
          destination: distributionKeypair.publicKey(),
          asset: assetB,
          amount: "1000"  // amount of TokenB to send
        })
      )
      .setTimeout(30)
      .build();
  
    transaction.sign(issuerKeypair);
  
    // Submit the transaction
    try {
      const result = await server.submitTransaction(transaction);
      console.log("Assets issued:", result);
    } catch (error) {
      console.error("Error issuing assets:", error);
    }
  }

  // Execute the steps
async function deploy() {
    await createTrustline();
    await issueAssets();
  }
  
  deploy();
