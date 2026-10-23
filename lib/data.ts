import "server-only";
import { query } from "./db";
import type { Divisi } from "./akses";

export type Statistik = {
    lingkup: "semua" | "divisi";
    divisi: Divisi | null;
    totalJob: number;
    pending: number;
    proses: number;
    selesai: number;
    dibatalkan: number;
    totalPelanggan: number;
    bulanan: { bulan: string; jumlah: number }[];
};

export type JobOrderRow = {
    nomor: string;
    id_pelanggan: string;
    nama_pelanggan: string;
    tanggal_terima: string;
    tanggal_selesai: string;
    persentase: number;
    status: "pending" | "proses" | "selesai" | "dibatalkan";
    divisi_pengerjaan: Divisi | null;
    menunggu_terima: boolean;
    diterima_pada: string | null;
};

export type ProdukRow = {
    id: string;
    nomor: string;
    nama: string;
    jumlah: number;
    keterangan: string | null;
};

export type PelangganRow = {
    id: string;
    nama: string;
    nomor_telepon: string | null;
    email: string | null;
};

export type AkunRow = {
    id: string;
    username: string;
    divisi: Divisi;
};

export async function getStatistik(lingkupDivisi?: Divisi): Promise<Statistik> {
    const param: unknown[] = [];
    let where = "";
    if (lingkupDivisi) {
        param.push(lingkupDivisi);
        where = "WHERE divisi_pengerjaan = $1::divisi_enum";
    }
    const [job] = await query<{
        total: number;
        pending: number;
        proses: number;
        selesai: number;
        dibatalkan: number;
    }>(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
            COUNT(*) FILTER (WHERE status = 'proses')::int AS proses,
            COUNT(*) FILTER (WHERE status = 'selesai')::int AS selesai,
            COUNT(*) FILTER (WHERE status = 'dibatalkan')::int AS dibatalkan
        FROM job_orders ${where}
    `, param);
    const [pel] = await query<{ total: number }>("SELECT COUNT(*)::int AS total FROM pelanggan");
    const bulanan = await getStatistikBulanan(lingkupDivisi);
    return {
        lingkup: lingkupDivisi ? "divisi" : "semua",
        divisi: lingkupDivisi ?? null,
        totalJob: job?.total ?? 0,
        pending: job?.pending ?? 0,
        proses: job?.proses ?? 0,
        selesai: job?.selesai ?? 0,
        dibatalkan: job?.dibatalkan ?? 0,
        totalPelanggan: lingkupDivisi ? 0 : (pel?.total ?? 0),
        bulanan,
    };
}

export async function getStatistikBulanan(lingkupDivisi?: Divisi): Promise<{ bulan: string; jumlah: number }[]> {
    const param: unknown[] = [];
    let where = "";
    if (lingkupDivisi) {
        param.push(lingkupDivisi);
        where = "WHERE divisi_pengerjaan = $1::divisi_enum";
    }
    return query<{ bulan: string; jumlah: number }>(
        `SELECT to_char(date_trunc('month', tanggal_terima), 'YYYY-MM') AS bulan,
                COUNT(*)::int AS jumlah
         FROM job_orders ${where}
         GROUP BY 1
         ORDER BY 1`,
        param
    );
}

export type SaringanJobOrder = {
    cari?: string;
    status?: string;
    hanyaMilik?: Divisi;
};

export async function getJobOrders(saringan: SaringanJobOrder = {}): Promise<JobOrderRow[]> {
    const { cari, status, hanyaMilik } = saringan;
    const kondisi: string[] = [];
    const param: unknown[] = [];
    if (hanyaMilik) {
        param.push(hanyaMilik);
        kondisi.push(`jo.divisi_pengerjaan = $${param.length}::divisi_enum`);
    }
    if (cari) {
        param.push(`%${cari}%`);
        kondisi.push(`(jo.nomor ILIKE $${param.length} OR p.nama ILIKE $${param.length})`);
    }
    if (status && ["pending", "proses", "selesai", "dibatalkan"].includes(status)) {
        param.push(status);
        kondisi.push(`jo.status = $${param.length}::status_job_enum`);
    }
    const where = kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "";
    return query<JobOrderRow>(
        `SELECT jo.nomor, jo.id_pelanggan, p.nama AS nama_pelanggan, jo.tanggal_terima, jo.tanggal_selesai,
                jo.persentase, jo.status, jo.divisi_pengerjaan, jo.menunggu_terima, jo.diterima_pada
         FROM job_orders jo
         JOIN pelanggan p ON p.id = jo.id_pelanggan
         ${where}
         ORDER BY jo.nomor DESC
         LIMIT 500`,
        param
    );
}

export async function getProdukBanyak(nomorJo: string[]): Promise<ProdukRow[]> {
    if (nomorJo.length === 0) return [];
    return query<ProdukRow>(
        "SELECT id, nomor, nama, jumlah::float8 AS jumlah, keterangan FROM job_order_produk WHERE nomor = ANY($1) ORDER BY nama",
        [nomorJo]
    );
}

export async function getPelanggan(cari?: string): Promise<PelangganRow[]> {
    const param: unknown[] = [];
    let where = "";
    if (cari) {
        param.push(`%${cari}%`);
        where = `WHERE nama ILIKE $1 OR nomor_telepon ILIKE $1 OR email ILIKE $1`;
    }
    return query<PelangganRow>(
        `SELECT id, nama, nomor_telepon, email FROM pelanggan ${where} ORDER BY nama LIMIT 500`,
        param
    );
}

export async function getPelangganById(id: string): Promise<PelangganRow | null> {
    const rows = await query<PelangganRow>("SELECT id, nama, nomor_telepon, email FROM pelanggan WHERE id = $1", [id]);
    return rows[0] ?? null;
}

export async function getJobOrdersPelanggan(idPelanggan: string): Promise<JobOrderRow[]> {
    return query<JobOrderRow>(
        `SELECT jo.nomor, jo.id_pelanggan, p.nama AS nama_pelanggan, jo.tanggal_terima, jo.tanggal_selesai,
                jo.persentase, jo.status, jo.divisi_pengerjaan, jo.menunggu_terima, jo.diterima_pada
         FROM job_orders jo
         JOIN pelanggan p ON p.id = jo.id_pelanggan
         WHERE jo.id_pelanggan = $1
         ORDER BY jo.tanggal_terima DESC, jo.nomor DESC
         LIMIT 200`,
        [idPelanggan]
    );
}

export async function getAkun(): Promise<AkunRow[]> {
    return query<AkunRow>("SELECT id, username, divisi FROM users ORDER BY username");
}
