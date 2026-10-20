import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getPelanggan, getPelangganById, getJobOrdersPelanggan } from "@/lib/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
    try {
        await verifySession();
    } catch {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id") ?? undefined;
    const cari = request.nextUrl.searchParams.get("cari") ?? undefined;

    try {
        if (id) {
            if (!UUID_RE.test(id)) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
            const pelanggan = await getPelangganById(id);
            if (!pelanggan) return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
            const riwayat = await getJobOrdersPelanggan(id);
            return NextResponse.json({ ...pelanggan, riwayat });
        }
        return NextResponse.json(await getPelanggan(cari));
    } catch (err) {
        console.error("Gagal memuat pelanggan:", err);
        return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
    }
}
