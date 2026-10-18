"use server";

import { query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { catatAksi } from "@/lib/audit";
import { getCurrentUser } from "@/lib/dal";
import { bolehAksi, divisiValid, LABEL_DIVISI, type Divisi } from "@/lib/akses";

type BentukAkun = {
    errors?: { umum?: string[]; username?: string[]; password?: string[]; divisi?: string[] };
    berhasil?: boolean;
};

export type StateAkun = BentukAkun | undefined;

export async function tambahAkun(_prev: StateAkun, formData: FormData): Promise<StateAkun> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_akun")) return { errors: { umum: ["Anda tidak berwenang"] } };

    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const divisi = formData.get("divisi");

    const errors: NonNullable<BentukAkun["errors"]> = {};
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) errors.username = ["Username 3-50 karakter, huruf/angka/_.- saja"];
    if (password.length < 8) errors.password = ["Password minimal 8 karakter"];
    if (!divisiValid(divisi)) errors.divisi = ["Divisi tidak valid"];
    if (errors.username || errors.password || errors.divisi) return { errors };

    try {
        await query("INSERT INTO users (username, password, divisi) VALUES ($1, $2, $3)", [
            username,
            hashPassword(password),
            divisi,
        ]);
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "tambah_akun",
            detail: `Akun "${username}" (${LABEL_DIVISI[divisi as Divisi]}) dibuat`,
        });
    } catch (err) {
        const kode = (err as { code?: string }).code;
        if (kode === "23505") return { errors: { username: ["Username sudah dipakai"] } };
        console.error("Gagal tambah akun:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }

    return { berhasil: true };
}

export async function ubahDivisiAkun(formData: FormData): Promise<{ errors?: string[]; berhasil?: boolean }> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_akun")) return { errors: ["Anda tidak berwenang"] };

    const id = String(formData.get("id") ?? "");
    const divisi = formData.get("divisi");
    if (!divisiValid(divisi)) return { errors: ["Divisi tidak valid"] };
    if (id === user.id) return { errors: ["Tidak bisa mengubah divisi akun sendiri"] };

    try {
        const hasil = await query<{ username: string }>(
            "UPDATE users SET divisi = $1 WHERE id = $2 RETURNING username",
            [divisi, id]
        );
        if (!hasil[0]) return { errors: ["Akun tidak ditemukan"] };
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "ubah_divisi",
            detail: `Divisi "${hasil[0].username}" diubah menjadi ${LABEL_DIVISI[divisi]}`,
        });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal ubah divisi:", err);
        return { errors: ["Gagal menyimpan, coba lagi"] };
    }
}

export async function resetPasswordAkun(formData: FormData): Promise<{ errors?: string[]; berhasil?: boolean }> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_akun")) return { errors: ["Anda tidak berwenang"] };

    const id = String(formData.get("id") ?? "");
    const passwordBaru = String(formData.get("password") ?? "");
    if (passwordBaru.length < 8) return { errors: ["Password minimal 8 karakter"] };

    try {
        const hasil = await query<{ username: string }>(
            "UPDATE users SET password = $1 WHERE id = $2 RETURNING username",
            [hashPassword(passwordBaru), id]
        );
        if (!hasil[0]) return { errors: ["Akun tidak ditemukan"] };
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "reset_password",
            detail: `Password akun "${hasil[0].username}" direset`,
        });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal reset password:", err);
        return { errors: ["Gagal menyimpan, coba lagi"] };
    }
}

export async function hapusAkun(formData: FormData): Promise<{ errors?: string[]; berhasil?: boolean }> {
    const user = await getCurrentUser();
    if (!bolehAksi(user.divisi, "kelola_akun")) return { errors: ["Anda tidak berwenang"] };

    const id = String(formData.get("id") ?? "");
    if (id === user.id) return { errors: ["Tidak bisa menghapus akun sendiri"] };

    try {
        const hasil = await query<{ username: string }>("DELETE FROM users WHERE id = $1 RETURNING username", [id]);
        if (!hasil[0]) return { errors: ["Akun tidak ditemukan"] };
        await catatAksi({
            userId: user.id,
            username: user.username,
            aksi: "hapus_akun",
            detail: `Akun "${hasil[0].username}" dihapus`,
        });
        return { berhasil: true };
    } catch (err) {
        console.error("Gagal hapus akun:", err);
        return { errors: ["Gagal menghapus, coba lagi"] };
    }
}
