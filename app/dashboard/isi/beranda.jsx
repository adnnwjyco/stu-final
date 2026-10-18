"use client";

import { useEffect, useState } from "react";
import { LABEL_DIVISI } from "@/lib/akses";
import { BadgeStatus, ProgressBar, formatTanggal, Kosong } from "./util";

function Kartu({ label, nilai }) {
    return (
        <div className="bg-white border border-slate-200 p-4 flex flex-col gap-1">
            <span className="text-sm text-slate-400">{label}</span>
            <span className="text-2xl">{nilai}</span>
        </div>
    );
}

export default function Beranda() {
    const [statistik, setStatistik] = useState(null);
    const [terakhir, setTerakhir] = useState([]);
    const [gagal, setGagal] = useState(false);

    useEffect(() => {
        let batal = false;
        Promise.all([
            fetch("/api/statistik").then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            }),
            fetch("/api/job-orders").then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            }),
        ])
            .then(([s, j]) => {
                if (batal) return;
                setStatistik(s);
                setTerakhir(Array.isArray(j) ? j.slice(0, 5) : []);
            })
            .catch(() => {
                if (!batal) setGagal(true);
            });
        return () => {
            batal = true;
        };
    }, []);

    if (gagal) return <p className="text-sm text-red-600">Gagal memuat data. Muat ulang halaman.</p>;
    if (!statistik) return <p className="text-sm text-slate-400">Memuat statistik...</p>;

    const lingkupDivisi = statistik.lingkup === "divisi";

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {lingkupDivisi ? (
                    <>
                        <Kartu label={`JO di Divisi ${LABEL_DIVISI[statistik.divisi] ?? ""}`} nilai={statistik.totalJob} />
                        <Kartu label="Pending" nilai={statistik.pending} />
                        <Kartu label="Proses" nilai={statistik.proses} />
                    </>
                ) : (
                    <>
                        <Kartu label="Job Order" nilai={statistik.totalJob} />
                        <Kartu label="Pending" nilai={statistik.pending} />
                        <Kartu label="Proses" nilai={statistik.proses} />
                        <Kartu label="Pelanggan" nilai={statistik.totalPelanggan} />
                    </>
                )}
                <Kartu label="Selesai" nilai={statistik.selesai} />
            </div>

            <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-slate-600">{lingkupDivisi ? "Job Order Terakhir di Divisi Saya" : "Job Order Terakhir"}</h2>
                {terakhir.length === 0 ? (
                    <Kosong pesan="Belum ada job order." />
                ) : (
                    <div className="overflow-x-auto bg-white border border-slate-200">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 bg-slate-100 border-b border-slate-200">
                                    <th className="p-2 font-medium">Nomor</th>
                                    <th className="p-2 font-medium">Pelanggan</th>
                                    <th className="p-2 font-medium">Tenggat</th>
                                    {!lingkupDivisi && <th className="p-2 font-medium">Divisi</th>}
                                    <th className="p-2 font-medium">Persentase</th>
                                    <th className="p-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {terakhir.map((jo) => (
                                    <tr key={jo.nomor} className="border-b border-slate-100 last:border-0">
                                        <td className="p-2 font-mono text-xs whitespace-nowrap">{jo.nomor}</td>
                                        <td className="p-2">{jo.nama_pelanggan}</td>
                                        <td className="p-2 whitespace-nowrap">{formatTanggal(jo.tanggal_selesai)}</td>
                                        {!lingkupDivisi && (
                                            <td className="p-2 whitespace-nowrap text-xs">
                                                {jo.divisi_pengerjaan ? LABEL_DIVISI[jo.divisi_pengerjaan] : <span className="text-slate-400">—</span>}
                                            </td>
                                        )}
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
        </div>
    );
}
