"use client";

import { LogOut } from "lucide-react";
import { useUser } from "./user-provider";
import { logout } from "@/app/actions/auth";
import { LABEL_DIVISI } from "@/lib/akses";

export default function Navbar({ namaPerusahaan }: { namaPerusahaan: string }) {
    const user = useUser();

    return (
        <nav className="px-5 py-3 bg-brand-dark text-white flex items-center gap-4 border-b border-primary-deep/40">
            <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-primary-soft shrink-0" aria-hidden />
                <h1 className="truncate text-[15px] font-normal tracking-[-0.2px]">{namaPerusahaan}</h1>
            </span>
            <div className="ml-auto flex items-center gap-4">
                <span className="flex items-center gap-2 text-[13px] text-white/80 truncate max-w-48 md:max-w-none">
                    {user.username}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] tracking-[0.1px] uppercase bg-white/10 text-primary-subdued whitespace-nowrap">
                        {LABEL_DIVISI[user.divisi]}
                    </span>
                </span>
                <form action={logout}>
                    <button
                        type="submit"
                        className="flex items-center gap-2 text-[13px] text-white/80 hover:text-white hover:cursor-pointer transition-colors duration-200"
                    >
                        <LogOut size={16} className="stroke-[1.5]" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </form>
            </div>
        </nav>
    );
}
