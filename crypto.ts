import { ethers } from "ethers";

/**
 * Derives an ETH address (for USDT-ERC20) from a master XPUB and an index.
 * Path: m/44'/60'/0'/0/index (Standard External Chain)
 */
export const deriveUsdtAddress = (xpub: string, index: number): string => {
  try {
    if (!xpub || !xpub.startsWith('xpub')) return "";

    const node = ethers.HDNodeWallet.fromExtendedKey(xpub);
    const child = node.derivePath(`0/${index}`);

    return child.address;
  } catch (e) {
    console.error("Error deriving ETH address:", e);
    return "Error: Invalid XPUB Configuration";
  }
};

/**
 * Derives a BTC address from a master XPUB and an index.
 * For this demo we derive a deterministic bech32-style address string
 * from the HD public key using ethers' HDNode as a generic BIP32 helper.
 * Path: m/84'/0'/0'/0/index (Native SegWit-like path, simulated)
 */
export const deriveBtcAddress = (xpub: string, index: number): string => {
  try {
    if (!xpub || !xpub.startsWith('xpub')) return "";

    // Use ethers' HDNodeWallet as a generic BIP32 node to derive a child key.
    const node = ethers.HDNodeWallet.fromExtendedKey(xpub as any);
    const child = node.derivePath(`0/${index}`);

    const hash = ethers.keccak256(child.publicKey);
    const suffix = hash.replace(/^0x/, "").slice(0, 40);

    return `bc1q${suffix}`;
  } catch (e) {
    console.error("Error deriving BTC address:", e);
    return "Error: Invalid BTC XPUB";
  }
};

