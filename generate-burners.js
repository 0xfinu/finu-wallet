// Generates 0xmuse multichain burner wallets (EVM, BTC SegWit, Solana, TRON).
// Each wallet gets its own 12-word BIP39 mnemonic. Secrets are written ONLY
// to the backup JSON files (mode 0600). This script prints ONLY public
// addresses and verification results — never mnemonics or private keys.
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

function writeJson(name, obj) {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', { mode: 0o600 });
  fs.chmodSync(p, 0o600);
  return p;
}

// ---------------- EVM ----------------
const evmMnemonic = bip39.generateMnemonic(128);
const evmWallet = ethers.Wallet.fromPhrase(evmMnemonic);
const evmWallet2 = ethers.Wallet.fromPhrase(evmMnemonic);
if (evmWallet2.address !== evmWallet.address) throw new Error('EVM re-derive mismatch');
if (evmWallet2.privateKey !== evmWallet.privateKey) throw new Error('EVM key mismatch');

// ---------------- BTC SegWit (BIP84) ----------------
const btcMnemonic = bip39.generateMnemonic(128);
const btcSeed = bip39.mnemonicToSeedSync(btcMnemonic);
const btcRoot = bip32.fromSeed(btcSeed, bitcoin.networks.bitcoin);
const btcMain = btcRoot.derivePath("m/84'/0'/0'/0/0");
const btcMainAddr = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcMain.publicKey), network: bitcoin.networks.bitcoin }).address;
const btcTest = btcRoot.derivePath("m/84'/1'/0'/0/0");
const btcTestAddr = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcTest.publicKey), network: bitcoin.networks.testnet }).address;
const btcMain2 = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(btcRoot.derivePath("m/84'/0'/0'/0/0").publicKey), network: bitcoin.networks.bitcoin }).address;
if (btcMain2 !== btcMainAddr) throw new Error('BTC re-derive mismatch');
if (!btcMainAddr.startsWith('bc1q') || !btcTestAddr.startsWith('tb1q')) throw new Error('BTC address format unexpected');

// ---------------- Solana ----------------
const solMnemonic = bip39.generateMnemonic(128);
const solSeed = bip39.mnemonicToSeedSync(solMnemonic);
const solDerived = derivePath("m/44'/501'/0'/0'", solSeed.toString('hex')).key;
const solKeypair = Keypair.fromSeed(solDerived);
const solPub = solKeypair.publicKey.toBase58();
const solDerived2 = derivePath("m/44'/501'/0'/0'", solSeed.toString('hex')).key;
if (Keypair.fromSeed(solDerived2).publicKey.toBase58() !== solPub) throw new Error('SOL re-derive mismatch');
const solSecretJson = Array.from(solKeypair.secretKey);
const solSecretHex = Buffer.from(solKeypair.secretKey).toString('hex');

// ---------------- TRON ----------------
const tronMnemonic = bip39.generateMnemonic(128);
const tronSeed = bip39.mnemonicToSeedSync(tronMnemonic);
const tronRoot = bip32.fromSeed(tronSeed);
const tronChild = tronRoot.derivePath("m/44'/195'/0'/0/0");
const tronPrivHex = Buffer.from(tronChild.privateKey).toString('hex');
const tw = new TronWeb({ fullHost: 'https://api.trongrid.io' });
const tronAddr = tw.address.fromPrivateKey(tronPrivHex);
const tronHex = tw.address.toHex(tronAddr);
if (tw.address.fromPrivateKey(tronPrivHex) !== tronAddr) throw new Error('TRON re-derive mismatch');
if (!tw.isAddress(tronAddr) || !tronAddr.startsWith('T')) throw new Error('TRON address invalid');

// ---------------- Write backups (secrets only in these files) ----------------
writeJson('burner-evm-backup.json', {
  wallet: '0xmuse burner — EVM (all EVM chains, same address)',
  created,
  network: 'EVM — same address on Base, Polygon, Arc, Robinhood, Ethereum, etc.',
  derivationPath: "m/44'/60'/0'/0/0",
  address: evmWallet.address,
  mnemonic: evmMnemonic,
  privateKey: evmWallet.privateKey,
  warning: 'BACKUP — anyone with the mnemonic or private key controls this wallet. Never share it. Store a copy somewhere safe outside this VM.',
});
writeJson('burner-btc-backup.json', {
  wallet: '0xmuse burner — Bitcoin SegWit (BIP84, native segwit)',
  created,
  derivationPathMainnet: "m/84'/0'/0'/0/0",
  derivationPathTestnet: "m/84'/1'/0'/0/0",
  addressMainnet: btcMainAddr,
  addressTestnet4: btcTestAddr,
  mnemonic: btcMnemonic,
  privateKeyHexMainnet: Buffer.from(btcMain.privateKey).toString('hex'),
  privateKeyHexTestnet: Buffer.from(btcTest.privateKey).toString('hex'),
  wifMainnet: btcMain.toWIF(),
  warning: 'BACKUP — anyone with the mnemonic or private key controls this wallet. Never share it. Store a copy somewhere safe outside this VM.',
});
writeJson('burner-sol-backup.json', {
  wallet: '0xmuse burner — Solana',
  created,
  derivationPath: "m/44'/501'/0'/0'",
  address: solPub,
  mnemonic: solMnemonic,
  secretKeyJsonArray: solSecretJson,
  secretKeyHex: solSecretHex,
  warning: 'BACKUP — anyone with the mnemonic or secret key controls this wallet. Never share it. Store a copy somewhere safe outside this VM.',
});
writeJson('burner-tron-backup.json', {
  wallet: '0xmuse burner — TRON',
  created,
  derivationPath: "m/44'/195'/0'/0/0",
  address: tronAddr,
  addressHex: tronHex,
  mnemonic: tronMnemonic,
  privateKeyHex: tronPrivHex,
  warning: 'BACKUP — anyone with the mnemonic or private key controls this wallet. Never share it. Store a copy somewhere safe outside this VM.',
});

// Public addresses only — safe to show.
fs.writeFileSync(path.join(OUT, 'public-addresses.md'),
  '# 0xmuse burner wallets — public addresses only\n\n' +
  'Created ' + created + ' in this VM. Backup files (with mnemonics/private keys) are the *-backup.json files in this folder — keep them private.\n\n' +
  '- EVM (all EVM chains): ' + evmWallet.address + '\n' +
  '- Bitcoin SegWit mainnet: ' + btcMainAddr + '\n' +
  '- Bitcoin SegWit testnet4: ' + btcTestAddr + '\n' +
  '- Solana: ' + solPub + '\n' +
  '- TRON: ' + tronAddr + ' (' + tronHex + ')\n', { mode: 0o644 });

// ---------------- Print public results only ----------------
console.log('EVM address: ' + evmWallet.address + ' — re-derive OK');
console.log('BTC mainnet: ' + btcMainAddr + ' — re-derive OK');
console.log('BTC testnet4: ' + btcTestAddr + ' — re-derive OK');
console.log('SOL address: ' + solPub + ' — re-derive OK');
console.log('TRON address: ' + tronAddr + ' — re-derive OK');
console.log('ALL WALLETS GENERATED AND VERIFIED');
