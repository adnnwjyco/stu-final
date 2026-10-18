"use server";

import { query } from "@/lib/db";
import { catatAksi } from "@/lib/audit";
import { getCurrentUser } from "@/lib/dal";
import { bolehAksi } from "@/lib/akses";

type BentukPelanggan = {
    errors?: { umum?: string[]; nama?: string[]; nomor_telepon?: string[]; email?: string[] };
    berhasil?: boolean;
};

export type StatePelanggan = BentukPelanggan | undefined;

const EMAIL_SAH = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validasi(formData: FormData): { data?: { nama: string; nomor_telepon: string; email: string }; errors?: NonNullable<BentukPelanggan["errors"]> } {
    const nama = String(formData.get("nama") ?? "").trim();
    const nomorTelepon = String(formData.get("nomor_telepon") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    const errors: NonNullable<BentukPelanggan["errors"]> = {};
    if (!nama) errors.nama = ["Nama wajib diisi"];
    if (nomorTelepon && !/^[0-9+()\s-]{5,20}$/.test(nomorTelepon)) errors.nomor_telepon = ["Nomor telepon tidak valid"];
    if (email && !EMAIL_SAH.test(email)) errors.email = ["Email tidak valid"];
    if (errors.nama || errors.nomor_telepon || errors.email) return { errors };
    return { data: { nama, nomor_telepon: nomorTelepon, email } };
}

export async function tambahPelanggan(_prev: StatePelanggan, formData: FormData): Promise<StatePelanggan> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_pelanggan")) return { errors: { umum: ["Anda tidak berwenang"] } };

    const hasil = validasi(formData);
    if (hasil.errors) return { errors: hasil.errors };
    const { nama, nomor_telepon, email } = hasil.data!;

    try {
        await query("INSERT INTO pelanggan (nama, nomor_telepon, email) VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))", [
            nama,
            nomor_telepon,
            email,
        ]);
        await catatAksi({ userId: user.id, username: user.username, aksi: "tambah_pelanggan", detail: `Pelanggan "${nama}" ditambahkan` });
    } catch (err) {
        console.error("Gagal tambah pelanggan:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }

    return { berhasil: true };
}

export async function ubahPelanggan(_prev: StatePelanggan, formData: FormData): Promise<StatePelanggan> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_pelanggan")) return { errors: { umum: ["Anda tidak berwenang"] } };

    const id = String(formData.get("id") ?? "");
    if (!id) return { errors: { umum: ["Pelanggan tidak ditemukan"] } };

    const hasil = validasi(formData);
    if (hasil.errors) return { errors: hasil.errors };
    const { nama, nomor_telepon, email } = hasil.data!;

    try {
        const rows = await query(
            "UPDATE pelanggan SET nama = $1, nomor_telepon = NULLIF($2, ''), email = NULLIF($3, '') WHERE id = $4 RETURNING id",
            [nama, nomor_telepon, email, id]
        );
        if (!rows[0]) return { errors: { umum: ["Pelanggan tidak ditemukan"] } };
        await catatAksi({ userId: user.id, username: user.username, aksi: "ubah_pelanggan", detail: `Pelanggan "${nama}" diubah` });
    } catch (err) {
        console.error("Gagal ubah pelanggan:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }

    return { berhasil: true };
}

export async function hapusPelanggan(formData: FormData): Promise<{ errors?: string[]; berhasil?: boolean }> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_pelanggan")) return { errors: ["Anda tidak berwenang"] };

    const id = String(formData.get("id") ?? "");
    try {
        const rows = await query<{ nama: string }>("DELETE FROM pelanggan WHERE id = $1 RETURNING nama", [id]);
        if (!rows[0]) return { errors: ["Pelanggan tidak ditemukan"] };
        await catatAksi({ userId: user.id, username: user.username, aksi: "hapus_pelanggan", detail: `Pelanggan "${rows[0].nama}" dihapus` });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal hapus pelanggan:", err);
        return { errors: ["Gagal menghapus, coba lagi"] };
    }
}
