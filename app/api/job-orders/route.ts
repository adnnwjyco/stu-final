import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getJobOrders, getProdukBanyak } from "@/lib/data";
import { bolehAksi, type Divisi } from "@/lib/akses";

export async function GET(request: NextRequest) {
    let divisi: Divisi;
    try {
        const user = await verifySession();
        divisi = user.divisi;
    } catch {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const cari = request.nextUrl.searchParams.get("cari") ?? undefined;
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const semua = bolehAksi(divisi, "lihat_semua_job_order");

    try {
        const daftar = await getJobOrders({
            cari,
            status,
            hanyaMilik: semua ? undefined : divisi,
        });
        const produk = await getProdukBanyak(daftar.map((j) => j.nomor));
        const perJo = new Map<string, typeof produk>();
        for (const p of produk) {
            const arr = perJo.get(p.nomor) ?? [];
            arr.push(p);
            perJo.set(p.nomor, arr);
        }
        return NextResponse.json(daftar.map((j) => ({ ...j, produk: perJo.get(j.nomor) ?? [] })));
    } catch (err) {
        console.error("Gagal memuat job order:", err);
        return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
    }
}
