import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SKEMA = "scrypt";
const N = 16384;

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("base64");
    const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1 }).toString("base64");
    return `${SKEMA}$${N}$${salt}$${hash}`;
}

export function verifyPassword(password: string, tersimpan: string): boolean {
    try {
        const [skema, n, salt, hash] = String(tersimpan).split("$");
        if (skema !== SKEMA || !n || !salt || !hash) return false;
        const kandidat = scryptSync(password, salt, 64, { N: Number(n), r: 8, p: 1 });
        return timingSafeEqual(kandidat, Buffer.from(hash, "base64"));
    } catch {
        return false;
    }
}
