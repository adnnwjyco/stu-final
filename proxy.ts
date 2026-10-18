import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { opsiSesi, NAMA_COOKIE_SESI } from "@/lib/sesi-opsi";
import type { Divisi } from "@/lib/akses";

type DataSesi = { id?: string; username?: string; divisi?: Divisi };

export default async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const cookie = request.cookies.get(NAMA_COOKIE_SESI)?.value;

    let id: string | undefined;
    if (cookie && opsiSesi.password) {
        try {
            const data = await unsealData<DataSesi>(cookie, { password: opsiSesi.password, ttl: opsiSesi.ttl });
            id = data.id;
        } catch {
            id = undefined;
        }
    }

    const terproteksi = path === "/dashboard" || path.startsWith("/dashboard/");
    if (terproteksi && !id) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (path === "/login" && id) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login"],
};
