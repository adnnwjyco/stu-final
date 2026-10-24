"use client";

import { useEffect, useState } from "react";
import { LABEL_DIVISI } from "@/lib/akses";
import { BadgeStatus, ProgressBar, formatTanggal, Kosong, Memuat } from "./util";
import GrafikBulanan from "./grafik-bulanan";

function Kartu({ label, nilai }) {
    return (
        <div className="bg-canvas border border-hairline rounded-xl p-5 flex flex-col gap-1 shadow-lift-1">
            <span className="text-[13px] font-normal tracking-[-0.39px] text-ink-mute">{label}</span>
            <span className="tnum text-[26px] font-light leading-[1.12] tracking-[-0.26px] text-ink">{nilai}</span>
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

    if (gagal) return <p className="text-[14px] text-ruby">Gagal memuat data. Muat ulang halaman.</p>;
    if (!statistik) return <Memuat />;

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
                <h2 className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute">
                    Rangkuman Bulanan Job Order{lingkupDivisi ? ` di Divisi ${LABEL_DIVISI[statistik.divisi] ?? ""}` : ""}{" "}
                    <span className="text-hairline-input">(berdasarkan tanggal terima)</span>
                </h2>
                <GrafikBulanan data={statistik.bulanan ?? []} />
            </div>

            <div className="flex flex-col gap-2">
                <h2 className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute">
                    {lingkupDivisi ? "Job Order Terakhir di Divisi Saya" : "Job Order Terakhir"}
                </h2>
                {terakhir.length === 0 ? (
                    <Kosong pesan="Belum ada job order." />
                ) : (
                    <div className="overflow-x-auto bg-canvas border border-hairline rounded-xl shadow-lift-1">
                        <table className="w-full text-[14px] tnum">
                            <thead>
                                <tr className="text-left text-ink-mute bg-canvas-soft border-b border-hairline">
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Nomor</th>
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Pelanggan</th>
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Tenggat</th>
                                    {!lingkupDivisi && <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Divisi</th>}
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Persentase</th>
                                    <th className="p-3 font-normal text-[11px] uppercase tracking-[0.1px]">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {terakhir.map((jo) => (
                                    <tr key={jo.nomor} className="border-b border-hairline last:border-0 hover:bg-canvas-soft transition-colors duration-200">
                                        <td className="p-3 tnum text-[13px] text-ink-secondary whitespace-nowrap">{jo.nomor}</td>
                                        <td className="p-3">{jo.nama_pelanggan}</td>
                                        <td className="p-3 tnum whitespace-nowrap text-ink-mute">{formatTanggal(jo.tanggal_selesai)}</td>
                                        {!lingkupDivisi && (
                                            <td className="p-3 whitespace-nowrap text-[13px]">
                                                {jo.divisi_pengerjaan ? LABEL_DIVISI[jo.divisi_pengerjaan] : <span className="text-ink-mute">-</span>}
                                            </td>
                                        )}
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
        </div>
    );
}
