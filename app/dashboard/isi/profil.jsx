"use client";

import { useActionState } from "react";
import { gantiPassword } from "@/app/actions/auth";
import { LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_KARTU, PesanGagal } from "./util";

export default function Profil() {
    const user = useUser();
    const [state, action, pending] = useActionState(gantiPassword, undefined);

    return (
        <div className="flex flex-col gap-6 max-w-xl">
            <div className={`${KELAS_KARTU} flex flex-col gap-1`}>
                <span className="text-[13px] font-normal tracking-[-0.39px] text-ink-mute">Masuk sebagai</span>
                <span className="text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-ink">{user.username}</span>
                <span className="text-[14px] text-ink-secondary">Divisi: {LABEL_DIVISI[user.divisi]}</span>
            </div>

            <form action={action} className={`${KELAS_KARTU} flex flex-col gap-3`}>
                <h2 className="text-[18px] font-normal tracking-[-0.2px] text-ink">Ganti Password</h2>
                <PesanGagal pesan={state?.errors?.umum} />
                <div className="flex flex-col gap-2">
                    <label className={KELAS_LABEL}>Password Lama</label>
                    <input name="lama" type="password" autoComplete="current-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.lama} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className={KELAS_LABEL}>Password Baru</label>
                    <input name="baru" type="password" autoComplete="new-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.baru} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className={KELAS_LABEL}>Ulangi Password Baru</label>
                    <input name="konfirmasi" type="password" autoComplete="new-password" className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.konfirmasi} />
                </div>
                <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} self-start`}>
                    {pending ? "Menyimpan..." : "Simpan Password"}
                </button>
                {state?.berhasil && <p className="text-[13px] text-emerald-700">Password berhasil diganti.</p>}
            </form>
        </div>
    );
}
