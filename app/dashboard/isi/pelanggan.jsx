"use client";

import { useActionState, useEffect, useState } from "react";
import { tambahPelanggan, ubahPelanggan, hapusPelanggan } from "@/app/actions/pelanggan";
import { bolehAksi, LABEL_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { Kosong, Memuat, KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_TOMBOL_KECIL, KELAS_TOMBOL_DANGER, KELAS_KARTU, PesanGagal, PesanBerhasil, Overlay, KonfirmasiHapus, BadgeStatus, ProgressBar, formatTanggal } from "./util";

export function KelolaPelanggan({ onTambah }) {
    const user = useUser();
    const bolehKelola = bolehAksi(user.divisi, "kelola_pelanggan");

    const [daftar, setDaftar] = useState(null);
    const [cari, setCari] = useState("");
    const [idEdit, setIdEdit] = useState(null);
    const [idDetail, setIdDetail] = useState(null);
    const [gagal, setGagal] = useState(false);
    const [muat, setMuat] = useState(0);
    const [rowHapus, setRowHapus] = useState(null);
    const [hapusPending, setHapusPending] = useState(false);
    const [hapusError, setHapusError] = useState(null);

    const segarkan = () => setMuat((n) => n + 1);

    const konfirmasiHapus = async () => {
        if (!rowHapus) return;
        setHapusPending(true);
        setHapusError(null);
        const fd = new FormData();
        fd.set("id", rowHapus.id);
        const hasil = await hapusPelanggan(fd);
        setHapusPending(false);
        if (hasil?.errors) {
            setHapusError(hasil.errors[0]);
        } else {
            setRowHapus(null);
            segarkan();
        }
    };

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

    if (gagal) return <p className="text-[14px] text-ruby">Gagal memuat pelanggan.</p>;
    if (!daftar) return <Memuat />;

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
                <span className="tnum text-[13px] text-ink-mute ml-auto">{terfilter.length} pelanggan</span>
                {bolehKelola && (
                    <button type="button" onClick={onTambah} className={KELAS_TOMBOL}>
                        + Tambah Pelanggan
                    </button>
                )}
            </div>

            {terfilter.length === 0 ? (
                <Kosong pesan="Tidak ada pelanggan yang cocok." />
            ) : (
                <div className="overflow-x-auto bg-canvas border border-hairline rounded-xl shadow-lift-1">
                    <table className="w-full text-[14px]">
                        <thead>
                            <tr className="text-left text-ink-mute bg-canvas-soft border-b border-hairline">
                                <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Nama</th>
                                <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Telepon</th>
                                <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Email</th>
                                {bolehKelola && <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Aksi</th>}
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
                                    onMintaHapus={() => {
                                        setHapusError(null);
                                        setRowHapus(p);
                                    }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {rowHapus && (
                <KonfirmasiHapus
                    judul="Hapus Pelanggan"
                    pesan={`Hapus pelanggan "${rowHapus.nama}"? Pelanggan hanya dapat dihapus jika belum memiliki job order. Data tidak dapat dikembalikan.`}
                    onBatal={() => setRowHapus(null)}
                    onHapus={konfirmasiHapus}
                    pending={hapusPending}
                    error={hapusError}
                />
            )}

            {idDetail && <DetailPelanggan id={idDetail} onTutup={() => setIdDetail(null)} />}
        </div>
    );
}

function PelangganBaris({ row, bolehKelola, idEdit, setIdEdit, setIdDetail, segarkan, onMintaHapus }) {
    const terbuka = idEdit === row.id;

    return (
        <>
            <tr className="border-b border-hairline last:border-0 hover:bg-canvas-soft transition-colors duration-200">
                <td className="p-3">{row.nama}</td>
                <td className="p-3 tnum whitespace-nowrap">{row.nomor_telepon || "-"}</td>
                <td className="p-3">{row.email || "-"}</td>
                {bolehKelola && (
                    <td className="p-3">
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIdDetail(row.id)} className={KELAS_TOMBOL_KECIL}>
                                Detail
                            </button>
                            <button type="button" onClick={() => setIdEdit(terbuka ? null : row.id)} className={KELAS_TOMBOL_KECIL}>
                                {terbuka ? "Tutup" : "Ubah"}
                            </button>
                            <button type="button" onClick={onMintaHapus} className={KELAS_TOMBOL_DANGER}>
                                Hapus
                            </button>
                        </div>
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
                <p className="text-[14px] text-ruby">Gagal memuat detail pelanggan.</p>
            ) : !data ? (
                <Memuat area />
            ) : (
                <>
                    <div className="flex flex-col gap-1">
                        <p className="text-[18px] font-normal tracking-[-0.2px] text-ink">{data.nama}</p>
                        <p className="tnum text-[14px] text-ink-mute">Telepon: {data.nomor_telepon || "-"}</p>
                        <p className="text-[14px] text-ink-mute">Email: {data.email || "-"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute">
                            Histori Job Order ({data.riwayat.length})
                        </h3>
                        {data.riwayat.length === 0 ? (
                            <Kosong pesan="Belum ada job order untuk pelanggan ini." />
                        ) : (
                            <div className="overflow-x-auto border border-hairline rounded-lg">
                                <table className="w-full text-[14px] tnum">
                                    <thead>
                                        <tr className="text-left text-ink-mute bg-canvas-soft border-b border-hairline">
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Nomor</th>
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Terima</th>
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Selesai</th>
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Divisi</th>
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Persentase</th>
                                            <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.riwayat.map((jo) => (
                                            <tr key={jo.nomor} className="border-b border-hairline last:border-0">
                                                <td className="p-3 tnum text-[13px] text-ink-secondary whitespace-nowrap">{jo.nomor}</td>
                                                <td className="p-3 tnum whitespace-nowrap text-ink-mute">{formatTanggal(jo.tanggal_terima)}</td>
                                                <td className="p-3 tnum whitespace-nowrap text-ink-mute">{formatTanggal(jo.tanggal_selesai)}</td>
                                                <td className="p-3 whitespace-nowrap text-[13px]">
                                                    {jo.divisi_pengerjaan ? LABEL_DIVISI[jo.divisi_pengerjaan] : <span className="text-ink-mute">-</span>}
                                                </td>
                                                <td className="p-3">
                                                    <ProgressBar persentase={jo.persentase} />
                                                </td>
                                                <td className="p-3">
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
        <form action={action} className="flex flex-col gap-3 p-4 bg-canvas-soft border-t border-hairline rounded-b-xl">
            <input type="hidden" name="id" value={row.id} />
            <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-2">
                    <label className={KELAS_LABEL}>Nama</label>
                    <input name="nama" type="text" defaultValue={row.nama} className={KELAS_INPUT} />
                </div>
                <div className="flex flex-col gap-2">
                    <label className={KELAS_LABEL}>Telepon</label>
                    <input name="nomor_telepon" type="text" defaultValue={row.nomor_telepon ?? ""} className={KELAS_INPUT} />
                </div>
                <div className="flex flex-col gap-2">
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
        <form id="form-tambah-pelanggan" action={action} className={`${KELAS_KARTU} flex flex-col gap-3 max-w-xl`}>
            <PesanGagal pesan={state?.errors?.umum} />
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Nama</label>
                <input name="nama" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.nama} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Nomor Telepon</label>
                <input name="nomor_telepon" type="text" className={KELAS_INPUT} />
                <PesanGagal pesan={state?.errors?.nomor_telepon} />
            </div>
            <div className="flex flex-col gap-2">
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
