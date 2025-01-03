import CryptoJS from "crypto-js";
import { ManagedEntitiesAuth, ManagedEntitiesEncryption } from "./managed-entities.js";

// 1. Funktion zur Erzeugung eines symmetrischen Schlüssels
export function generateSymmetricKey(): string {
  // Generates a random 256-bit key (32 Bytes)
  const key = CryptoJS.lib.WordArray.random(32);
  return key.toString(CryptoJS.enc.Hex);
}

export function deriveSymmetricKey(passphrase: string): string {
  const salt = "unique-app-salt";
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32, // 256-bit key
    iterations: 10000, // high iterations for better security
  });
  return key.toString(CryptoJS.enc.Hex);
}

export function encryptString(data: string, key: string): string {
  const keyHex = CryptoJS.enc.Hex.parse(key);
  const iv = CryptoJS.lib.WordArray.random(16); // 128-Bit-IV

  // encrypt with AES
  const encrypted = CryptoJS.AES.encrypt(data, keyHex, { iv });
  const result = {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64), // Chiffriertext
    iv: iv.toString(CryptoJS.enc.Hex), // IV
  };

  return JSON.stringify(result);
}

export function decryptString(encryptedData: string, key: string): string {
  const keyHex = CryptoJS.enc.Hex.parse(key);

  // parse encrypted data
  const { ciphertext, iv } = JSON.parse(encryptedData);

  // parse ciphered text and IV from Base64 and hex
  const binaryCiphertext = CryptoJS.enc.Base64.parse(ciphertext);
  const ivHex = CryptoJS.enc.Hex.parse(iv);

  // decrypt with AES
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: binaryCiphertext } as any,
    keyHex,
    { iv: ivHex }
  );

  return decrypted.toString(CryptoJS.enc.Utf8); // Entschlüsselte Zeichenkette zurückgeben
}
    
export class MockManagedEntityAuth implements ManagedEntitiesAuth {
  async sign(data: string, signerAddress: string): Promise<string> {
    // Einfacher MD5-Hash des Datenstrings
    return this.hash(signerAddress + ":" + data);
  }

  async verify(data: string, signature: string, signerAddress: string): Promise<boolean> {
    // Erzeugt denselben MD5-Hash und vergleicht ihn
    const expectedHash = await this.hash(signerAddress + ":" + data);
    return signature === expectedHash;
  }

  async hash(data: string): Promise<string> {
    return CryptoJS.MD5(data).toString(CryptoJS.enc.Hex);
  }
}

export class MockManagedEntityEncryption implements ManagedEntitiesEncryption {
  private readonly key = generateSymmetricKey();

  async decrypt(data: string): Promise<string> {
    return decryptString(data, this.key);
  }

  async encrypt(data: string): Promise<string> {
    return encryptString(data, this.key);
  }

}
