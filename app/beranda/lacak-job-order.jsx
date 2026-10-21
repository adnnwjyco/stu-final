"use client";

import { useActionState } from "react";
import { lacakJobOrder } from "@/app/actions/lacak";
import { BadgeStatus, ProgressBar, formatTanggal } from "../dashboard/isi/util";

const KELAS_LINGKARAN = {
    selesai: "bg-emerald-500 border-emerald-500 text-white",
    aktif: "bg-slate-700 border-slate-700 text-white",
    menunggu: "bg-white border-slate-300 text-slate-400",
    batal: "bg-rose-100 border-rose-300 text-rose-500",
};

const KELAS_Teks = {
    selesai: "text-slate-700",
    aktif: "font-semibold text-slate-900",
    menunggu: "text-slate-400",
    batal: "text-rose-500",
};

function labelStatusLangkah(status, statusJo) {
    if (status === "selesai") return "Selesai";
    if (status === "batal") return "Dibatalkan";
    if (status === "menunggu") return "Menunggu";
    return statusJo === "pending" ? "Menunggu dimulai" : "Sedang dikerjakan";
}

function DaftarLangkah({ langkah, statusJo }) {
    return (
        <ol className="flex flex-col">
            {langkah.map((l, i) => {
                const terakhir = i === langkah.length - 1;
                const berikut = langkah[i + 1];
                const garisOk = l.status === "selesai" && berikut && (berikut.status === "selesai" || berikut.status === "aktif");
                return (
                    <li key={l.divisi} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <span
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-medium shrink-0 ${KELAS_LINGKARAN[l.status]}`}
                            >
                                {l.status === "selesai" ? "✓" : i + 1}
                            </span>
                            {!terakhir && <span className={`w-0.5 flex-1 min-h-4 ${garisOk ? "bg-emerald-500" : "bg-slate-200"}`} />}
                        </div>
                        <div className={`flex-1 ${terakhir ? "" : "pb-4"}`}>
                            <p className={`text-sm ${KELAS_Teks[l.status]}`}>{l.label}</p>
                            <p className="text-xs text-slate-400">{l.ket}</p>
                            <p
                                className={`text-xs mt-0.5 ${
                                    l.status === "selesai"
                                        ? "text-emerald-600"
                                        : l.status === "aktif"
                                          ? statusJo === "pending"
                                              ? "text-amber-600"
                                              : "text-slate-700"
                                          : l.status === "batal"
                                            ? "text-rose-500"
                                            : "text-slate-400"
                                }`}
                            >
                                {labelStatusLangkah(l.status, statusJo)}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function formatJumlah(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function LacakJobOrder() {
    const [state, action, pending] = useActionState(lacakJobOrder, undefined);

    return (
        <div className="flex flex-col gap-6">
            <form action={action} className="flex flex-col md:flex-row gap-3 items-center">
                <input
                    type="text"
                    name="nomor"
                    placeholder="Nomor Job Order (contoh: PRP/2026/X/0001)"
                    autoComplete="off"
                    required
                    maxLength={30}
                    className="p-2 w-full md:flex-4 border border-slate-200 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="w-full md:flex-1 bg-slate-700 hover:bg-slate-600 hover:cursor-pointer text-white p-2 px-4 disabled:opacity-60"
                >
                    {pending ? "Melacak..." : "Lacak Proses"}
                </button>
            </form>

            {state?.errors?.nomor && <p className="text-sm text-red-600 text-center">{state.errors.nomor[0]}</p>}
            {state?.errors?.umum && <p className="text-sm text-red-600 text-center">{state.errors.umum[0]}</p>}

            {state?.hasil && (
                <div className="border border-slate-200 bg-white p-4 flex flex-col gap-4 text-left">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-xs text-slate-400">Nomor Job Order</p>
                            <p className="font-mono text-lg text-slate-800">{state.hasil.nomor}</p>
                        </div>
                        <BadgeStatus status={state.hasil.status} />
                    </div>

                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Diterima</span>
                            <span>{formatTanggal(state.hasil.tanggal_terima)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-slate-500">Estimasi selesai</span>
                            <span>{formatTanggal(state.hasil.tanggal_selesai)}</span>
                        </div>
                        {state.hasil.divisi_pengerjaan && (
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Sedang dikerjakan</span>
                                <span>{state.hasil.divisi_pengerjaan}</span>
                            </div>
                        )}
                    </div>

                    <ProgressBar persentase={state.hasil.persentase} />

                    {state.hasil.status === "dibatalkan" && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 p-2">
                            Job order ini telah dibatalkan.
                        </p>
                    )}
                    {state.hasil.status === "selesai" && (
                        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-2">
                            Job order sudah selesai. Terima kasih!
                        </p>
                    )}

                    <div>
                        <p className="text-sm font-medium mb-3">Langkah pengerjaan</p>
                        <DaftarLangkah langkah={state.hasil.langkah} statusJo={state.hasil.status} />
                    </div>

                    {state.hasil.produk.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-1">Produk</p>
                            <ul className="text-sm text-slate-600 flex flex-col gap-0.5">
                                {state.hasil.produk.map((p) => (
                                    <li key={p.nama}>
                                        {p.nama} &times; {formatJumlah(p.jumlah)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
