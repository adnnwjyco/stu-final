import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DB_URL,
    ssl: process.env.DB_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

const HITUNG = `SELECT COALESCE(MAX(CASE WHEN nomor ~ '^JO/STU/[0-9]+$' THEN substring(nomor from 8)::int END), 0) + 1 AS n FROM job_orders`;

const client = await pool.connect();
try {
    const asal = await client.query("SELECT array_agg(nomor ORDER BY nomor) AS a FROM job_orders");
    console.log("Data awal:", JSON.stringify(asal.rows[0].a));

    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('job_orders_nomor'))");

    const m = await client.query(
        "SELECT COALESCE(MAX(CASE WHEN nomor ~ '^JO/STU/[0-9]+$' THEN substring(nomor from 8)::int END), 0) AS m FROM job_orders"
    );
    const maxSekarang = Number(m.rows[0].m);

    const n1 = Number((await client.query(HITUNG)).rows[0].n);
    console.log(`1. Nomor berikutnya: ${n1} → ${n1 === maxSekarang + 1 ? "SESUAI MAX+1 ✔" : `SALAH (max=${maxSekarang}) ✖`}`);

    const nomorTertinggi = `JO/STU/${String(maxSekarang).padStart(4, "0")}`;
    await client.query("INSERT INTO job_orders (nomor, id_pelanggan, tanggal_terima, tanggal_selesai) SELECT $1, id, CURRENT_DATE, CURRENT_DATE + 7 FROM pelanggan LIMIT 1", [
        `JO/STU/${String(n1).padStart(4, "0")}`,
    ]);
    await client.query("ROLLBACK");
    const n2 = Number((await (async () => { await client.query("SELECT pg_advisory_xact_lock(hashtext('job_orders_nomor'))"); return client.query(HITUNG); })()).rows[0].n);
    console.log(`2. Setelah INSERT nomor ${n1} + ROLLBACK, nomor berikutnya: ${n2} → ${n2 === n1 ? "ROLLBACK TIDAK MENYISAKAN NOMOR (TIDAK LONGKAP) ✔" : `LONGKAP ✖ (dapat ${n2})`}`);
    await client.query("ROLLBACK");

    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('job_orders_nomor'))");
    await client.query("DELETE FROM job_orders WHERE nomor = $1", [nomorTertinggi]);
    const n3 = Number((await client.query(HITUNG)).rows[0].n);
    console.log(`3. Setelah hapus JO tertinggi ${nomorTertinggi}, nomor berikutnya: ${n3} → ${n3 === maxSekarang ? "NOMOR TERHAPUS DIPAKAI ULANG (TIDAK LONGKAP) ✔" : `SALAH ✖ (dapat ${n3})`}`);
    await client.query("ROLLBACK");

    const akhir = await client.query("SELECT array_agg(nomor ORDER BY nomor) AS a FROM job_orders");
    const sama = JSON.stringify(akhir.rows[0].a) === JSON.stringify(asal.rows[0].a);
    console.log(`4. Data DB tidak berubah setelah semua uji: ${sama ? "AMAN ✔" : `BERUBAH ✖ (${JSON.stringify(akhir.rows[0].a)})`}`);
} finally {
    await client.release();
    await pool.end();
}
