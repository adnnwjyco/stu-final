import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const LABEL_STATUS = { pending: "Pending", proses: "Proses", selesai: "Selesai", dibatalkan: "Dibatalkan" };

export const KELAS_STATUS = {
    pending: "bg-canvas-soft text-ink-mute border-hairline",
    proses: "bg-amber-100 text-amber-700 border-amber-300",
    selesai: "bg-emerald-100 text-emerald-700 border-emerald-300",
    dibatalkan: "bg-rose-100 text-rose-700 border-rose-300",
};

export const KELAS_INPUT =
    "p-2 text-[15px] text-ink bg-canvas border border-hairline-input rounded-md focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-ink-mute";
export const KELAS_LABEL = "text-[13px] font-normal tracking-[-0.39px] text-ink-mute";
export const KELAS_TOMBOL =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-[15px] font-normal leading-none text-white bg-primary hover:bg-primary-press hover:cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait active:translate-y-px";
export const KELAS_TOMBOL_KECIL =
    "inline-flex items-center justify-center px-3 py-1.5 text-[13px] font-normal leading-none text-primary bg-canvas border border-primary-subdued hover:bg-primary-subdued/40 hover:cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-60";
export const KELAS_TOMBOL_DANGER =
    "inline-flex items-center justify-center px-3 py-1.5 text-[13px] font-normal leading-none text-ruby bg-canvas border border-rose-200 hover:bg-rose-50 hover:cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-60";
export const KELAS_KARTU = "bg-canvas border border-hairline rounded-xl p-6 shadow-lift-1";

export function BadgeStatus({ status }) {
    return (
        <span
            className={`inline-flex px-2 py-0.5 border rounded-full text-[11px] font-normal tracking-[0.1px] whitespace-nowrap ${
                KELAS_STATUS[status] ?? KELAS_STATUS.pending
            }`}
        >
            {LABEL_STATUS[status] ?? status}
        </span>
    );
}

export function ProgressBar({ persentase }) {
    const nilai = Math.min(100, Math.max(0, persentase));
    return (
        <div className="flex items-center gap-2 min-w-24">
            <div className="flex-1 h-1.5 bg-hairline rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${nilai}%` }}
                />
            </div>
            <span className="tnum text-[11px] text-ink-mute w-8 text-right">{persentase}%</span>
        </div>
    );
}

export function formatTanggal(x) {
    if (!x) return "-";
    const d = new Date(x);
    if (Number.isNaN(d.getTime())) return String(x);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatWaktu(x) {
    if (!x) return "-";
    const d = new Date(x);
    if (Number.isNaN(d.getTime())) return String(x);
    return d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function Kosong({ pesan = "Belum ada data." }) {
    return (
        <p className="text-[15px] text-ink-mute p-8 text-center border border-dashed border-hairline rounded-xl bg-canvas">
            {pesan}
        </p>
    );
}

export function Memuat({ area = false }) {
    const spinner = (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas border border-hairline shadow-lift-2">
            <Loader2 size={22} className="animate-spin text-primary stroke-[1.75]" />
        </div>
    );

    if (area) {
        return (
            <div className="flex items-center justify-center py-14" role="status" aria-label="Memuat">
                {spinner}
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm"
            role="status"
            aria-label="Memuat"
        >
            {spinner}
        </div>
    );
}

export function PesanGagal({ pesan }) {
    if (!pesan) return null;
    return <p className="text-[13px] text-ruby">{Array.isArray(pesan) ? pesan[0] : pesan}</p>;
}

export function PesanBerhasil({ tampil }) {
    if (!tampil) return null;
    return <p className="text-[13px] text-emerald-700">Berhasil disimpan.</p>;
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
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onTutup();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={judul}
                className="bg-canvas w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl shadow-lift-2"
            >
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-hairline sticky top-0 bg-canvas rounded-t-xl">
                    <h2 className="text-[18px] font-normal tracking-[-0.2px] text-ink">{judul}</h2>
                    <button
                        type="button"
                        onClick={onTutup}
                        aria-label="Tutup"
                        className="px-3 py-1.5 text-[13px] text-ink-mute bg-canvas border border-hairline hover:bg-canvas-soft hover:cursor-pointer rounded-full transition-colors duration-200"
                    >
                        Tutup
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-4">{children}</div>
            </div>
        </div>
    );
}

export function KonfirmasiHapus({ judul, pesan, onBatal, onHapus, pending, error, labelAksi = "Ya, Hapus" }) {
    return (
        <Overlay judul={judul} onTutup={pending ? () => {} : onBatal}>
            <div className="flex flex-col gap-4 max-w-md">
                <p className="text-[15px] text-ink-secondary">{pesan}</p>
                <PesanGagal pesan={error} />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onBatal}
                        disabled={pending}
                        className="px-4 py-2 text-[15px] font-normal leading-none text-ink-mute bg-canvas border border-hairline hover:bg-canvas-soft hover:cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onHapus}
                        disabled={pending}
                        className="inline-flex items-center px-4 py-2 text-[15px] font-normal leading-none text-white bg-ruby hover:opacity-90 hover:cursor-pointer rounded-full transition-opacity duration-200 disabled:opacity-60"
                    >
                        {pending ? "Memproses..." : labelAksi}
                    </button>
                </div>
            </div>
        </Overlay>
    );
}
