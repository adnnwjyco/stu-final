import "server-only";
import { query } from "./db";

export async function catatAksi(input: {
    userId?: string | null;
    username?: string | null;
    aksi: string;
    detail?: string;
}) {
    try {
        await query(
            "INSERT INTO audit_log (user_id, username, aksi, detail) VALUES ($1, $2, $3, $4)",
            [input.userId ?? null, input.username ?? null, input.aksi, input.detail ?? null]
        );
    } catch (err) {
        console.error("Gagal mencatat audit:", err);
    }
}
