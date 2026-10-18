"use server";

import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { getSesi } from "@/lib/session";
import { catatAksi } from "@/lib/audit";
import type { Divisi } from "@/lib/akses";

type BentukState = {
    errors?: { umum?: string[]; lama?: string[]; baru?: string[]; konfirmasi?: string[]; username?: string[]; password?: string[] };
    berhasil?: boolean;
};

export type StateForm = BentukState | undefined;

export async function login(_prev: StateForm, formData: FormData): Promise<StateForm> {
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const errors: NonNullable<BentukState["errors"]> = {};
    if (!username) errors.username = ["Username wajib diisi"];
    if (!password) errors.password = ["Password wajib diisi"];
    if (errors.username || errors.password) return { errors };

    try {
        const rows = await query<{ id: string; username: string; password: string; divisi: Divisi }>(
            "SELECT id, username, password, divisi FROM users WHERE lower(username) = lower($1)",
            [username]
        );
        const user = rows[0];
        if (!user || !verifyPassword(password, user.password)) {
            await catatAksi({ username, aksi: "login_gagal", detail: "Username atau password salah" });
            return { errors: { umum: ["Username atau password salah"] } };
        }

        const sesi = await getSesi();
        sesi.id = user.id;
        sesi.username = user.username;
        sesi.divisi = user.divisi;
        await sesi.save();
        await catatAksi({ userId: user.id, username: user.username, aksi: "login", detail: "Berhasil masuk" });
    } catch (err) {
        console.error("Gagal login:", err);
        return { errors: { umum: ["Gagal terhubung ke server, coba lagi"] } };
    }

    redirect("/dashboard");
}

export async function logout() {
    const sesi = await getSesi();
    if (sesi.username) {
        await catatAksi({ userId: sesi.id, username: sesi.username, aksi: "logout", detail: "Keluar dari sistem" });
    }
    sesi.destroy();
    redirect("/login");
}

export async function gantiPassword(_prev: StateForm, formData: FormData): Promise<StateForm> {
    const sesi = await getSesi();
    const { id, username } = sesi;
    if (!id || !username) redirect("/login");

    const lama = String(formData.get("lama") ?? "");
    const baru = String(formData.get("baru") ?? "");
    const konfirmasi = String(formData.get("konfirmasi") ?? "");

    const errors: NonNullable<BentukState["errors"]> = {};
    if (!lama) errors.lama = ["Password lama wajib diisi"];
    if (baru.length < 8) errors.baru = ["Password baru minimal 8 karakter"];
    if (baru !== konfirmasi) errors.konfirmasi = ["Konfirmasi tidak sama"];
    if (errors.lama || errors.baru || errors.konfirmasi) return { errors };

    try {
        const rows = await query<{ password: string }>("SELECT password FROM users WHERE id = $1", [id]);
        if (!rows[0] || !verifyPassword(lama, rows[0].password)) {
            return { errors: { lama: ["Password lama salah"] } };
        }
        await query("UPDATE users SET password = $1 WHERE id = $2", [hashPassword(baru), id]);
        await catatAksi({ userId: id, username, aksi: "ganti_password", detail: "Password diganti" });
    } catch (err) {
        console.error("Gagal ganti password:", err);
        return { errors: { umum: ["Gagal menyimpan, coba lagi"] } };
    }

    return { berhasil: true };
}
