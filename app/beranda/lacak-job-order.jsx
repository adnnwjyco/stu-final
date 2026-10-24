"use client";

import { useActionState } from "react";
import { lacakJobOrder } from "@/app/actions/lacak";
import { BadgeStatus, ProgressBar, formatTanggal } from "../dashboard/isi/util";

const KELAS_LINGKARAN = {
    selesai: "bg-primary border-primary text-white",
    aktif: "bg-primary-soft border-primary-soft text-white",
    konfirmasi: "bg-amber-100 border-amber-400 text-amber-700",
    menunggu: "bg-canvas border-hairline text-ink-mute",
    batal: "bg-rose-100 border-rose-300 text-rose-500",
};

const KELAS_Teks = {
    selesai: "text-ink-secondary",
    aktif: "font-normal text-ink",
    konfirmasi: "font-normal text-amber-700",
    menunggu: "text-ink-mute",
    batal: "text-rose-500",
};

function labelStatusLangkah(status, statusJo) {
    if (status === "selesai") return "Selesai";
    if (status === "batal") return "Dibatalkan";
    if (status === "menunggu") return "Menunggu";
    if (status === "konfirmasi") return "Menunggu konfirmasi terima";
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
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-normal shrink-0 ${KELAS_LINGKARAN[l.status]}`}
                            >
                                {l.status === "selesai" ? "✓" : i + 1}
                            </span>
                            {!terakhir && <span className={`w-0.5 flex-1 min-h-4 ${garisOk ? "bg-primary" : "bg-hairline"}`} />}
                        </div>
                        <div className={`flex-1 ${terakhir ? "" : "pb-4"}`}>
                            <p className={`text-[14px] ${KELAS_Teks[l.status]}`}>{l.label}</p>
                            <p className="text-[13px] text-ink-mute">{l.ket}</p>
                            <p
                                className={`text-[13px] mt-0.5 ${
                                    l.status === "selesai"
                                        ? "text-primary"
                                        : l.status === "aktif"
                                          ? statusJo === "pending"
                                              ? "text-amber-600"
                                              : "text-ink"
                                          : l.status === "konfirmasi"
                                            ? "text-amber-600"
                                            : l.status === "batal"
                                              ? "text-rose-500"
                                              : "text-ink-mute"
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
            <form
                action={action}
                className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-canvas border border-hairline rounded-xl p-4 shadow-lift-2"
            >
                <input
                    type="text"
                    name="nomor"
                    placeholder="Nomor Job Order (contoh: PRP/2026/X/0001)"
                    autoComplete="off"
                    required
                    maxLength={30}
                    className="flex-1 p-2.5 text-[15px] text-ink bg-canvas border border-hairline-input rounded-md focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-ink-mute"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 text-[15px] font-normal leading-none text-white bg-primary hover:bg-primary-press hover:cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait active:translate-y-px"
                >
                    {pending ? "Melacak..." : "Lacak Proses"}
                </button>
            </form>

            {state?.errors?.nomor && <p className="text-[13px] text-ruby text-center">{state.errors.nomor[0]}</p>}
            {state?.errors?.umum && <p className="text-[13px] text-ruby text-center">{state.errors.umum[0]}</p>}

            {state?.hasil && (
                <div className="border border-hairline bg-canvas rounded-xl p-6 flex flex-col gap-4 text-left shadow-lift-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.1px] text-ink-mute">Nomor Job Order</p>
                            <p className="tnum text-[22px] font-light leading-[1.1] tracking-[-0.22px] text-ink">{state.hasil.nomor}</p>
                        </div>
                        <BadgeStatus status={state.hasil.status} />
                    </div>

                    <div className="flex flex-col gap-1.5 text-[14px]">
                        <div className="flex justify-between gap-4">
                            <span className="text-ink-mute">Diterima</span>
                            <span className="tnum">{formatTanggal(state.hasil.tanggal_terima)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-ink-mute">Estimasi selesai</span>
                            <span className="tnum">{formatTanggal(state.hasil.tanggal_selesai)}</span>
                        </div>
                        {state.hasil.divisi_pengerjaan && (
                            <div className="flex justify-between gap-4">
                                <span className="text-ink-mute">Sedang dikerjakan</span>
                                <span>{state.hasil.divisi_pengerjaan}</span>
                            </div>
                        )}
                    </div>

                    <ProgressBar persentase={state.hasil.persentase} />

                    {state.hasil.status === "dibatalkan" && (
                        <p className="text-[14px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">
                            Job order ini telah dibatalkan.
                        </p>
                    )}
                    {state.hasil.status === "selesai" && (
                        <p className="text-[14px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                            Job order sudah selesai. Terima kasih!
                        </p>
                    )}

                    <div>
                        <p className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute mb-3">Langkah pengerjaan</p>
                        <DaftarLangkah langkah={state.hasil.langkah} statusJo={state.hasil.status} />
                    </div>

                    {state.hasil.produk.length > 0 && (
                        <div>
                            <p className="text-[13px] font-normal uppercase tracking-[0.1px] text-ink-mute mb-2">Produk</p>
                            <ul className="text-[14px] text-ink-secondary flex flex-col gap-0.5">
                                {state.hasil.produk.map((p) => (
                                    <li key={p.nama} className="tnum">
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
