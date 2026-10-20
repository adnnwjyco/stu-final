"use client";

import { useActionState, useEffect, useState } from "react";
import { tambahPelanggan, ubahPelanggan, hapusPelanggan } from "@/app/actions/pelanggan";
import { bolehAksi, LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { Kosong, KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_TOMBOL_KECIL, PesanGagal, PesanBerhasil, Overlay, BadgeStatus, ProgressBar, formatTanggal } from "./util";

export function KelolaPelanggan({ onTambah }) {
    const user = useUser();
    const bolehKelola = bolehAksi(user.divisi, "kelola_pelanggan");

    const [daftar, setDaftar] = useState(null);
    const [cari, setCari] = useState("");
    const [idEdit, setIdEdit] = useState(null);
    const [idDetail, setIdDetail] = useState(null);
    const [gagal, setGagal] = useState(false);
    const [muat, setMuat] = useState(0);

    const segarkan = () => setMuat((n) => n + 1);

    useEffect(() => {
        let batal = false;
        fetch("/api/pelanggan")
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

    if (gagal) return <p className="text-sm text-red-600">Gagal memuat pelanggan.</p>;
    if (!daftar) return <p className="text-sm text-slate-400">Memuat pelanggan...</p>;

    const terfilter = daftar.filter(
        (p) =>
            !cari ||
            String(p.nama).toLowerCase().includes(cari.toLowerCase()) ||
            String(p.nomor_telepon ?? "").toLowerCase().includes(cari.toLowerCase()) ||
            String(p.email ?? "").toLowerCase().includes(cari.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Cari nama / telepon / email..."
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    className={`${KELAS_INPUT} w-64`}
                />
                <span className="text-sm text-slate-400 ml-auto">{terfilter.length} pelanggan</span>
                {bolehKelola && (
                    <button type="button" onClick={onTambah} className={KELAS_TOMBOL}>
                        + Tambah Pelanggan
                    </button>
                )}
            </div>

            {terfilter.length === 0 ? (
                <Kosong pesan="Tidak ada pelanggan yang cocok." />
            ) : (
                <div className="overflow-x-auto bg-white border border-slate-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500 bg-slate-100 border-b border-slate-200">
                                <th className="p-2 font-medium">Nama</th>
                                <th className="p-2 font-medium">Telepon</th>
                                <th className="p-2 font-medium">Email</th>
                                {bolehKelola && <th className="p-2 font-medium">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {terfilter.map((p) => (
                                <PelangganBaris
                                    key={p.id}
                                    row={p}
                                    bolehKelola={bolehKelola}
                                    idEdit={idEdit}
                                    setIdEdit={setIdEdit}
                                    setIdDetail={setIdDetail}
                                    segarkan={segarkan}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {idDetail && <DetailPelanggan id={idDetail} onTutup={() => setIdDetail(null)} />}
        </div>
    );
}

function PelangganBaris({ row, bolehKelola, idEdit, setIdEdit, setIdDetail, segarkan }) {
    const terbuka = idEdit === row.id;

    const hapus = async () => {
        const fd = new FormData();
        fd.set("id", row.id);
        const hasil = await hapusPelanggan(fd);
        if (hasil?.errors) alert(hasil.errors[0]);
        else segarkan();
    };

    return (
        <>
            <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2">{row.nama}</td>
                <td className="p-2 whitespace-nowrap">{row.nomor_telepon || "-"}</td>
                <td className="p-2">{row.email || "-"}</td>
                {bolehKelola && (
                    <td className="p-2 flex gap-2">
                        <button type="button" onClick={() => setIdDetail(row.id)} className={KELAS_TOMBOL_KECIL}>
                            Detail
                        </button>
                        <button type="button" onClick={() => setIdEdit(terbuka ? null : row.id)} className={KELAS_TOMBOL_KECIL}>
                            {terbuka ? "Tutup" : "Ubah"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm(`Hapus pelanggan "${row.nama}"?`)) hapus();
                            }}
                            className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                        >
                            Hapus
                        </button>
                    </td>
                )}
            </tr>
            {terbuka && bolehKelola && (
                <tr>
                    <td colSpan={4}>
                        <FormUbahPelanggan
                            row={row}
                            onSelesai={() => {
                                setIdEdit(null);
                                segarkan();
                            }}
                        />
                    </td>
                </tr>
            )}
        </>
    );
}

function DetailPelanggan({ id, onTutup }) {
    const [data, setData] = useState(null);
    const [gagal, setGagal] = useState(false);

    useEffect(() => {
        let batal = false;
        fetch(`/api/pelanggan?id=${encodeURIComponent(id)}`)
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((j) => {
                if (!batal) setData(j);
            })
            .catch(() => {
                if (!batal) setGagal(true);
            });
        return () => {
            batal = true;
        };
    }, [id]);

    return (
        <Overlay judul="Detail Pelanggan" onTutup={onTutup}>
            {gagal ? (
                <p className="text-sm text-red-600">Gagal memuat detail pelanggan.</p>
            ) : !data ? (
                <p className="text-sm text-slate-400">Memuat detail pelanggan...</p>
            ) : (
                <>
                    <div className="flex flex-col gap-1">
                        <p className="text-base font-semibold text-slate-700">{data.nama}</p>
                        <p className="text-sm text-slate-500">Telepon: {data.nomor_telepon || "-"}</p>
                        <p className="text-sm text-slate-500">Email: {data.email || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-slate-600">Histori Job Order ({data.riwayat.length})</h3>
                        {data.riwayat.length === 0 ? (
                            <Kosong pesan="Belum ada job order untuk pelanggan ini." />
                        ) : (
                            <div className="overflow-x-auto border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-slate-500 bg-slate-100 border-b border-slate-200">
                                            <th className="p-2 font-medium">Nomor</th>
                                            <th className="p-2 font-medium">Terima</th>
                                            <th className="p-2 font-medium">Selesai</th>
                                            <th className="p-2 font-medium">Divisi</th>
                                            <th className="p-2 font-medium">Persentase</th>
                                            <th className="p-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.riwayat.map((jo) => (
                                            <tr key={jo.nomor} className="border-b border-slate-100">
                                                <td className="p-2 font-mono text-xs whitespace-nowrap">{jo.nomor}</td>
                                                <td className="p-2 whitespace-nowrap">{formatTanggal(jo.tanggal_terima)}</td>
                                                <td className="p-2 whitespace-nowrap">{formatTanggal(jo.tanggal_selesai)}</td>
                                                <td className="p-2 whitespace-nowrap text-xs">
                                                    {jo.divisi_pengerjaan ? (
                                                        LABEL_DIVISI[jo.divisi_pengerjaan]
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <ProgressBar persentase={jo.persentase} />
                                                </td>
                                                <td className="p-2">
                                                    <BadgeStatus status={jo.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </Overlay>
    );
}

function FormUbahPelanggan({ row, onSelesai }) {
    const bungkus = async (prev, formData) => {
        const hasil = await ubahPelanggan(prev, formData);
        if (hasil?.berhasil) onSelesai();
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form action={action} className="flex flex-col gap-2 p-2 bg-slate-50 border-t border-slate-200">
            <input type="hidden" name="id" value={row.id} />
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Nama</label>
                    <input name="nama" type="text" defaultValue={row.nama} className={KELAS_INPUT} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Telepon</label>
                    <input name="nomor_telepon" type="text" defaultValue={row.nomor_telepon ?? ""} className={KELAS_INPUT} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Email</label>
                    <input name="email" type="text" defaultValue={row.email ?? ""} className={KELAS_INPUT} />
                </div>
                <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                    {pending ? "Menyimpan..." : "Simpan"}
                </button>
            </div>
            <PesanGagal pesan={state?.errors?.umum ?? state?.errors?.nama ?? state?.errors?.nomor_telepon ?? state?.errors?.email} />
        </form>
    );
}

export function TambahPelanggan() {
    const [state, action, pending] = useActionState(tambahPelanggan, undefined);

    useEffect(() => {
        if (state?.berhasil) document.getElementById("form-tambah-pelanggan")?.reset();
    }, [state]);

    return (
        <form id="form-tambah-pelanggan" action={action} className="bg-white border border-slate-200 p-4 flex flex-col gap-3 max-w-xl">
            <PesanGagal pesan={state?.errors?.umum} />
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Nama</label>
                <input name="nama" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.nama} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Nomor Telepon</label>
                <input name="nomor_telepon" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.nomor_telepon} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Email</label>
                <input name="email" type="email" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.email} />
            </div>
            <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} self-start`}>
                {pending ? "Menyimpan..." : "Tambah Pelanggan"}
            </button>
            <PesanBerhasil tampil={state?.berhasil} />
        </form>
    );
}
