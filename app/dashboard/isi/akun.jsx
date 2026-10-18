"use client";

import { useActionState, useEffect, useState } from "react";
import { tambahAkun, ubahDivisiAkun, resetPasswordAkun, hapusAkun } from "@/app/actions/akun";
import { DAFTAR_DIVISI, LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { Kosong, KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_TOMBOL_KECIL, PesanGagal, PesanBerhasil } from "./util";

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

    if (gagal) return <p className="text-sm text-red-600">Gagal memuat daftar akun.</p>;

    return (
        <div className="flex flex-col gap-6">
            <FormTambahAkun segarkan={segarkan} />

            <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-slate-600">Daftar Akun</h2>
                {!daftar ? (
                    <p className="text-sm text-slate-400">Memuat akun...</p>
                ) : daftar.length === 0 ? (
                    <Kosong pesan="Belum ada akun." />
                ) : (
                    <div className="overflow-x-auto bg-white border border-slate-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 bg-slate-100 border-b border-slate-200">
                                    <th className="p-2 font-medium">Username</th>
                                    <th className="p-2 font-medium">Divisi</th>
                                    <th className="p-2 font-medium">Aksi</th>
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
        <tr className="border-b border-slate-100 align-top">
            <td className="p-2">
                {akun.username}
                {sendiri && <span className="ml-2 text-xs text-slate-400">(Anda)</span>}
            </td>
            <td className="p-2">
                <form action={actionDivisi} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={akun.id} />
                    <select name="divisi" defaultValue={akun.divisi} disabled={sendiri} className={`${KELAS_INPUT} py-1`}>
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
                {stateDivisi?.errors && <p className="text-xs text-red-600 mt-1">{stateDivisi.errors[0]}</p>}
            </td>
            <td className="p-2">
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
                                className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                            >
                                Hapus
                            </button>
                        </>
                    )}
                </div>
                {resetTerbuka && (
                    <form action={actionReset} className="mt-2 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={akun.id} />
                        <input name="password" type="text" placeholder="Password baru" className={`${KELAS_INPUT} py-1 w-40`} />
                        <button type="submit" disabled={pendingReset} className={KELAS_TOMBOL_KECIL}>
                            {pendingReset ? "..." : "Ubah"}
                        </button>
                        {stateReset?.errors && <p className="text-xs text-red-600">{stateReset.errors[0]}</p>}
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
        <form id="form-tambah-akun" action={action} className="bg-white border border-slate-200 p-4 flex flex-col gap-3 max-w-xl">
            <h2 className="text-sm font-semibold text-slate-600">Tambah Akun</h2>
            <PesanGagal pesan={state?.errors?.umum} />
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Username</label>
                <input name="username" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.username} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Password</label>
                <input name="password" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.password} />
            </div>
            <div className="flex flex-col gap-1">
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
