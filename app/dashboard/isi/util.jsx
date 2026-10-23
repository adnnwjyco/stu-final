import { useEffect } from "react";

export const LABEL_STATUS = { pending: "Pending", proses: "Proses", selesai: "Selesai", dibatalkan: "Dibatalkan" };

export const KELAS_STATUS = {
    pending: "bg-slate-100 text-slate-600 border-slate-300",
    proses: "bg-amber-100 text-amber-700 border-amber-300",
    selesai: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dibatalkan: "bg-rose-100 text-rose-700 border-rose-300",
};

export const KELAS_INPUT = "p-2 border border-slate-200 focus:outline-none";
export const KELAS_LABEL = "text-sm text-slate-500";
export const KELAS_TOMBOL = "bg-slate-700 hover:bg-slate-600 hover:cursor-pointer text-white p-2 disabled:opacity-60";
export const KELAS_TOMBOL_KECIL = "px-2 py-1 text-xs border border-slate-300 bg-white hover:bg-slate-100 hover:cursor-pointer transition-colors duration-300";

export function BadgeStatus({ status }) {
    return (
        <span className={`px-2 py-0.5 border text-xs whitespace-nowrap ${KELAS_STATUS[status] ?? KELAS_STATUS.pending}`}>
            {LABEL_STATUS[status] ?? status}
        </span>
    );
}

export function ProgressBar({ persentase }) {
    return (
        <div className="flex items-center gap-2 min-w-24">
            <div className="flex-1 h-1.5 bg-slate-200">
                <div className="h-full bg-slate-700" style={{ width: `${Math.min(100, Math.max(0, persentase))}%` }} />
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{persentase}%</span>
        </div>
    );
}

export function formatTanggal(x) {
    if (!x) return "-";
    const d = new Date(x);
    if (Number.isNaN(d.getTime())) return String(x);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function Kosong({ pesan = "Belum ada data." }) {
    return <p className="text-sm text-slate-400 p-4 text-center border border-dashed border-slate-300 bg-white">{pesan}</p>;
}

export function PesanGagal({ pesan }) {
    if (!pesan) return null;
    return <p className="text-sm text-red-600">{Array.isArray(pesan) ? pesan[0] : pesan}</p>;
}

export function PesanBerhasil({ tampil }) {
    if (!tampil) return null;
    return <p className="text-sm text-emerald-700">Berhasil disimpan.</p>;
}

export function Overlay({ judul, onTutup, children }) {
    useEffect(() => {
        const tekan = (e) => {
            if (e.key === "Escape") onTutup();
        };
        document.addEventListener("keydown", tekan);
        return () => document.removeEventListener("keydown", tekan);
    }, [onTutup]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onTutup();
            }}
        >
            <div role="dialog" aria-modal="true" aria-label={judul} className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-200 sticky top-0 bg-white">
                    <h2 className="text-sm font-semibold text-slate-700">{judul}</h2>
                    <button type="button" onClick={onTutup} aria-label="Tutup" className={KELAS_TOMBOL_KECIL}>
                        ✕
                    </button>
                </div>
                <div className="p-4 flex flex-col gap-4">{children}</div>
            </div>
        </div>
    );
}

export function KonfirmasiHapus({ judul, pesan, onBatal, onHapus, pending, error, labelAksi = "Ya, Hapus" }) {
    return (
        <Overlay judul={judul} onTutup={pending ? () => {} : onBatal}>
            <div className="flex flex-col gap-4 max-w-md">
                <p className="text-sm text-slate-600">{pesan}</p>
                <PesanGagal pesan={error} />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onBatal} disabled={pending} className={KELAS_TOMBOL_KECIL}>
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onHapus}
                        disabled={pending}
                        className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white hover:cursor-pointer disabled:opacity-60 transition-colors duration-300"
                    >
                        {pending ? "Memproses..." : labelAksi}
                    </button>
                </div>
            </div>
        </Overlay>
    );
}
