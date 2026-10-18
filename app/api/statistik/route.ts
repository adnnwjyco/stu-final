import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { getStatistik } from "@/lib/data";
import { bolehAksi, type Divisi } from "@/lib/akses";

export async function GET() {
    let divisi: Divisi;
    try {
        const user = await verifySession();
        divisi = user.divisi;
    } catch {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const semua = bolehAksi(divisi, "lihat_semua_job_order");

    try {
        return NextResponse.json(await getStatistik(semua ? undefined : divisi));
    } catch (err) {
        console.error("Gagal memuat statistik:", err);
        return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
    }
}
