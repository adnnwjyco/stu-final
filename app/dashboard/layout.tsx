import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import { UserProvider } from "./user-provider";
import Navbar from "./navbar";

function NavFallback({ namaPerusahaan }: { namaPerusahaan: string }) {
    return (
        <nav className="p-4 md:p-5 bg-slate-800 text-white">
            <h1 className="truncate">{namaPerusahaan}</h1>
        </nav>
    );
}

function Shell({ namaPerusahaan, children }: { namaPerusahaan: string; children: ReactNode }) {
    const userPromise = getCurrentUser();

    return (
        <UserProvider userPromise={userPromise}>
            <Suspense fallback={<NavFallback namaPerusahaan={namaPerusahaan} />}>
                <Navbar namaPerusahaan={namaPerusahaan} />
            </Suspense>
            <div className="flex flex-col-reverse md:flex-row flex-1 min-h-0">
                <Suspense fallback={<div className="flex-1 bg-slate-50" />}>{children}</Suspense>
            </div>
        </UserProvider>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const namaPerusahaan = process.env.NAMA_PERUSAHAAN ?? "";

    return (
        <div className="h-dvh flex flex-col">
            <Suspense fallback={<NavFallback namaPerusahaan={namaPerusahaan} />}>
                <Shell namaPerusahaan={namaPerusahaan}>{children}</Shell>
            </Suspense>
        </div>
    );
}
