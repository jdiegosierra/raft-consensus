import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as crypto from "crypto";
import * as base58 from "base-58";
import * as secp256k1 from 'secp256k1'
import { ECDH  } from 'crypto';

// interface Input {
//   previous_output: {
//     TxID: string,
//     Index: string
//   },
//   Script_Lenght: string,
//   Script_Sight: string,
//   Sequence: string
//
// }
//
// interface Transaction {
//   version: string,
//   tx_in_count: string,
//   tx_in: Array<Input>
// }

// https://en.bitcoin.it/wiki/Wallet_import_format
export async function getAddress() {
  console.log('Generate private key');
  let privKey: any;
  do {
    privKey = 'F19C523315891E6E15AE0608A35EEC2E00EBD6D1984CF167F46336DABD9B2DE4';
    privKey = Buffer.from(privKey, 'hex');
    // privKey = Uint8Array.from(Buffer.from('d2e434b74d08afebf787d63f4cde9b28f9ccb7fa9ddbe2eaffb48aaf9a3017ca'));
  } while (!secp256k1.privateKeyVerify(privKey));
  const privKeyHex = privKey.toString('hex');
  console.log(privKeyHex);

  // {
  {
    console.log('Generate Public Key');
    const ecdh: ECDH = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privKey);
    const publicKey = ecdh.getPublicKey();
    console.log(ecdh.getPublicKey().toString('hex'));

    console.log('Private Key to Address');
    let sha256 = crypto.createHash('sha256');
    let hash: any = sha256.update(Buffer.from(ecdh.getPublicKey().toString('hex'), 'hex')).digest();
    const ripemd160 = crypto.createHash('ripemd160');
    let hashToRipmd160 = ripemd160.update(Buffer.from(hash.toString('hex'), 'hex')).digest();
    hashToRipmd160 = Buffer.from("00" + hashToRipmd160.toString('hex'), 'hex');
    sha256 = crypto.createHash('sha256');
    hash = sha256.update(Buffer.from(hashToRipmd160.toString('hex'), 'hex')).digest();
    sha256 = crypto.createHash('sha256');
    hash = sha256.update(Buffer.from(hash, 'hex')).digest('hex');
    const checksum = hash.substring(0, 8);
    const hashcs: any = hashToRipmd160.toString('hex') + checksum;
    const address = base58.encode(Buffer.from(hashcs, 'hex'));
    console.log(address.toString('hex'));
  }
  {
    console.log('Private Key To WIF');
    const step1 = Buffer.from("80" + privKeyHex, 'hex');
    // step 2 - create SHA256 hash of step 1
    let sha256 = crypto.createHash('sha256');
    const step2 = sha256.update(step1).digest('hex');
    // step 3 - create SHA256 hash of step 2
    sha256 = crypto.createHash('sha256');
    const step3 = sha256.update(Buffer.from(step2, 'hex')).digest('hex');
    // step 4 - find the 1st byte of step 3 - save as "checksum"
    const checksum = step3.substring(0, 8);
    // step 5 - add step 1 + checksum
    const step4 = step1.toString('hex') + checksum;
    // return base 58 encoding of step 5
    const address = base58.encode(Buffer.from(step4, 'hex'));
    console.log(address);
  }



}

// @Injectable()
// export class TransactionService {
//   // """Handles the leader election process in a validator nodes network.
//   // """
//
//   constructor (private logger: winston.Logger) {
//   }
//
// }