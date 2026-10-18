"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Users, ChevronDown, X, UserRound } from "lucide-react";
import { useUser } from "./user-provider";
import { bolehMenu } from "@/lib/akses";
import Beranda from "./isi/beranda";
import { KelolaJobOrder, TambahJobOrder } from "./isi/job-order";
import { KelolaPelanggan, TambahPelanggan } from "./isi/pelanggan";
import KelolaAkun from "./isi/akun";
import Profil from "./isi/profil";

const beranda = { id: "beranda", label: "Beranda", content: <Beranda /> };
const tabProfil = { id: "profil", label: "Profil", content: <Profil /> };
const tabKelolaAkun = { id: "kelola-akun", label: "Kelola Akun", content: <KelolaAkun /> };
const tabTambahPelanggan = { id: "pelanggan-tambah", label: "Tambah Pelanggan", content: <TambahPelanggan /> };

export default function Dashboard() {
    const user = useUser();
    const [menuBuka, setMenuBuka] = useState(null);
    const [tabs, setTabs] = useState([beranda]);
    const [tabAktif, setTabAktif] = useState(beranda.id);
    const asideRef = useRef(null);

    useEffect(() => {
        if (!menuBuka) return;
        const tutupJikaDiluar = (e) => {
            if (asideRef.current && !asideRef.current.contains(e.target)) setMenuBuka(null);
        };
        document.addEventListener("pointerdown", tutupJikaDiluar);
        return () => document.removeEventListener("pointerdown", tutupJikaDiluar);
    }, [menuBuka]);

    const bisa = (id) => bolehMenu(user.divisi, id);

    const bukaTab = (sub) => {
        if (!tabs.some((t) => t.id === sub.id)) setTabs([...tabs, sub]);
        setTabAktif(sub.id);
        setMenuBuka(null);
    };

    const tabTambahJo = {
        id: "job-order-tambah",
        label: "Tambah Job Order",
        content: <TambahJobOrder onTambahPelanggan={() => bukaTab(tabTambahPelanggan)} />,
    };
    const tabKelolaJo = {
        id: "job-order-kelola",
        label: "Kelola Job Order",
        content: <KelolaJobOrder onTambah={() => bukaTab(tabTambahJo)} />,
    };
    const tabKelolaPelanggan = {
        id: "pelanggan-kelola",
        label: "Kelola Pelanggan",
        content: <KelolaPelanggan onTambah={() => bukaTab(tabTambahPelanggan)} />,
    };

    const menus = [
        {
            id: "job-order",
            label: "Job Order",
            icon: Package,
            subs: [bisa("job-order-kelola") && tabKelolaJo, bisa("job-order-tambah") && tabTambahJo].filter(Boolean),
        },
        {
            id: "pelanggan",
            label: "Pelanggan",
            icon: Users,
            subs: [bisa("pelanggan-kelola") && tabKelolaPelanggan, bisa("pelanggan-tambah") && tabTambahPelanggan].filter(Boolean),
        },
        {
            id: "akun",
            label: "Akun",
            icon: UserRound,
            subs: [bisa("kelola-akun") && tabKelolaAkun, tabProfil].filter(Boolean),
        },
    ].filter((m) => m.subs.length > 0);

    const toggleMenu = (id) => setMenuBuka(menuBuka === id ? null : id);

    const tutupTab = (id) => {
        const idx = tabs.findIndex((t) => t.id === id);
        const baru = tabs.filter((t) => t.id !== id);
        if (tabAktif === id) setTabAktif(baru[Math.max(0, idx - 1)].id);
        setTabs(baru);
    };

    const tabSekarang = tabs.find((t) => t.id === tabAktif);

    return (
        <>
            <aside ref={asideRef} className="group flex md:flex-col w-full md:w-16 md:hover:w-56 shrink-0 md:overflow-hidden bg-slate-600 text-white transition-[width] duration-300 ease-in-out">
                {menus.map((m) => (
                    <div key={m.id} className="relative flex-1 md:flex-none">
                        <ul onClick={() => toggleMenu(m.id)} className={`p-4 flex justify-center md:justify-start gap-4 hover:bg-slate-500 hover:cursor-pointer transition-colors duration-300 ${menuBuka === m.id ? "bg-slate-500" : ""}`}>
                            <m.icon className="stroke-[1.5] shrink-0" />
                            <li className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out md:group-hover:max-w-40 md:group-hover:opacity-100">{m.label}</li>
                            <ChevronDown className={`hidden md:block ml-auto shrink-0 stroke-[1.5] md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 ${menuBuka === m.id ? "rotate-180" : ""}`} />
                        </ul>
                        <div className={`grid absolute bottom-full inset-x-0 md:static bg-slate-700 transition-[grid-template-rows] duration-300 ease-in-out ${menuBuka === m.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                            <ul className="min-h-0 overflow-hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                {m.subs.map((s) => <li key={s.id} onClick={() => bukaTab(s)} className={`py-3 pl-4 pr-4 md:pl-14 whitespace-nowrap text-sm hover:bg-slate-500 hover:cursor-pointer transition-colors duration-300 ${tabAktif === s.id ? "bg-slate-500" : ""}`}>{s.label}</li>)}
                            </ul>
                        </div>
                    </div>
                ))}
            </aside>
            <main className="flex-1 min-w-0 flex flex-col bg-slate-50">
                <div className="flex overflow-x-auto bg-slate-200 border-b border-slate-300">
                    {tabs.map((t) => (
                        <div key={t.id} onClick={() => setTabAktif(t.id)} className={`px-4 py-2 flex items-center gap-2 shrink-0 whitespace-nowrap border-b-2 hover:cursor-pointer transition-colors duration-300 ${tabAktif === t.id ? "bg-slate-50 border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
                            <span>{t.label}</span>
                            {t.id !== beranda.id && <button onClick={(e) => { e.stopPropagation(); tutupTab(t.id); }} className="p-0.5 rounded hover:bg-slate-300 hover:cursor-pointer transition-colors duration-300"><X size={14} /></button>}
                        </div>
                    ))}
                </div>
                <section className="p-4 flex-1 overflow-y-auto">
                    <h1 className="text-lg font-semibold mb-4">{tabSekarang?.label}</h1>
                    {tabSekarang?.content}
                </section>
            </main>
        </>
    );
}
