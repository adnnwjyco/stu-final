import { NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { getAkun } from "@/lib/data";
import { bolehAksi } from "@/lib/akses";

export async function GET() {
    try {
        const user = await verifySession();
        if (!bolehAksi(user.divisi, "kelola_akun")) {
            return NextResponse.json({ error: "Anda tidak berwenang" }, { status: 403 });
        }
    } catch {
        return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    try {
        return NextResponse.json(await getAkun());
    } catch (err) {
        console.error("Gagal memuat akun:", err);
        return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
    }
}
