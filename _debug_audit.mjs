import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DB_URL,
    ssl: process.env.DB_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

const r = await pool.query(
    "SELECT aksi, detail, dibuat_pada FROM audit_log ORDER BY dibuat_pada DESC LIMIT 8"
);
for (const row of r.rows) console.log(row.dibuat_pada.toISOString(), "|", row.aksi, "|", row.detail);

const jo = await pool.query("SELECT nomor, status, divisi_pengerjaan FROM job_orders ORDER BY nomor");
console.log("job_orders:", JSON.stringify(jo.rows));
await pool.end();
