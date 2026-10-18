import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

function hashPassword(password) {
    const salt = randomBytes(16).toString("base64");
    const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("base64");
    return `scrypt$16384$${salt}$${hash}`;
}

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
    console.error("DB_URL tidak ditemukan di .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

const DIVISI_BARU = [
    "admin", "manjemen", "desainer", "sheet_metal", "expanding",
    "piping_brazing", "perakitan_indoor", "perakitan_outdoor", "quality_assurance", "gudang",
];

async function upgradeLama() {
    const tipe = await pool.query("SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'divisi_enum') AS ada");
    if (tipe.rows[0]?.ada) {
        const sudah = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid WHERE t.typname = 'divisi_enum' AND e.enumlabel = 'manjemen') AS sudah"
        );
        if (!sudah.rows[0].sudah) {
            console.log("• Mengganti divisi_enum lama ke 10 divisi baru...");
            await pool.query("DROP TABLE IF EXISTS job_order_produk CASCADE");
            await pool.query("DROP TABLE IF EXISTS job_orders CASCADE");
            await pool.query(`CREATE TYPE divisi_enum_baru AS ENUM ('${DIVISI_BARU.join("','")}')`);
            await pool.query("ALTER TABLE users ALTER COLUMN divisi TYPE divisi_enum_baru USING (divisi::text::divisi_enum_baru)");
            await pool.query("DROP TYPE divisi_enum");
            await pool.query("ALTER TYPE divisi_enum_baru RENAME TO divisi_enum");
        }
    }

    const lama = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_orders' AND column_name = 'nomor_pelanggan') AS lama"
    );
    if (lama.rows[0].lama) {
        console.log("• Menyingkirkan job_orders bentuk lama (nomor_pelanggan teks)...");
        await pool.query("DROP TABLE IF EXISTS job_order_produk CASCADE");
        await pool.query("DROP TABLE IF EXISTS job_orders CASCADE");
    }
}

async function seed() {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS jumlah FROM users");
    if (rows[0].jumlah === 0) {
        await pool.query("INSERT INTO users (username, password, divisi) VALUES ($1, $2, 'admin')", [
            "admin",
            hashPassword(process.env.SEED_PASSWORD ?? "admin123!"),
        ]);
        console.log('✔ Akun admin dibuat (username: "admin", password: "admin123!") — segera ganti setelah masuk');
    } else {
        console.log(`✔ Users sudah ada (${rows[0].jumlah} akun), seed dilewati`);
    }

    const jo = await pool.query("SELECT COUNT(*)::int AS jumlah FROM job_orders");
    if (jo.rows[0].jumlah === 0) {
        let pelId;
        const pel = await pool.query("SELECT id FROM pelanggan LIMIT 1");
        if (pel.rows[0]) {
            pelId = pel.rows[0].id;
        } else {
            const baru = await pool.query(
                "INSERT INTO pelanggan (nama, nomor_telepon, email) VALUES ('PT Contoh Penerbangan', '081234567890', 'kontak@contoh.co.id') RETURNING id"
            );
            pelId = baru.rows[0].id;
        }

        const j1 = await pool.query(
            `INSERT INTO job_orders (nomor, id_pelanggan, tanggal_terima, tanggal_selesai, persentase, status, divisi_pengerjaan)
             VALUES ('JO/STU/0001', $1, CURRENT_DATE - 3, CURRENT_DATE + 7, 40, 'proses', 'desainer')
             RETURNING nomor`,
            [pelId]
        );
        await pool.query(
            `INSERT INTO job_order_produk (nomor, nama, jumlah, keterangan) VALUES
                ($1, 'Panel Fuselage', 3, 'Aluminium 2024'),
                ($1, 'Baut Ring', 120, NULL)`,
            [j1.rows[0].nomor]
        );
        const j2 = await pool.query(
            `INSERT INTO job_orders (nomor, id_pelanggan, tanggal_terima, tanggal_selesai, persentase, status, divisi_pengerjaan)
             VALUES ('JO/STU/0002', $1, CURRENT_DATE - 10, CURRENT_DATE - 2, 100, 'selesai', NULL)
             RETURNING nomor`,
            [pelId]
        );
        await pool.query(
            `INSERT INTO job_order_produk (nomor, nama, jumlah, keterangan) VALUES ($1, 'Duct AC', 2, 'Kabin')`,
            [j2.rows[0].nomor]
        );
        await pool.query("SELECT setval('job_orders_seq', GREATEST((SELECT COALESCE(MAX(x.n), 0) FROM (SELECT substring(nomor from 11)::int AS n FROM job_orders WHERE nomor ~ '^JO/STU/[0-9]+$') x), 1))");
        console.log("✔ Data contoh job order & produk dibuat (JO/STU/0001, JO/STU/0002)");
    }
}

async function main() {
    await upgradeLama();

    const direktori = path.dirname(fileURLToPath(import.meta.url));
    const skemaSql = readFileSync(path.join(direktori, "schema.sql"), "utf8");
    await pool.query(skemaSql);
    console.log("✔ Skema database diterapkan");

    await seed();
}

main()
    .then(() => pool.end())
    .catch((err) => {
        console.error("✖ Gagal migrate:", err.message);
        process.exit(1);
    });
