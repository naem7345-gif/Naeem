import crypto from 'node:crypto';

export interface TotpSecretEntry {
  secret: string;
  version: number;
}

export const FALLBACK_TOTP_SECRETS: TotpSecretEntry[] = [
  { secret: ',7/*F("rLJ2oxaKL^f+E1xvP@N', version: 61 },
  { secret: 'OmE{ZA.J^":0FG\\Uz?[@WW', version: 60 },
];

export function deriveTotpKey(rawSecret: string): Buffer {
  const mapped = rawSecret
    .split('')
    .map((ch, idx) => ch.charCodeAt(0) ^ ((idx % 33) + 9));
  const utf8Hex = Buffer.from(mapped.join(''), 'utf8').toString('hex');
  return Buffer.from(utf8Hex, 'hex');
}

export function generateTotp(secretKey: Buffer, timestampMs: number = Date.now()): string {
  const counter = Math.floor(timestampMs / 1000 / 30);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', secretKey).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, '0');
}
