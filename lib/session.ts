import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { opsiSesi } from "./sesi-opsi";
import type { Divisi } from "./akses";

export type DataSesi = {
    id: string;
    username: string;
    divisi: Divisi;
};

export async function getSesi() {
    if (!opsiSesi.password) throw new Error("SESSION_PASSWORD belum diatur di .env");
    return getIronSession<DataSesi>(await cookies(), opsiSesi);
}
