"use client";

import { createContext, use, type ReactNode } from "react";
import type { Pengguna } from "@/lib/akses";

const UserContext = createContext<Promise<Pengguna> | null>(null);

export function UserProvider({ userPromise, children }: { userPromise: Promise<Pengguna>; children: ReactNode }) {
    return <UserContext value={userPromise}>{children}</UserContext>;
}

export function useUser() {
    const userPromise = use(UserContext);
    if (!userPromise) throw new Error("useUser harus dipakai di dalam UserProvider");
    return use(userPromise);
}
