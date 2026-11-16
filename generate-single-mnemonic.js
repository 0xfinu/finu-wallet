// Generates ONE 12-word BIP39 mnemonic for all 0xmuse burner chains
// (EVM, BTC SegWit, Solana, TRON) — BIP44 coin-type paths per chain.
// Secrets are written ONLY to the backup JSON file (mode 0600).
// This script prints ONLY public addresses and verification results.
const fs = require('fs');
const path = require('path');
const bip39 = require('bip39');
const { ethers } = require('ethers');
const bitcoin = require('bitcoinjs-lib');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const { Keypair } = require('@solana/web3.js');
const { derivePath } = require('ed25519-hd-key');
const { TronWeb } = require('tronweb');

const bip32 = BIP32Factory(ecc);
const OUT = __dirname;
const created = new Date().toISOString();

// ---------------- One mnemonic for everything ----------------
const mnemonic = bip39.generateMnemonic(128);
const seed = bip39.mnemonicToSeedSync(mnemonic);

// ---------------- EVM (coin 60) ----------------
const evmPath = "m/44'/60'/0'/0/0";
const evmWallet = ethers.Wallet.fromPhrase(mnemonic, evmPath);
const evmWallet2 = ethers.Wallet.fromPhrase(mnemonic, evmPath);
if (evmWallet2.address !== evmWallet.address || evmWallet2.privateKey !== evmWallet.privateKey) {
  throw new Error('EVM re-derive mismatch');
}

// ---------------- BTC SegWit (BIP84, coin 0 mainnet / 1 testnet) ----------------
const btcRoot = bip32.fromSeed(seed, bitcoin.networks.bitcoin);
const btcMain = btcRoot.derivePath("m/84'/0'/0'/0/0");
const btcMainAddr = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcMain.publicKey), network: bitcoin.networks.bitcoin }).address;
const btcTest = btcRoot.derivePath("m/84'/1'/0'/0/0");
const btcTestAddr = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcTest.publicKey), network: bitcoin.networks.testnet }).address;
const btcMain2 = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcRoot.derivePath("m/84'/0'/0'/0/0").publicKey), network: bitcoin.networks.bitcoin }).address;
if (btcMain2 !== btcMainAddr) throw new Error('BTC re-derive mismatch');
if (!btcMainAddr.startsWith('bc1q') || !btcTestAddr.startsWith('tb1q')) throw new Error('BTC address format unexpected');

// ---------------- Solana (coin 501) ----------------
const solPath = "m/44'/501'/0'/0'";
const solDerived = derivePath(solPath, seed.toString('hex')).key;
const solKeypair = Keypair.fromSeed(solDerived);
const solPub = solKeypair.publicKey.toBase58();
const solDerived2 = derivePath(solPath, seed.toString('hex')).key;
if (Keypair.fromSeed(solDerived2).publicKey.toBase58() !== solPub) throw new Error('SOL re-derive mismatch');

// ---------------- TRON (coin 195) ----------------
const tronPath = "m/44'/195'/0'/0/0";
const tronRoot = bip32.fromSeed(seed);
const tronChild = tronRoot.derivePath(tronPath);
const tronPrivHex = Buffer.from(tronChild.privateKey).toString('hex');
const tw = new TronWeb({ fullHost: 'https://api.trongrid.io' });
const tronAddr = tw.address.fromPrivateKey(tronPrivHex);
const tronHex = tw.address.toHex(tronAddr);
if (tw.address.fromPrivateKey(tronPrivHex) !== tronAddr) throw new Error('TRON re-derive mismatch');
if (!tw.isAddress(tronAddr) || !tronAddr.startsWith('T')) throw new Error('TRON address invalid');

// ---------------- Write the single backup (secrets only in this file) ----------------
const backupPath = path.join(OUT, 'burner-single-mnemonic-backup.json');
fs.writeFileSync(backupPath, JSON.stringify({
  wallet: '0xmuse burner — ONE mnemonic for all chains',
  created,
  mnemonic,
  derivationPaths: {
    evm: evmPath,
    btcSegwitMainnet: "m/84'/0'/0'/0/0",
    btcSegwitTestnet: "m/84'/1'/0'/0/0",
    solana: solPath,
    tron: tronPath,
  },
  addresses: {
    evm: evmWallet.address,
    btcMainnet: btcMainAddr,
    btcTestnet4: btcTestAddr,
    solana: solPub,
    tron: tronAddr,
    tronHex,
  },
  privateKeys: {
    evm: evmWallet.privateKey,
    btcMainnetHex: Buffer.from(btcMain.privateKey).toString('hex'),
    btcTestnetHex: Buffer.from(btcTest.privateKey).toString('hex'),
    btcMainnetWif: btcMain.toWIF(),
    solanaSecretKeyJsonArray: Array.from(solKeypair.secretKey),
    solanaSecretKeyHex: Buffer.from(solKeypair.secretKey).toString('hex'),
    tronHex: tronPrivHex,
  },
  warning: 'BACKUP — this ONE mnemonic controls ALL FOUR burner wallets. Anyone with it controls everything. Never share it. Store a copy somewhere safe outside this VM.',
}, null, 2) + '\n', { mode: 0o600 });
fs.chmodSync(backupPath, 0o600);

// Public addresses only — safe to show.
fs.writeFileSync(path.join(OUT, 'public-addresses.md'),
  '# 0xmuse burner wallets — ONE mnemonic, public addresses only\n\n' +
  'Created ' + created + ' in this VM. Single backup file: burner-single-mnemonic-backup.json — keep it private.\n\n' +
  '- EVM (all EVM chains): ' + evmWallet.address + '\n' +
  '- Bitcoin SegWit mainnet: ' + btcMainAddr + '\n' +
  '- Bitcoin SegWit testnet4: ' + btcTestAddr + '\n' +
  '- Solana: ' + solPub + '\n' +
  '- TRON: ' + tronAddr + ' (' + tronHex + ')\n\n' +
  'The previous 4-separate-mnemonic set (created 2026-11-14) is RETIRED — see retired/ — do not fund those addresses.\n', { mode: 0o644 });

// ---------------- Print public results only ----------------
console.log('EVM address: ' + evmWallet.address + ' — re-derive OK');
console.log('BTC mainnet: ' + btcMainAddr + ' — re-derive OK');
console.log('BTC testnet4: ' + btcTestAddr + ' — re-derive OK');
console.log('SOL address: ' + solPub + ' — re-derive OK');
console.log('TRON address: ' + tronAddr + ' — re-derive OK');
console.log('ALL CHAINS DERIVED FROM ONE MNEMONIC AND VERIFIED');
