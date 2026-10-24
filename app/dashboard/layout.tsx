import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/dal";
import { UserProvider } from "./user-provider";
import Navbar from "./navbar";

function NavFallback({ namaPerusahaan }: { namaPerusahaan: string }) {
    return (
        <nav className="px-5 py-3 bg-brand-dark text-white flex items-center gap-4 border-b border-primary-deep/40">
            <span className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary-soft" aria-hidden />
                <h1 className="truncate text-[15px] font-normal tracking-[-0.2px]">{namaPerusahaan}</h1>
            </span>
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
            <div className="flex flex-col md:flex-row flex-1 min-h-0">
                <Suspense fallback={<div className="flex-1 bg-canvas-soft" />}>{children}</Suspense>
            </div>
        </UserProvider>
    );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const namaPerusahaan = process.env.NAMA_PERUSAHAAN ?? "";

    return (
        <div className="min-h-dvh md:h-dvh flex flex-col">
            <Suspense fallback={<NavFallback namaPerusahaan={namaPerusahaan} />}>
                <Shell namaPerusahaan={namaPerusahaan}>{children}</Shell>
            </Suspense>
        </div>
    );
}
