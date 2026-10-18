"use client";

import { LogOut } from "lucide-react";
import { useUser } from "./user-provider";
import { logout } from "@/app/actions/auth";
import { LABEL_DIVISI } from "@/lib/akses";

export default function Navbar({ namaPerusahaan }: { namaPerusahaan: string }) {
    const user = useUser();

    return (
        <nav className="p-4 md:p-5 bg-slate-800 text-white flex items-center gap-4">
            <h1 className="truncate">{namaPerusahaan}</h1>
            <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-slate-300 truncate max-w-40 md:max-w-none">
                    {user.username}
                    <span className="ml-2 px-2 py-0.5 border border-slate-600 bg-slate-700 text-xs uppercase tracking-wide">
                        {LABEL_DIVISI[user.divisi]}
                    </span>
                </span>
                <form action={logout}>
                    <button
                        type="submit"
                        className="flex items-center gap-2 text-sm hover:text-slate-300 hover:cursor-pointer transition-colors duration-300"
                    >
                        <LogOut size={16} className="stroke-[1.5]" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </form>
            </div>
        </nav>
    );
}
