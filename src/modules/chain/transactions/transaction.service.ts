import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as crypto from "crypto";
import * as Base58 from "base-58";
import * as secp256k1 from 'secp256k1'
import { Signer } from "crypto";

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
// generate privKey
  let privKey
  do {
    privKey = crypto.randomBytes(32)
    privKey = 'f19c523315891e6e15ae0608a35eec2e00ebd6d1984cf167f46336dabd9b2de4';
    privKey = Buffer.from(privKey, 'hex');
    // privKey = Uint8Array.from(Buffer.from('d2e434b74d08afebf787d63f4cde9b28f9ccb7fa9ddbe2eaffb48aaf9a3017ca'));
  } while (!secp256k1.privateKeyVerify(privKey));
  console.log('Private Key: ' + privKey.toString('hex'));

  // get the public key in a compressed format
  const pubKey = secp256k1.publicKeyCreate(privKey);
  console.log('Public Key: ' + (new Buffer(pubKey)).toString('hex'));

  const privKeyWif = Base58.encode('0x80' + privKey);

  const ripemd160WithRSA = crypto.createHash('ripemd160WithRSA');
  ripemd160WithRSA.update(pubKey);
  const address = Base58.encode('0x80' + ripemd160WithRSA.digest('hex'));
  console.log('Address: ' + address);



  // const wallet: any = Base58.encode('0x80' + privateKey);
  // console.log(wallet);
  // // console.log(crypto.getHashes())
  // const sign = crypto.createSign('sha256');
  // sign.update('some data to sign');
  // const privatekey = crypto.crea(privateKeyEncode)
  // try {
  //   const signature = sign.sign(privateKey, 'hex');
  //   console.log(signature);
  //
  // } catch (e) {
  //   console.log('ERROL');
  //   console.log(e);
  // }
  // console.log(privateKey);
  // privateKey = '80' + privateKey;
  // console.log(privateKey.toString('hex'));
  // console.log(privateKey.toString('base64'));

  // const hash: any = crypto.createHash('sha256').update(bytes).digest('hex');
  // console.log(hash);

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