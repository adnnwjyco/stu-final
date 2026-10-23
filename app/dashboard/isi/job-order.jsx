"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
    tambahJobOrder,
    ubahProgress,
    terimaJo,
    serahTerima,
    pindahDivisi,
    batalkanJo,
    tambahProduk,
    ubahProduk,
    hapusProduk,
    hapusJo,
} from "@/app/actions/job-order";
import { bolehAksi, bolehKelolaJo, divisiSetelah, LABEL_DIVISI, DAFTAR_DIVISI } from "@/lib/akses";
import { useUser } from "../user-provider";
import { BadgeStatus, ProgressBar, Kosong, KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL, KELAS_TOMBOL_KECIL, PesanGagal, PesanBerhasil, KonfirmasiHapus, formatTanggal } from "./util";

const DAFTAR_STATUS = ["pending", "proses", "selesai", "dibatalkan"];

export function KelolaJobOrder({ onTambah }) {
    const user = useUser();
    const bolehTambah = bolehAksi(user.divisi, "tambah_job_order");
    const lihatSemua = bolehAksi(user.divisi, "lihat_semua_job_order");
    const admin = user.divisi === "admin";

    const [daftar, setDaftar] = useState(null);
    const [cari, setCari] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [idBuka, setIdBuka] = useState(null);
    const [gagal, setGagal] = useState(false);
    const [muat, setMuat] = useState(0);
    const [rowHapus, setRowHapus] = useState(null);
    const [hapusPending, setHapusPending] = useState(false);
    const [hapusError, setHapusError] = useState(null);

    const segarkan = () => setMuat((n) => n + 1);

    const mintaHapus = (row) => {
        setHapusError(null);
        setRowHapus(row);
    };

    const konfirmasiHapus = async () => {
        if (!rowHapus) return;
        setHapusPending(true);
        setHapusError(null);
        const fd = new FormData();
        fd.set("nomor", rowHapus.nomor);
        const hasil = await hapusJo(fd);
        setHapusPending(false);
        if (hasil?.errors) {
            setHapusError(hasil.errors[0]);
        } else {
            setRowHapus(null);
            setIdBuka(null);
            segarkan();
        }
    };

    useEffect(() => {
        let batal = false;
        fetch("/api/job-orders")
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

    if (gagal) return <p className="text-sm text-red-600">Gagal memuat job order.</p>;
    if (!daftar) return <p className="text-sm text-slate-400">Memuat job order...</p>;

    const terfilter = daftar.filter(
        (jo) =>
            (!statusFilter || jo.status === statusFilter) &&
            (!cari || jo.nomor.toLowerCase().includes(cari.toLowerCase()) || String(jo.nama_pelanggan).toLowerCase().includes(cari.toLowerCase()))
    );

    const kolomLebar = lihatSemua ? 8 : 7;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Cari nomor JO / nama pelanggan..."
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    className={`${KELAS_INPUT} w-64`}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={KELAS_INPUT}>
                    <option value="">Semua status</option>
                    {DAFTAR_STATUS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <span className="text-sm text-slate-400 ml-auto">{terfilter.length} job order</span>
                {bolehTambah && (
                    <button type="button" onClick={onTambah} className={KELAS_TOMBOL}>
                        + Tambah Job Order
                    </button>
                )}
            </div>

            {terfilter.length === 0 ? (
                <Kosong pesan="Tidak ada job order yang cocok." />
            ) : (
                <div className="overflow-x-auto bg-white border border-slate-200">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500 bg-slate-100 border-b border-slate-200">
                                <th className="p-2 font-medium">Nomor</th>
                                <th className="p-2 font-medium">Pelanggan</th>
                                <th className="p-2 font-medium">Terima</th>
                                <th className="p-2 font-medium">Selesai</th>
                                {lihatSemua && <th className="p-2 font-medium">Divisi</th>}
                                <th className="p-2 font-medium">Persentase</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {terfilter.map((jo) => (
                                <JobOrderBaris
                                    key={jo.nomor}
                                    row={jo}
                                    kolom={kolomLebar}
                                    lihatSemua={lihatSemua}
                                    idBuka={idBuka}
                                    setIdBuka={setIdBuka}
                                    segarkan={segarkan}
                                    admin={admin}
                                    onMintaHapus={mintaHapus}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {rowHapus && (
                <KonfirmasiHapus
                    judul="Hapus Job Order"
                    pesan={`Hapus job order ${rowHapus.nomor} (${rowHapus.nama_pelanggan}) secara permanen? Seluruh data produk ikut terhapus dan tidak dapat dikembalikan.`}
                    onBatal={() => setRowHapus(null)}
                    onHapus={konfirmasiHapus}
                    pending={hapusPending}
                    error={hapusError}
                />
            )}
        </div>
    );
}

function JobOrderBaris({ row, kolom, lihatSemua, idBuka, setIdBuka, segarkan, admin, onMintaHapus }) {
    const terbuka = idBuka === row.nomor;
    const menunggu = row.status !== "selesai" && row.status !== "dibatalkan" && row.menunggu_terima;

    return (
        <>
            <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-2 font-mono text-xs whitespace-nowrap">{row.nomor}</td>
                <td className="p-2">{row.nama_pelanggan}</td>
                <td className="p-2 whitespace-nowrap">{formatTanggal(row.tanggal_terima)}</td>
                <td className="p-2 whitespace-nowrap">{formatTanggal(row.tanggal_selesai)}</td>
                {lihatSemua && (
                    <td className="p-2 whitespace-nowrap text-xs">
                        {row.divisi_pengerjaan ? LABEL_DIVISI[row.divisi_pengerjaan] : <span className="text-slate-400">—</span>}
                    </td>
                )}
                <td className="p-2">
                    <ProgressBar persentase={row.persentase} />
                </td>
                <td className="p-2">
                    <BadgeStatus status={row.status} />
                    {menunggu && <span className="block mt-1 px-2 py-0.5 border border-amber-300 bg-amber-100 text-amber-700 text-xs whitespace-nowrap">Menunggu terima</span>}
                </td>
                <td className="p-2 flex gap-2">
                    <button type="button" onClick={() => setIdBuka(terbuka ? null : row.nomor)} className={KELAS_TOMBOL_KECIL}>
                        {terbuka ? "Tutup" : "Detail"}
                    </button>
                    {admin && (
                        <button
                            type="button"
                            onClick={() => onMintaHapus(row)}
                            className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                        >
                            Hapus
                        </button>
                    )}
                </td>
            </tr>
            {terbuka && (
                <tr>
                    <td colSpan={kolom}>
                        <PanelJo row={row} segarkan={segarkan} />
                    </td>
                </tr>
            )}
        </>
    );
}

function PanelJo({ row, segarkan }) {
    const user = useUser();
    const bolehKelola = bolehKelolaJo(user.divisi, row.divisi_pengerjaan);
    const admin = user.divisi === "admin";
    const aktif = row.status !== "selesai" && row.status !== "dibatalkan" && row.divisi_pengerjaan !== null;
    const berikut = row.divisi_pengerjaan ? divisiSetelah(row.divisi_pengerjaan) : null;
    const penerima = row.divisi_pengerjaan !== null && user.divisi === row.divisi_pengerjaan;
    const perluTerima = aktif && row.menunggu_terima && penerima;
    const menungguInfo = aktif && row.menunggu_terima && !penerima;
    const sudahDiterima = bolehKelola && aktif && !row.menunggu_terima;

    return (
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-4">
            {perluTerima && (
                <div className="bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-amber-800">Menunggu penerimaan</p>
                        <p className="text-xs text-amber-700">
                            Job order ini dititipkan ke divisi Anda. Klik &quot;Terima&quot; untuk mulai mengerjakan — durasi
                            dihitung sejak diterima sampai diserahkan ke divisi berikutnya.
                        </p>
                    </div>
                    <FormTerima row={row} segarkan={segarkan} />
                </div>
            )}

            {menungguInfo && (
                <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                    Menunggu konfirmasi penerimaan oleh {LABEL_DIVISI[row.divisi_pengerjaan]}.
                </div>
            )}

            {sudahDiterima && row.diterima_pada && (
                <div className="flex flex-wrap items-center gap-3 text-xs bg-white border border-slate-200 px-3 py-2 self-start">
                    <span className="text-slate-500">Diterima {formatTanggal(row.diterima_pada)}</span>
                    <DurasiDivisi sejak={row.diterima_pada} />
                </div>
            )}

            <div className="flex flex-wrap gap-6 items-start">
                {bolehKelola && aktif && !row.menunggu_terima && <FormProgress row={row} segarkan={segarkan} />}
                {bolehKelola && aktif && !row.menunggu_terima && <FormSerahTerima row={row} berikut={berikut} segarkan={segarkan} />}
                {admin && aktif && <FormAdminJo row={row} segarkan={segarkan} />}
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-slate-600">Produk</h3>
                {row.produk.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada produk.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {row.produk.map((p) => (
                            <ItemProduk key={p.id} produk={p} bolehKelola={bolehKelola && !row.menunggu_terima} segarkan={segarkan} />
                        ))}
                    </ul>
                )}
                {bolehKelola && !row.menunggu_terima && row.status !== "dibatalkan" && <FormTambahProduk nomor={row.nomor} segarkan={segarkan} />}
            </div>
        </div>
    );
}

function FormTerima({ row, segarkan }) {
    const bungkus = async (prev, formData) => {
        const hasil = await terimaJo(prev, formData);
        if (hasil?.berhasil) segarkan();
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form action={action} className="flex flex-col gap-1">
            <input type="hidden" name="nomor" value={row.nomor} />
            <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                {pending ? "Memproses..." : "✓ Terima Job Order"}
            </button>
            {state?.errors?.umum && <PesanGagal pesan={state.errors.umum} />}
            {state?.pesan && <span className="text-xs text-emerald-700">{state.pesan}</span>}
        </form>
    );
}

function DurasiDivisi({ sejak }) {
    const [kini, setKini] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setKini(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const mulai = new Date(sejak).getTime();
    if (Number.isNaN(mulai)) return null;

    const total = Math.max(0, kini - mulai);
    const menit = Math.floor(total / 60000);
    const jam = Math.floor(menit / 60);
    const hari = Math.floor(jam / 24);
    const teks = hari > 0 ? `${hari}h ${jam % 24}j ${menit % 60}m` : jam > 0 ? `${jam}j ${menit % 60}m` : `${menit}m`;

    return (
        <span className="text-xs text-slate-500">
            Durasi di divisi ini: <span className="font-mono font-semibold text-slate-700">{teks}</span>
        </span>
    );
}

function FormProgress({ row, segarkan }) {
    const bungkus = async (prev, formData) => {
        const hasil = await ubahProgress(prev, formData);
        if (hasil?.berhasil) segarkan();
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form action={action} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="nomor" value={row.nomor} />
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Persentase</label>
                <input type="number" name="persentase" min="0" max="100" required defaultValue={row.persentase} className={`${KELAS_INPUT} w-24`} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Status</label>
                <select name="status" defaultValue={row.status === "pending" ? "pending" : "proses"} className={KELAS_INPUT}>
                    <option value="pending">pending</option>
                    <option value="proses">proses</option>
                </select>
            </div>
            <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                {pending ? "Menyimpan..." : "Update Progress"}
            </button>
            <PesanGagal pesan={state?.errors?.umum ?? state?.errors?.persentase ?? state?.errors?.status} />
            {state?.pesan && <span className="text-sm text-emerald-700">{state.pesan}</span>}
        </form>
    );
}

function FormSerahTerima({ row, berikut, segarkan }) {
    const bungkus = async (prev, formData) => {
        const hasil = await serahTerima(prev, formData);
        if (hasil?.berhasil) segarkan();
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);
    const label = berikut ? `Serah Terima ke ${LABEL_DIVISI[berikut]}` : "Tandai Selesai";

    return (
        <form action={action} className="flex flex-col gap-1">
            <input type="hidden" name="nomor" value={row.nomor} />
            <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                {pending ? "Memproses..." : label}
            </button>
            {state?.errors?.umum && <PesanGagal pesan={state.errors.umum} />}
            {state?.pesan && <span className="text-sm text-emerald-700">{state.pesan}</span>}
        </form>
    );
}

function FormAdminJo({ row, segarkan }) {
    const bungkusPindah = async (prev, formData) => {
        const hasil = await pindahDivisi(prev, formData);
        if (hasil?.berhasil) segarkan();
        return hasil;
    };
    const [batalBuka, setBatalBuka] = useState(false);
    const formBatalRef = useRef(null);
    const bungkusBatal = async (prev, formData) => {
        const hasil = await batalkanJo(prev, formData);
        if (hasil?.berhasil) {
            setBatalBuka(false);
            segarkan();
        }
        return hasil;
    };
    const [statePindah, actionPindah, pendingPindah] = useActionState(bungkusPindah, undefined);
    const [stateBatal, actionBatal, pendingBatal] = useActionState(bungkusBatal, undefined);

    return (
        <div className="flex flex-wrap items-end gap-3">
            <form action={actionPindah} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="nomor" value={row.nomor} />
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Pindah divisi (admin)</label>
                    <select name="divisi" defaultValue={row.divisi_pengerjaan ?? ""} className={KELAS_INPUT}>
                        {DAFTAR_DIVISI.filter((d) => d !== "admin").map((d) => (
                            <option key={d} value={d}>
                                {LABEL_DIVISI[d]}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" disabled={pendingPindah} className={KELAS_TOMBOL}>
                    {pendingPindah ? "..." : "Pindahkan"}
                </button>
                {statePindah?.errors?.divisi && <PesanGagal pesan={statePindah.errors.divisi} />}
                {statePindah?.pesan && <span className="text-sm text-emerald-700">{statePindah.pesan}</span>}
            </form>
            <form ref={formBatalRef} action={actionBatal}>
                <input type="hidden" name="nomor" value={row.nomor} />
                <button
                    type="button"
                    onClick={() => setBatalBuka(true)}
                    className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                >
                    Batalkan JO
                </button>
                {stateBatal?.errors?.umum && <PesanGagal pesan={stateBatal.errors.umum} />}
            </form>
            {batalBuka && (
                <KonfirmasiHapus
                    judul="Batalkan Job Order"
                    pesan={`Batalkan job order ${row.nomor}? Status berubah menjadi dibatalkan, job tidak dapat diaktifkan kembali.`}
                    labelAksi="Ya, Batalkan"
                    onBatal={() => setBatalBuka(false)}
                    onHapus={() => formBatalRef.current?.requestSubmit()}
                    pending={pendingBatal}
                    error={stateBatal?.errors?.umum}
                />
            )}
        </div>
    );
}

function ItemProduk({ produk, bolehKelola, segarkan }) {
    const [edit, setEdit] = useState(false);
    const [hapusBuka, setHapusBuka] = useState(false);
    const [hapusPending, setHapusPending] = useState(false);
    const [hapusError, setHapusError] = useState(null);

    const hapus = async () => {
        setHapusPending(true);
        setHapusError(null);
        const fd = new FormData();
        fd.set("id_produk", produk.id);
        const hasil = await hapusProduk(fd);
        setHapusPending(false);
        if (hasil?.errors) setHapusError(hasil.errors[0]);
        else {
            setHapusBuka(false);
            segarkan();
        }
    };

    if (edit) {
        return (
            <FormUbahProduk
                produk={produk}
                onSelesai={() => {
                    setEdit(false);
                    segarkan();
                }}
            />
        );
    }

    return (
        <li className="flex items-start gap-2 p-2 border border-slate-200 bg-white text-sm">
            <div className="flex-1 min-w-0">
                <span className="font-medium">{produk.nama}</span>
                <span className="text-slate-500"> × {produk.jumlah}</span>
                {produk.keterangan && <p className="text-xs text-slate-400">{produk.keterangan}</p>}
            </div>
            {bolehKelola && (
                <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setEdit(true)} className={KELAS_TOMBOL_KECIL}>
                        Ubah
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setHapusError(null);
                            setHapusBuka(true);
                        }}
                        className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                    >
                        Hapus
                    </button>
                </div>
            )}
            {hapusBuka && (
                <KonfirmasiHapus
                    judul="Hapus Produk"
                    pesan={`Hapus produk "${produk.nama}" dari job order ini? Data tidak dapat dikembalikan.`}
                    onBatal={() => setHapusBuka(false)}
                    onHapus={hapus}
                    pending={hapusPending}
                    error={hapusError}
                />
            )}
        </li>
    );
}

function FormUbahProduk({ produk, onSelesai }) {
    const bungkus = async (prev, formData) => {
        const hasil = await ubahProduk(prev, formData);
        if (hasil?.berhasil) onSelesai();
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form action={action} className="flex flex-wrap items-end gap-2 p-2 border border-slate-300 bg-white text-sm">
            <input type="hidden" name="id_produk" value={produk.id} />
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Nama</label>
                <input name="nama" type="text" defaultValue={produk.nama} required className={KELAS_INPUT} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Jumlah</label>
                <input name="jumlah" type="number" min="0" step="any" defaultValue={produk.jumlah} required className={`${KELAS_INPUT} w-24`} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Keterangan</label>
                <input name="keterangan" type="text" defaultValue={produk.keterangan ?? ""} className={KELAS_INPUT} />
            </div>
            <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                {pending ? "..." : "Simpan"}
            </button>
            {state?.errors?.produk && <PesanGagal pesan={state.errors.produk} />}
            {state?.errors?.umum && <PesanGagal pesan={state.errors.umum} />}
        </form>
    );
}

function FormTambahProduk({ nomor, segarkan }) {
    const bungkus = async (prev, formData) => {
        const hasil = await tambahProduk(prev, formData);
        if (hasil?.berhasil) {
            segarkan();
            document.getElementById(`form-produk-${nomor}`)?.reset();
        }
        return hasil;
    };
    const [state, action, pending] = useActionState(bungkus, undefined);

    return (
        <form id={`form-produk-${nomor}`} action={action} className="flex flex-wrap items-end gap-2 p-2 border border-dashed border-slate-300 text-sm">
            <input type="hidden" name="nomor" value={nomor} />
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Produk baru</label>
                <input name="nama" type="text" placeholder="Nama produk" required className={KELAS_INPUT} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Jumlah</label>
                <input name="jumlah" type="number" min="0" step="any" placeholder="1" required className={`${KELAS_INPUT} w-24`} />
            </div>
            <div className="flex flex-col gap-1">
                <label className={KELAS_LABEL}>Keterangan</label>
                <input name="keterangan" type="text" placeholder="Opsional" className={KELAS_INPUT} />
            </div>
            <button type="submit" disabled={pending} className={KELAS_TOMBOL}>
                {pending ? "..." : "+ Tambah Produk"}
            </button>
            {state?.errors?.produk && <PesanGagal pesan={state.errors.produk} />}
            {state?.errors?.umum && <PesanGagal pesan={state.errors.umum} />}
            {state?.pesan && <span className="text-sm text-emerald-700">{state.pesan}</span>}
        </form>
    );
}

export function TambahJobOrder({ onTambahPelanggan }) {
    const [state, action, pending] = useActionState(bungkusTambah, undefined);

    const [daftarPel, setDaftarPel] = useState([]);
    const [q, setQ] = useState("");
    const [pilih, setPilih] = useState(null);
    const [bukaDropdown, setBukaDropdown] = useState(false);
    const comboRef = useRef(null);

    const [baris, setBaris] = useState([{ uid: 1, nama: "", jumlah: "", keterangan: "" }]);

    useEffect(() => {
        let batal = false;
        fetch("/api/pelanggan")
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((j) => {
                if (!batal && Array.isArray(j)) setDaftarPel(j);
            })
            .catch(() => {});
        return () => {
            batal = true;
        };
    }, []);

    useEffect(() => {
        if (!bukaDropdown) return;
        const tutup = (e) => {
            if (comboRef.current && !comboRef.current.contains(e.target)) setBukaDropdown(false);
        };
        document.addEventListener("pointerdown", tutup);
        return () => document.removeEventListener("pointerdown", tutup);
    }, [bukaDropdown]);

    async function bungkusTambah(prev, formData) {
        const hasil = await tambahJobOrder(prev, formData);
        if (hasil?.berhasil) {
            document.getElementById("form-tambah-jo")?.reset();
            setPilih(null);
            setQ("");
            setBukaDropdown(false);
            setBaris([{ uid: Date.now(), nama: "", jumlah: "", keterangan: "" }]);
        }
        return hasil;
    }

    const hasilCari = daftarPel
        .filter(
            (p) =>
                !q ||
                p.nama.toLowerCase().includes(q.toLowerCase()) ||
                String(p.nomor_telepon ?? "").toLowerCase().includes(q.toLowerCase())
        )
        .slice(0, 8);

    const hariIni = new Date().toISOString().slice(0, 10);

    return (
        <form id="form-tambah-jo" action={action} className="bg-white border border-slate-200 p-4 flex flex-col gap-4 max-w-2xl">
            <PesanGagal pesan={state?.errors?.umum} />
            {state?.pesan && <PesanBerhasil tampil />}

            <div className="flex flex-col gap-1 relative" ref={comboRef}>
                <label className={KELAS_LABEL}>Pelanggan</label>
                <input
                    type="text"
                    value={pilih ? pilih.nama : q}
                    onChange={(e) => {
                        setPilih(null);
                        setQ(e.target.value);
                        setBukaDropdown(true);
                    }}
                    onFocus={() => setBukaDropdown(true)}
                    placeholder="Ketik untuk mencari pelanggan..."
                    className={KELAS_INPUT}
                    autoComplete="off"
                />
                <input type="hidden" name="id_pelanggan" value={pilih?.id ?? ""} />
                {bukaDropdown && !pilih && (
                    <ul className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 max-h-56 overflow-y-auto">
                        {hasilCari.length === 0 && <li className="p-2 text-sm text-slate-400">Tidak ada pelanggan yang cocok.</li>}
                        {hasilCari.map((p) => (
                            <li
                                key={p.id}
                                onClick={() => {
                                    setPilih(p);
                                    setBukaDropdown(false);
                                }}
                                className="p-2 text-sm hover:bg-slate-100 hover:cursor-pointer flex justify-between gap-4"
                            >
                                <span>{p.nama}</span>
                                <span className="text-slate-400">{p.nomor_telepon || p.email || ""}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <PesanGagal pesan={state?.errors?.pelanggan} />
                <button type="button" onClick={onTambahPelanggan} className="text-xs text-slate-500 hover:text-slate-700 hover:underline hover:cursor-pointer self-start mt-1">
                    Pelanggan belum terdaftar? Tambah pelanggan →
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                    <label className={KELAS_LABEL}>Nomor Job Order</label>
                    <input
                        name="nomor"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="0001"
                        required
                        className={`${KELAS_INPUT} w-32`}
                    />
                    <p className="text-xs text-slate-400">Hanya angka (contoh: 0001). Otomatis menjadi PRP/2026/X/0001 — tahun &amp; bulan romawi dari tanggal terima</p>
                    <PesanGagal pesan={state?.errors?.nomor} />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-40">
                    <label className={KELAS_LABEL}>Tanggal Terima</label>
                    <input name="tanggal_terima" type="date" defaultValue={hariIni} required className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.tanggal_terima} />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-40">
                    <label className={KELAS_LABEL}>Tanggal Selesai</label>
                    <input name="tanggal_selesai" type="date" required className={KELAS_INPUT} />
                    <PesanGagal pesan={state?.errors?.tanggal_selesai} />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL}>Produk</label>
                <PesanGagal pesan={state?.errors?.produk} />
                {baris.map((b, i) => (
                    <div key={b.uid} className="flex flex-wrap items-end gap-2 p-2 border border-slate-200 bg-slate-50">
                        <div className="flex flex-col gap-1 flex-1 min-w-40">
                            <label className={KELAS_LABEL}>Nama produk {i + 1}</label>
                            <input
                                name="produk_nama"
                                type="text"
                                value={b.nama}
                                required
                                onChange={(e) => setBaris(baris.map((x) => (x.uid === b.uid ? { ...x, nama: e.target.value } : x)))}
                                className={KELAS_INPUT}
                            />
                        </div>
                        <div className="flex flex-col gap-1 w-28">
                            <label className={KELAS_LABEL}>Jumlah</label>
                            <input
                                name="produk_jumlah"
                                type="number"
                                min="0"
                                step="any"
                                value={b.jumlah}
                                required
                                onChange={(e) => setBaris(baris.map((x) => (x.uid === b.uid ? { ...x, jumlah: e.target.value } : x)))}
                                className={KELAS_INPUT}
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-40">
                            <label className={KELAS_LABEL}>Keterangan</label>
                            <input
                                name="produk_keterangan"
                                type="text"
                                value={b.keterangan}
                                onChange={(e) => setBaris(baris.map((x) => (x.uid === b.uid ? { ...x, keterangan: e.target.value } : x)))}
                                className={KELAS_INPUT}
                            />
                        </div>
                        {baris.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setBaris(baris.filter((x) => x.uid !== b.uid))}
                                className={`${KELAS_TOMBOL_KECIL} text-red-600 border-red-200 hover:bg-red-50`}
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => setBaris([...baris, { uid: Date.now(), nama: "", jumlah: "", keterangan: "" }])}
                    className={`${KELAS_TOMBOL_KECIL} self-start`}
                >
                    + Tambah Produk
                </button>
            </div>

            <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} self-start`}>
                {pending ? "Menyimpan..." : "Simpan Job Order"}
            </button>
        </form>
    );
}
