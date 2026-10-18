import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/dal";
import { getPelanggan } from "@/lib/data";

export async function GET(request: NextRequest) {
    try {
        await verifySession();
    } catch {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const cari = request.nextUrl.searchParams.get("cari") ?? undefined;

    try {
        return NextResponse.json(await getPelanggan(cari));
    } catch (err) {
        console.error("Gagal memuat pelanggan:", err);
        return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
    }
}
