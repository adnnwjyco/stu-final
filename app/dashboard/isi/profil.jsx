"use client";

import { useActionState } from "react";
import { gantiPassword } from "@/app/actions/auth";
import { LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, PesanGagal } from "./util";

export default function Profil() {
    const user = useUser();
    const [state, action, pending] = useActionState(gantiPassword, undefined);

    return (
        <div className="flex flex-col gap-6 max-w-xl">
            <div className="bg-white border border-slate-200 p-4 flex flex-col gap-1">
                <span className="text-sm text-slate-400">Masuk sebagai</span>
                <span className="text-lg">{user.username}</span>
                <span className="text-sm text-slate-500">Divisi: {LABEL_DIVISI[user.divisi]}</span>
            </div>

            <form action={action} className="bg-white border border-slate-200 p-4 flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-slate-600">Ganti Password</h2>
                <PesanGagal pesan={state?.errors?.umum} />
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Password Lama</label>
                    <input name="lama" type="password" autoComplete="current-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.lama} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Password Baru</label>
                    <input name="baru" type="password" autoComplete="new-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.baru} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Ulangi Password Baru</label>
                    <input name="konfirmasi" type="password" autoComplete="new-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.konfirmasi} />
                </div>
                <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} self-start`}>
                    {pending ? "Menyimpan..." : "Simpan Password"}
                </button>
                {state?.berhasil && <p className="text-sm text-emerald-700">Password berhasil diganti.</p>}
            </form>
        </div>
    );
}
