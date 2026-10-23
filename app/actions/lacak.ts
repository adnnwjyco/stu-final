"use server";

import { query } from "@/lib/db";
import { PIPELINE, LABEL_DIVISI, type Divisi } from "@/lib/akses";
import { normalisasiNomor } from "@/lib/nomor";

export type LangkahLacak = {
    divisi: Divisi;
    label: string;
    ket: string;
    status: "selesai" | "aktif" | "konfirmasi" | "menunggu" | "batal";
};

export type HasilLacak = {
    nomor: string;
    status: "pending" | "proses" | "selesai" | "dibatalkan";
    persentase: number;
    divisi_pengerjaan: string | null;
    tanggal_terima: string;
    tanggal_selesai: string;
    langkah: LangkahLacak[];
    produk: { nama: string; jumlah: number }[];
};

export type StateLacak = {
    errors?: { nomor?: string[]; umum?: string[] };
    hasil?: HasilLacak;
} | undefined;

const DESKRIPSI_LANGKAH: Partial<Record<Divisi, string>> = {
    desainer: "Pembuatan desain produk",
    sheet_metal: "Pemotongan & pembentukan lembaran logam",
    expanding: "Proses expanding",
    piping_brazing: "Pemasangan pipa & brazing",
    perakitan_indoor: "Perakitan unit indoor",
    perakitan_outdoor: "Perakitan unit outdoor",
    quality_assurance: "Pengecekan kualitas akhir",
    gudang: "Penyiapan di gudang & pengiriman",
};

export async function lacakJobOrder(_prev: StateLacak, formData: FormData): Promise<StateLacak> {
    const raw = String(formData.get("nomor") ?? "");
    if (!raw.trim()) return { errors: { nomor: ["Nomor job order wajib diisi"] } };
    if (raw.trim().length > 30) return { errors: { nomor: ["Nomor job order tidak valid"] } };

    const nomor = normalisasiNomor(raw);
    if (!nomor) return { errors: { nomor: ["Format nomor tidak valid. Contoh: PRP/2026/X/0001"] } };

    try {
        const rows = await query<{
            nomor: string;
            status: "pending" | "proses" | "selesai" | "dibatalkan";
            persentase: number;
            divisi_pengerjaan: Divisi | null;
            menunggu_terima: boolean;
            tanggal_terima: string;
            tanggal_selesai: string;
        }>(
            `SELECT nomor, status, persentase, divisi_pengerjaan, menunggu_terima,
                    to_char(tanggal_terima, 'YYYY-MM-DD') AS tanggal_terima,
                    to_char(tanggal_selesai, 'YYYY-MM-DD') AS tanggal_selesai
             FROM job_orders WHERE nomor = $1`,
            [nomor]
        );
        const jo = rows[0];
        if (!jo) {
            return { errors: { nomor: [`Job order ${nomor} tidak ditemukan. Periksa kembali nomor Anda.`] } };
        }

        const produk = await query<{ nama: string; jumlah: number }>(
            "SELECT nama, jumlah::float8 AS jumlah FROM job_order_produk WHERE nomor = $1 ORDER BY nama",
            [nomor]
        );

        const idx = jo.divisi_pengerjaan ? PIPELINE.indexOf(jo.divisi_pengerjaan) : -1;
        const langkah: LangkahLacak[] = PIPELINE.map((divisi, i) => {
            let status: LangkahLacak["status"];
            if (jo.status === "selesai") status = "selesai";
            else if (jo.status === "dibatalkan") status = "batal";
            else if (idx >= 0 && i < idx) status = "selesai";
            else if (idx >= 0 && i === idx) status = jo.menunggu_terima ? "konfirmasi" : "aktif";
            else status = "menunggu";
            return {
                divisi,
                label: LABEL_DIVISI[divisi],
                ket: DESKRIPSI_LANGKAH[divisi] ?? LABEL_DIVISI[divisi],
                status,
            };
        });

        return {
            hasil: {
                nomor: jo.nomor,
                status: jo.status,
                persentase: jo.persentase,
                divisi_pengerjaan: jo.divisi_pengerjaan ? LABEL_DIVISI[jo.divisi_pengerjaan] : null,
                tanggal_terima: jo.tanggal_terima,
                tanggal_selesai: jo.tanggal_selesai,
                langkah,
                produk: produk.map((p) => ({ nama: p.nama, jumlah: p.jumlah })),
            },
        };
    } catch (err) {
        console.error("Gagal lacak job order:", err);
        return { errors: { umum: ["Gagal menghubungi server, coba lagi"] } };
    }
}
