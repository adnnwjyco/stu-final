"use server";

import { query, jalankanTransaksi } from "@/lib/db";
import { catatAksi } from "@/lib/audit";
import { getCurrentUser } from "@/lib/dal";
import { bolehAksi, divisiSetelah, divisiValid, LABEL_DIVISI, persentaseDivisi, type Divisi, type Pengguna } from "@/lib/akses";
import { susunNomorPrp } from "@/lib/nomor";

type BentukJobOrder = {
    errors?: {
        umum?: string[];
        pelanggan?: string[];
        nomor?: string[];
        tanggal_terima?: string[];
        tanggal_selesai?: string[];
        produk?: string[];
        persentase?: string[];
        status?: string[];
        divisi?: string[];
    };
    pesan?: string;
    berhasil?: boolean;
};

export type StateJobOrder = BentukJobOrder | undefined;

type StateRingkas = { errors?: string[]; berhasil?: boolean } | undefined;

type BarisProduk = { nama: string; jumlah: number; keterangan: string };

async function ambilJo(nomor: string) {
    const rows = await query<{
        nomor: string;
        status: "pending" | "proses" | "selesai" | "dibatalkan";
        divisi_pengerjaan: Divisi | null;
        menunggu_terima: boolean;
        diterima_pada: Date | null;
    }>("SELECT nomor, status, divisi_pengerjaan, menunggu_terima, diterima_pada FROM job_orders WHERE nomor = $1", [nomor]);
    return rows[0] ?? null;
}

function bolehKelola(user: Pengguna, jo: { divisi_pengerjaan: Divisi | null }): boolean {
    return user.divisi === "admin" || (jo.divisi_pengerjaan !== null && user.divisi === jo.divisi_pengerjaan);
}

function ambilProdukForm(formData: FormData): { data?: BarisProduk[]; errors?: string[] } {
    const namaList = formData.getAll("produk_nama").map((x) => String(x).trim());
    const jumlahList = formData.getAll("produk_jumlah").map((x) => String(x).trim());
    const keteranganList = formData.getAll("produk_keterangan").map((x) => String(x).trim());

    const data: BarisProduk[] = [];
    for (let i = 0; i < namaList.length; i++) {
        const nama = namaList[i];
        const jumlah = Number(jumlahList[i]);
        if (!nama) return { errors: [`Produk baris ${i + 1}: nama wajib diisi`] };
        if (!Number.isFinite(jumlah) || jumlah <= 0) return { errors: [`Produk "${nama}": jumlah harus lebih dari 0`] };
        data.push({ nama, jumlah, keterangan: keteranganList[i] ?? "" });
    }
    if (data.length === 0) return { errors: ["Minimal satu produk wajib diisi"] };
    return { data };
}

export async function tambahJobOrder(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "tambah_job_order")) return { errors: { umum: ["Anda tidak berwenang"] } };

    const idPelanggan = String(formData.get("id_pelanggan") ?? "");
    const tanggalTerima = String(formData.get("tanggal_terima") ?? "");
    const tanggalSelesai = String(formData.get("tanggal_selesai") ?? "");
    const nomorManual = String(formData.get("nomor") ?? "").trim();

    const errors: BentukJobOrder["errors"] = {};
    if (!idPelanggan) errors.pelanggan = ["Pelanggan wajib dipilih"];
    if (!nomorManual) errors.nomor = ["Nomor job order wajib diisi"];
    else if (!/^\d{1,6}$/.test(nomorManual)) errors.nomor = ["Nomor harus berupa angka 1-6 digit (contoh: 0001)"];
    if (!tanggalTerima) errors.tanggal_terima = ["Tanggal terima wajib diisi"];
    if (!tanggalSelesai) errors.tanggal_selesai = ["Tanggal selesai wajib diisi"];
    if (!errors.tanggal_terima && !errors.tanggal_selesai && tanggalSelesai < tanggalTerima) {
        errors.tanggal_selesai = ["Tanggal selesai tidak boleh sebelum tanggal terima"];
    }

    const hasilProduk = ambilProdukForm(formData);
    if (hasilProduk.errors) errors.produk = hasilProduk.errors;
    if (Object.keys(errors).length > 0) return { errors };

    const kode = susunNomorPrp(tanggalTerima, nomorManual);
    if (!kode) return { errors: { tanggal_terima: ["Tanggal terima tidak valid"] } };

    try {
        const nomor = await jalankanTransaksi(async (q) => {
            await q("SELECT pg_advisory_xact_lock(hashtext('job_orders_nomor'))");
            const ada = await q("SELECT 1 FROM job_orders WHERE nomor = $1", [kode]);
            if (ada.length > 0) return null;
            await q(
                `INSERT INTO job_orders (nomor, id_pelanggan, tanggal_terima, tanggal_selesai, divisi_pengerjaan, menunggu_terima, persentase)
                 VALUES ($1, $2, $3::date, $4::date, 'desainer', TRUE, $5)`,
                [kode, idPelanggan, tanggalTerima, tanggalSelesai, persentaseDivisi("desainer")]
            );
            for (const p of hasilProduk.data!) {
                await q(
                    "INSERT INTO job_order_produk (nomor, nama, jumlah, keterangan) VALUES ($1, $2, $3, NULLIF($4, ''))",
                    [kode, p.nama, p.jumlah, p.keterangan]
                );
            }
            return kode;
        });

        if (!nomor) return { errors: { nomor: [`Nomor ${kode} sudah digunakan, silakan ganti`] } };

        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "tambah_job_order",
            detail: `Job order ${nomor} dibuat, dikerjakan ${LABEL_DIVISI.desainer}, menunggu konfirmasi penerimaan`,
        });
        return { berhasil: true, pesan: `Job order ${nomor} berhasil dibuat, menunggu konfirmasi terima oleh ${LABEL_DIVISI.desainer}.` };
    } catch (err) {
        console.error("Gagal tambah job order:", err);
        if ((err as { code?: string })?.code === "23505") {
            return { errors: { nomor: [`Nomor ${kode} sudah digunakan, silakan ganti`] } };
        }
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function ubahStatusJo(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();

    const nomor = String(formData.get("nomor") ?? "");
    const status = String(formData.get("status") ?? "");

    if (!["pending", "proses"].includes(status)) return { errors: { status: ["Status hanya boleh pending/proses"] } };

    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "selesai" || jo.status === "dibatalkan") {
        return { errors: { umum: ["Job order sudah ditutup"] } };
    }
    if (!bolehKelola(user, jo)) return { errors: { umum: ["Anda tidak berwenang mengelola job order ini"] } };
    if (jo.menunggu_terima) return { errors: { umum: ["Anda belum mengkonfirmasi penerimaan job order ini"] } };

    try {
        await query("UPDATE job_orders SET status = $1::status_job_enum WHERE nomor = $2", [status, nomor]);
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "ubah_status",
            detail: `${nomor} → ${status}`,
        });
        return { berhasil: true, pesan: status === "pending" ? "Job order dipending." : "Proses dilanjutkan." };
    } catch (err) {
        console.error("Gagal ubah status JO:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function terimaJo(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();

    const nomor = String(formData.get("nomor") ?? "");
    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "selesai" || jo.status === "dibatalkan" || !jo.divisi_pengerjaan) {
        return { errors: { umum: ["Job order sudah tidak aktif"] } };
    }
    if (user.divisi !== jo.divisi_pengerjaan) {
        return { errors: { umum: ["Hanya divisi penerima yang boleh mengkonfirmasi penerimaan"] } };
    }
    if (!jo.menunggu_terima) return { errors: { umum: ["Job order sudah diterima"] } };

    try {
        await query("UPDATE job_orders SET menunggu_terima = FALSE, status = 'proses', diterima_pada = now() WHERE nomor = $1", [nomor]);
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "terima_job_order",
            detail: `${nomor} diterima oleh ${LABEL_DIVISI[jo.divisi_pengerjaan]}`,
        });
        return { berhasil: true, pesan: "Job order diterima. Durasi pengerjaan mulai dihitung." };
    } catch (err) {
        console.error("Gagal terima JO:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function serahTerima(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();

    const nomor = String(formData.get("nomor") ?? "");
    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "selesai" || jo.status === "dibatalkan" || !jo.divisi_pengerjaan) {
        return { errors: { umum: ["Job order sudah tidak aktif"] } };
    }
    if (!bolehKelola(user, jo)) return { errors: { umum: ["Anda tidak berwenang"] } };
    if (jo.menunggu_terima) return { errors: { umum: ["Anda belum mengkonfirmasi penerimaan job order ini"] } };

    const berikutnya = divisiSetelah(jo.divisi_pengerjaan);

    try {
        if (berikutnya) {
            await query(
                "UPDATE job_orders SET divisi_pengerjaan = $1::divisi_enum, status = 'proses', persentase = $3, menunggu_terima = TRUE, diterima_pada = NULL WHERE nomor = $2",
                [berikutnya, nomor, persentaseDivisi(berikutnya)]
            );
            await catatAksi({
                userId: user.id,
                username: user.username,
                aksi: "serah_terima",
                detail: `${nomor} diserahkan dari ${LABEL_DIVISI[jo.divisi_pengerjaan]} ke ${LABEL_DIVISI[berikutnya]}, menunggu konfirmasi penerimaan`,
            });
            return { berhasil: true, pesan: `Diserahkan ke ${LABEL_DIVISI[berikutnya]}, menunggu konfirmasi terima.` };
        }

        await query(
            "UPDATE job_orders SET status = 'selesai', persentase = 100, divisi_pengerjaan = NULL, menunggu_terima = FALSE, diterima_pada = NULL WHERE nomor = $1",
            [nomor]
        );
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "selesai_job_order",
            detail: `${nomor} ditandai selesai oleh ${LABEL_DIVISI[jo.divisi_pengerjaan]}`,
        });
        return { berhasil: true, pesan: "Job order ditandai selesai." };
    } catch (err) {
        console.error("Gagal serah terima:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function pindahDivisi(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();
    if (user.divisi !== "admin") return { errors: { umum: ["Hanya admin yang boleh memindah divisi"] } };

    const nomor = String(formData.get("nomor") ?? "");
    const divisiBaru = formData.get("divisi");

    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "selesai" || jo.status === "dibatalkan") {
        return { errors: { umum: ["Job order sudah ditutup"] } };
    }
    if (!divisiValid(divisiBaru)) return { errors: { divisi: ["Divisi tidak valid"] } };

    try {
        await query(
            "UPDATE job_orders SET divisi_pengerjaan = $1::divisi_enum, status = 'proses', persentase = $3, menunggu_terima = FALSE, diterima_pada = now() WHERE nomor = $2",
            [divisiBaru, nomor, persentaseDivisi(divisiBaru)]
        );
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "pindah_divisi",
            detail: `${nomor} dipindah ke ${LABEL_DIVISI[divisiBaru]} oleh admin (langsung aktif, tanpa konfirmasi)`,
        });
        return { berhasil: true, pesan: `Dipindah ke ${LABEL_DIVISI[divisiBaru]}. Job order langsung aktif tanpa konfirmasi.` };
    } catch (err) {
        console.error("Gagal pindah divisi:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function batalkanJo(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();
    if (user.divisi !== "admin") return { errors: { umum: ["Hanya admin yang boleh membatalkan"] } };

    const nomor = String(formData.get("nomor") ?? "");
    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "selesai" || jo.status === "dibatalkan") {
        return { errors: { umum: ["Job order sudah ditutup"] } };
    }

    try {
        await query(
            "UPDATE job_orders SET status = 'dibatalkan', divisi_pengerjaan = NULL, menunggu_terima = FALSE, diterima_pada = NULL WHERE nomor = $1",
            [nomor]
        );
        await catatAksi({ userId: user.id, username: user.username, aksi: "batal_job_order", detail: `${nomor} dibatalkan` });
        return { berhasil: true, pesan: "Job order dibatalkan." };
    } catch (err) {
        console.error("Gagal batalkan JO:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function hapusJo(formData: FormData): Promise<StateRingkas> {
    const user = await getCurrentUser();
    if (user.divisi !== "admin") return { errors: ["Hanya admin yang boleh menghapus"] };

    const nomor = String(formData.get("nomor") ?? "");
    const jo = await ambilJo(nomor);
    if (!jo) return { errors: ["Job order tidak ditemukan"] };

    try {
        await query("DELETE FROM job_orders WHERE nomor = $1", [nomor]);
        await catatAksi({ userId: user.id, username: user.username, aksi: "hapus_job_order", detail: `${nomor} dihapus permanen` });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal hapus JO:", err);
        return { errors: ["Gagal menghapus, coba lagi"] };
    }
}

export async function tambahProduk(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();

    const nomor = String(formData.get("nomor") ?? "");
    const nama = String(formData.get("nama") ?? "").trim();
    const jumlah = Number(formData.get("jumlah"));
    const keterangan = String(formData.get("keterangan") ?? "").trim();

    const errors: BentukJobOrder["errors"] = {};
    if (!nama) errors.produk = ["Nama produk wajib diisi"];
    if (!Number.isFinite(jumlah) || jumlah <= 0) errors.produk = ["Jumlah harus lebih dari 0"];
    if (errors.produk) return { errors };

    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "dibatalkan") return { errors: { umum: ["Job order dibatalkan"] } };
    if (!bolehKelola(user, jo)) return { errors: { umum: ["Anda tidak berwenang"] } };

    try {
        await query("INSERT INTO job_order_produk (nomor, nama, jumlah, keterangan) VALUES ($1, $2, $3, NULLIF($4, ''))", [
            nomor,
            nama,
            jumlah,
            keterangan,
        ]);
        await catatAksi({ userId: user.id, username: user.username, aksi: "tambah_produk", detail: `Produk "${nama}" ditambahkan ke ${nomor}` });
        return { berhasil: true, pesan: "Produk ditambahkan." };
    } catch (err) {
        console.error("Gagal tambah produk:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function ubahProduk(_prev: StateJobOrder, formData: FormData): Promise<StateJobOrder> {
    const user = await getCurrentUser();

    const id = String(formData.get("id_produk") ?? "");
    const nama = String(formData.get("nama") ?? "").trim();
    const jumlah = Number(formData.get("jumlah"));
    const keterangan = String(formData.get("keterangan") ?? "").trim();

    const errors: BentukJobOrder["errors"] = {};
    if (!nama) errors.produk = ["Nama produk wajib diisi"];
    if (!Number.isFinite(jumlah) || jumlah <= 0) errors.produk = ["Jumlah harus lebih dari 0"];
    if (errors.produk) return { errors };

    const rows = await query<{ nomor: string }>("SELECT nomor FROM job_order_produk WHERE id = $1", [id]);
    const nomor = rows[0]?.nomor;
    if (!nomor) return { errors: { umum: ["Produk tidak ditemukan"] } };

    const jo = await ambilJo(nomor);
    if (!jo) return { errors: { umum: ["Job order tidak ditemukan"] } };
    if (jo.status === "dibatalkan") return { errors: { umum: ["Job order dibatalkan"] } };
    if (!bolehKelola(user, jo)) return { errors: { umum: ["Anda tidak berwenang"] } };

    try {
        await query("UPDATE job_order_produk SET nama = $1, jumlah = $2, keterangan = NULLIF($3, '') WHERE id = $4", [
            nama,
            jumlah,
            keterangan,
            id,
        ]);
        await catatAksi({ userId: user.id, username: user.username, aksi: "ubah_produk", detail: `Produk "${nama}" diubah di ${nomor}` });
        return { berhasil: true, pesan: "Produk diperbarui." };
    } catch (err) {
        console.error("Gagal ubah produk:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }
}

export async function hapusProduk(formData: FormData): Promise<StateRingkas> {
    const user = await getCurrentUser();

    const id = String(formData.get("id_produk") ?? "");
    const rows = await query<{ nomor: string; nama: string }>("SELECT nomor, nama FROM job_order_produk WHERE id = $1", [id]);
    const produk = rows[0];
    if (!produk) return { errors: ["Produk tidak ditemukan"] };

    const jo = await ambilJo(produk.nomor);
    if (!jo) return { errors: ["Job order tidak ditemukan"] };
    if (jo.status === "dibatalkan") return { errors: ["Job order dibatalkan"] };
    if (!bolehKelola(user, jo)) return { errors: ["Anda tidak berwenang"] };

    try {
        await query("DELETE FROM job_order_produk WHERE id = $1", [id]);
        await catatAksi({ userId: user.id, username: user.username, aksi: "hapus_produk", detail: `Produk "${produk.nama}" dihapus dari ${produk.nomor}` });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal hapus produk:", err);
        return { errors: ["Gagal menghapus, coba lagi"] };
    }
}
