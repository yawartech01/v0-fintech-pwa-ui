import axios from 'axios';
import logger from '../config/logger';

const TRONGRID_API = 'https://api.trongrid.io';
const API_KEY = process.env.TRONGRID_API_KEY || '';
const COMPANY_ADDRESS = process.env.COMPANY_DEPOSIT_ADDRESS || '';
// USDT TRC20 contract on TRON mainnet
const USDT_CONTRACT = process.env.USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const client = axios.create({
  baseURL: TRONGRID_API,
  timeout: 15000,
  headers: { 'TRON-PRO-API-KEY': API_KEY },
});

export interface TRC20Transfer {
  txHash: string;
  from: string;
  to: string;
  amount: number;        // USDT (already divided by 1e6)
  blockTimestamp: number;
  confirmed: boolean;
}

/**
 * Verify a specific transaction by its hash.
 * Returns transfer details if it is a valid USDT TRC20 transfer TO the company address.
 */
export async function verifyTransaction(txHash: string): Promise<TRC20Transfer | null> {
  try {
    const { data } = await client.get(`/v1/transactions/${txHash}`);
    const tx = data?.data?.[0];
    if (!tx) return null;

    const confirmed = tx.ret?.[0]?.contractRet === 'SUCCESS';

    // For TRC20 transfers, the actual token transfer is in the internal/log data.
    // Query the transaction info for TRC20 event logs.
    const { data: infoData } = await client.post('/wallet/gettransactioninfobyid', {
      value: txHash,
    });

    if (!infoData || !infoData.log || infoData.log.length === 0) {
      return null;
    }

    // TRC20 Transfer event topic: Transfer(address,address,uint256)
    const transferTopic = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    for (const log of infoData.log) {
      if (log.topics?.[0] !== transferTopic) continue;

      const contractAddr = '41' + log.address;
      const expectedContract = tronAddressToHex(USDT_CONTRACT);
      if (contractAddr.toLowerCase() !== expectedContract.toLowerCase()) continue;

      const fromHex = '41' + log.topics[1].slice(24);
      const toHex = '41' + log.topics[2].slice(24);
      const amountHex = log.data;

      const from = hexToTronAddress(fromHex);
      const to = hexToTronAddress(toHex);
      const amount = parseInt(amountHex, 16) / 1e6; // USDT has 6 decimals

      if (to.toLowerCase() !== COMPANY_ADDRESS.toLowerCase()) continue;

      return {
        txHash,
        from,
        to,
        amount: Math.round(amount * 1e6) / 1e6,
        blockTimestamp: infoData.blockTimeStamp || Date.now(),
        confirmed,
      };
    }

    return null;
  } catch (error: any) {
    logger.error(`TronGrid verifyTransaction error for ${txHash}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch recent TRC20 USDT transfers TO the company address.
 * Used by the background poller to auto-detect new deposits.
 */
export async function getRecentDeposits(sinceTimestamp?: number): Promise<TRC20Transfer[]> {
  try {
    const params: Record<string, any> = {
      only_to: true,
      only_confirmed: true,
      limit: 50,
      contract_address: USDT_CONTRACT,
    };
    if (sinceTimestamp) {
      params.min_timestamp = sinceTimestamp;
    }

    const { data } = await client.get(
      `/v1/accounts/${COMPANY_ADDRESS}/transactions/trc20`,
      { params }
    );

    if (!data?.data) return [];

    const transfers: TRC20Transfer[] = [];
    for (const tx of data.data) {
      if (tx.to?.toLowerCase() !== COMPANY_ADDRESS.toLowerCase()) continue;
      if (tx.token_info?.address?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) continue;

      const amount = parseFloat(tx.value) / Math.pow(10, tx.token_info.decimals || 6);

      transfers.push({
        txHash: tx.transaction_id,
        from: tx.from,
        to: tx.to,
        amount: Math.round(amount * 1e6) / 1e6,
        blockTimestamp: tx.block_timestamp,
        confirmed: true,
      });
    }

    return transfers;
  } catch (error: any) {
    logger.error(`TronGrid getRecentDeposits error: ${error.message}`);
    return [];
  }
}

// --- Address conversion utilities ---

function tronAddressToHex(base58: string): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt(0);
  for (const c of base58) {
    const idx = ALPHABET.indexOf(c);
    if (idx < 0) return base58;
    num = num * 58n + BigInt(idx);
  }
  let hex = num.toString(16);
  // Pad to 50 chars (25 bytes)
  while (hex.length < 50) hex = '0' + hex;
  // Strip the 4-byte checksum at the end
  return hex.slice(0, 42);
}

function hexToTronAddress(hex: string): string {
  // We need to convert 21-byte hex (starting with 41) to base58check
  // For comparison purposes, we can use a simpler approach
  // Since TronGrid returns base58 addresses in the /v1/ API, 
  // this is mainly for log parsing where addresses are in hex
  try {
    const bytes = Buffer.from(hex, 'hex');
    const { createHash } = require('crypto');
    const hash1 = createHash('sha256').update(bytes).digest();
    const hash2 = createHash('sha256').update(hash1).digest();
    const checksum = hash2.slice(0, 4);
    const full = Buffer.concat([bytes, checksum]);
    return encodeBase58(full);
  } catch {
    return hex;
  }
}

function encodeBase58(buffer: Buffer): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + buffer.toString('hex'));
  let result = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    num = num / 58n;
    result = ALPHABET[rem] + result;
  }
  for (const byte of buffer) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

export function isValidTxHash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}
