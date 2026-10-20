import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DB_URL,
    ssl: process.env.DB_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

const isi = async (label) => {
    const r = await pool.query("SELECT array_agg(nomor ORDER BY nomor) AS a FROM job_orders");
    console.log(label, JSON.stringify(r.rows[0].a));
};

const client = await pool.connect();
const isiClient = async (label) => {
    const r = await client.query("SELECT array_agg(nomor ORDER BY nomor) AS a FROM job_orders");
    console.log(label, JSON.stringify(r.rows[0].a));
};

try {
    const info = await pool.query(
        "SELECT version() AS v, pg_is_in_recovery() AS recovery, current_setting('default_transaction_isolation') AS isolasi"
    );
    console.log("Server:", info.rows[0].v.slice(0, 60), "| recovery:", info.rows[0].recovery, "| isolasi:", info.rows[0].isolasi);

    await isi("A. Kondisi awal (pool):");
    await isiClient("B. Kondisi awal (client):");

    await client.query("BEGIN");
    await isiClient("C. Dalam tx, sebelum insert:");
    await client.query(
        `INSERT INTO job_orders (nomor, id_pelanggan, tanggal_terima, tanggal_selesai)
         SELECT 'JO/STU/9999', id, CURRENT_DATE, CURRENT_DATE + 7 FROM pelanggan LIMIT 1`
    );
    await isiClient("D. Dalam tx, sesudah insert 9999:");
    await client.query("ROLLBACK");
    await isiClient("E. Sesudah ROLLBACK:");
    await isi("F. Sesudah ROLLBACK (pool/beda koneksi):");

    const act = await pool.query(
        "SELECT pid, state, application_name, left(query, 90) AS q FROM pg_stat_activity WHERE datname = current_database()"
    );
    console.log("pg_stat_activity:", JSON.stringify(act.rows, null, 1));
} finally {
    await client.release();
    await pool.end();
}
