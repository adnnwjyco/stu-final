import "server-only";
import { redirect } from "next/navigation";
import { getSesi } from "./session";
import type { Pengguna } from "./akses";

export type { Pengguna };

export async function verifySession(): Promise<Pengguna> {
    "use cache: private";

    const sesi = await getSesi();
    const { id, username, divisi } = sesi;
    if (!id || !username || !divisi) redirect("/login");
    return { id, username, divisi };
}

export const getCurrentUser = verifySession;
