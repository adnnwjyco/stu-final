"use client";

import { useActionState, useEffect, useState } from "react";
import { tambahAkun, ubahDivisiAkun, resetPasswordAkun, hapusAkun } from "@/app/actions/akun";
import { DAFTAR_DIVISI, LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { Kosong, Memuat, KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_TOMBOL_KECIL, KELAS_TOMBOL_DANGER, KELAS_KARTU, PesanGagal, PesanBerhasil } from "./util";

export default function KelolaAkun() {
    const user = useUser();
    const [daftar, setDaftar] = useState(null);
    const [gagal, setGagal] = useState(false);
    const [muat, setMuat] = useState(0);

    const segarkan = () => setMuat((n) => n + 1);

    useEffect(() => {
        let batal = false;
        fetch("/api/akun")
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((j) => {
                if (!batal) setDaftar(j);
            })
            .catch(() => {
                if (!batal) setGagal(true);
            });
        return () => {
            batal = true;
        };
    }, [muat]);

    if (gagal) return <p className="text-[14px] text-ruby">Gagal memuat daftar akun.</p>;

    return (
        <div className="flex flex-col gap-6">
            <FormTambahAkun segarkan={segarkan} />

            <div className="flex flex-col gap-2">
                <h2 className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute">Daftar Akun</h2>
                {!daftar ? (
                    <Memuat area />
                ) : daftar.length === 0 ? (
                    <Kosong pesan="Belum ada akun." />
                ) : (
                    <div className="overflow-x-auto bg-canvas border border-hairline rounded-xl shadow-lift-1">
                        <table className="w-full text-[14px]">
                            <thead>
                                <tr className="text-left text-ink-mute bg-canvas-soft border-b border-hairline">
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Username</th>
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Divisi</th>
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daftar.map((akun) => (
                                    <AkunBaris key={akun.id} akun={akun} sendiri={akun.id === user.id} segarkan={segarkan} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function AkunBaris({ akun, sendiri, segarkan }) {
    const [resetTerbuka, setResetTerbuka] = useState(false);

    const bungkusDivisi = async (prev, formData) => {
        const hasil = await ubahDivisiAkun(formData);
        if (hasil?.berhasil) segarkan();
        return hasil;
    };
    const bungkusReset = async (prev, formData) => {
        const hasil = await resetPasswordAkun(formData);
        if (hasil?.berhasil) {
            segarkan();
            setResetTerbuka(false);
        }
        return hasil;
    };
    const [stateDivisi, actionDivisi, pendingDivisi] = useActionState(bungkusDivisi, undefined);
    const [stateReset, actionReset, pendingReset] = useActionState(bungkusReset, undefined);

    const hapus = async () => {
        const fd = new FormData();
        fd.set("id", akun.id);
        const hasil = await hapusAkun(fd);
        if (hasil?.errors) alert(hasil.errors[0]);
        else segarkan();
    };

    return (
        <tr className="border-b border-hairline last:border-0 align-top hover:bg-canvas-soft transition-colors duration-200">
            <td className="p-3">
                {akun.username}
                {sendiri && <span className="ml-2 text-[11px] text-ink-mute">(Anda)</span>}
            </td>
            <td className="p-3">
                <form action={actionDivisi} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={akun.id} />
                    <select name="divisi" defaultValue={akun.divisi} disabled={sendiri} className={`${KELAS_INPUT} py-1.5`}>
                        {DAFTAR_DIVISI.map((d) => (
                            <option key={d} value={d}>
                                {LABEL_DIVISI[d]}
                            </option>
                        ))}
                    </select>
                    {!sendiri && (
                        <button type="submit" disabled={pendingDivisi} className={KELAS_TOMBOL_KECIL}>
                            {pendingDivisi ? "..." : "Simpan"}
                        </button>
                    )}
                </form>
                {stateDivisi?.errors && <p className="text-[11px] text-ruby mt-1">{stateDivisi.errors[0]}</p>}
            </td>
            <td className="p-3">
                <div className="flex flex-wrap gap-2">
                    {!sendiri && (
                        <>
                            <button type="button" onClick={() => setResetTerbuka((v) => !v)} className={KELAS_TOMBOL_KECIL}>
                                {resetTerbuka ? "Batal" : "Reset Password"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(`Hapus akun "${akun.username}"?`)) hapus();
                                }}
                                className={KELAS_TOMBOL_DANGER}
                            >
                                Hapus
                            </button>
                        </>
                    )}
                </div>
                {resetTerbuka && (
                    <form action={actionReset} className="mt-2 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={akun.id} />
                        <input name="password" type="text" placeholder="Password baru" className={`${KELAS_INPUT} py-1.5 w-40`} />
                        <button type="submit" disabled={pendingReset} className={KELAS_TOMBOL_KECIL}>
                            {pendingReset ? "..." : "Ubah"}
                        </button>
                        {stateReset?.errors && <p className="text-[11px] text-ruby">{stateReset.errors[0]}</p>}
                    </form>
                )}
            </td>
        </tr>
    );
}

function FormTambahAkun({ segarkan }) {
    const bungkus = async (prev, formData) => {
        const hasil = await tambahAkun(prev, formData);
        if (hasil?.berhasil) {
            segarkan();
            document.getElementById("form-tambah-akun")?.reset();
        }
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form id="form-tambah-akun" action={action} className={`${KELAS_KARTU} flex flex-col gap-3 max-w-xl`}>
            <h2 className="text-[18px] font-normal tracking-[-0.2px] text-ink">Tambah Akun</h2>
            <PesanGagal pesan={state?.errors?.umum} />
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Username</label>
                <input name="username" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.username} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Password</label>
                <input name="password" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.password} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Divisi</label>
                <select name="divisi" defaultValue="operasional" className={KELAS_INPUT}>
                    {DAFTAR_DIVISI.map((d) => (
                        <option key={d} value={d}>
                            {LABEL_DIVISI[d]}
                        </option>
                    ))}
                </select>
                <PesanGagal pesan={state?.errors?.divisi} />
            </div>
            <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} self-start`}>
                {pending ? "Menyimpan..." : "Tambah Akun"}
            </button>
            <PesanBerhasil tampil={state?.berhasil} />
        </form>
    );
}
