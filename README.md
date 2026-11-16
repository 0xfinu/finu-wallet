# finu-wallet

![0xmuse logo](https://raw.githubusercontent.com/0xfinu/finu.muse/main/0xmuse-logo-160x160.jpg)

**finu.muse multichain burner wallets — one BIP39 mnemonic for EVM, Bitcoin SegWit, Solana and TRON. DYOR, don't trust — verify, not your keys, not your coins.**

🌐 [Live site](https://0xfinu.github.io/finu.muse/) · 💻 [finu.muse](https://github.com/0xfinu/finu.muse)

---

## What it is

A burner-wallet generator for testnet work. **One 12-word BIP39 mnemonic derives all four chains** (BIP44 paths per chain), so a single backup covers everything. The scripts print public addresses only — mnemonics and private keys go into one backup JSON file (mode `0600`) and nowhere else.

This is the wallet set behind the whole finu.muse testnet programme: the STEST token deploys, the DEX pools, the sniper runs, and the faucet claims all sign from the burner EVM address below.

## The burner set (public addresses only)

| Chain | Address |
| --- | --- |
| EVM (all EVM chains) | `0xBb87bD789Ca67562F531685e10EB78eC03dE3dEB` |
| Bitcoin SegWit mainnet | `bc1qcvhkqg530t5qhjjgcvcvs2mgsqcsn6vexn4l9x` |
| Bitcoin SegWit testnet4 | `tb1qqc2egd574c5rvqpc8jfe805mvpwhtl70705vwx` |
| Solana | `AYKM6NXM6ucPgCMnqWSdPgPe7WaCRtKJ31z7ePjjpbzt` |
| TRON | `TP1TKuV4vj6WtDUkWpDVESvEyJHMbP6aaH` |

Derivation paths: EVM `m/44'/60'/0'/0/0`, BTC `m/84'/0'/0'/0/0` (mainnet) / `m/84'/1'/0'/0/0` (testnet), Solana `m/44'/501'/0'/0'`, TRON `m/44'/195'/0'/0/0`.

**Verified:** the set was imported into Bitget Wallet on Nov 15, 2026 and confirmed correct — generation, re-derivation, network checks, and a real wallet import all pass.

## Install

```bash
npm install
```

## Usage

```bash
# Generate a NEW single-mnemonic burner set (the current one)
npm run generate
# — writes burner-single-mnemonic-backup.json (0600, secrets — never commit)
# — writes public-addresses.md (public addresses only)
# — prints the public addresses + re-derive verification
```

`generate-single-mnemonic.js` is the current generator. `generate-burners.js` is the **retired** variant that made four separate mnemonics (one per chain) — kept for reference only; its addresses were retired and deleted from the VM on Nov 15, 2026. Do not fund them.

## Safety — read this first

- **The backup file is the keys.** `burner-single-mnemonic-backup.json` holds the mnemonic and every private key. It is gitignored (`*-backup.json`) and must **never** be committed, pasted, or shared. Anyone with it controls all four wallets.
- **Burners only.** These wallets hold testnet value (plus the BTC mainnet address above, which is a burner too — never put real funds you care about in a burner). Your main wallets stay separate; this tool never touches them.
- **No seed phrase is ever typed anywhere a stranger suggests.** This generator runs locally, offline except for the TRON address check (`api.trongrid.io`).
- **Testnet-first.** The EVM burner is the signer for the [finu-tokens](https://github.com/0xfinu/finu-tokens) and [finu-sniper](https://github.com/0xfinu/finu-sniper) testnet work. Nothing here is for mainnet funds.

## Publishing

On release, `.github/workflows/publish.yml` publishes `@0xfinu/finu-wallet` to GitHub Packages (npm) using the built-in `GITHUB_TOKEN` — no secret to configure. Install it with:

```bash
npm install @0xfinu/finu-wallet@1.0.0
```

---

*Built with [finu.muse](https://0xfinu.github.io/finu.muse/) — 0xfinu + muse. Testnet only — no real money, no mainnet funds.*
