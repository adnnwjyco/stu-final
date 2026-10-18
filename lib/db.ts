import "server-only";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function dapatkanPool(): pg.Pool {
    if (!pool) {
        const dbUrl = process.env.DB_URL;
        if (!dbUrl) throw new Error("DB_URL belum diatur di .env");
        pool = new Pool({ connectionString: dbUrl, max: 10 });
    }
    return pool;
}

export async function query<T = Record<string, unknown>>(
    teks: string,
    param: unknown[] = []
): Promise<T[]> {
    const hasil = await dapatkanPool().query(teks, param as never[]);
    return hasil.rows as T[];
}

type Q = <T = Record<string, unknown>>(teks: string, param?: unknown[]) => Promise<T[]>;

export async function jalankanTransaksi<T>(isi: (q: Q) => Promise<T>): Promise<T> {
    const klien = await dapatkanPool().connect();
    const q: Q = async (teks, param = []) => {
        const hasil = await klien.query(teks, param as never[]);
        return hasil.rows as never[];
    };
    try {
        await klien.query("BEGIN");
        const hasil = await isi(q);
        await klien.query("COMMIT");
        return hasil;
    } catch (err) {
        await klien.query("ROLLBACK");
        throw err;
    } finally {
        klien.release();
    }
}
