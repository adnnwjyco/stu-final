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

const KUNCI_TAB = "stu-tab-dashboard";

export default function Dashboard() {
    const user = useUser();
    const [menuBuka, setMenuBuka] = useState(null);
    const [tabTerbuka, setTabTerbuka] = useState([beranda.id]);
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
        setTabTerbuka((sebelumnya) => (sebelumnya.includes(sub.id) ? sebelumnya : [...sebelumnya, sub.id]));
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

    const tabDariId = {
        [beranda.id]: beranda,
        [tabProfil.id]: tabProfil,
        [tabKelolaAkun.id]: tabKelolaAkun,
        [tabTambahPelanggan.id]: tabTambahPelanggan,
        [tabTambahJo.id]: tabTambahJo,
        [tabKelolaJo.id]: tabKelolaJo,
        [tabKelolaPelanggan.id]: tabKelolaPelanggan,
    };

    useEffect(() => {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(KUNCI_TAB));
        } catch {
            return;
        }
        const urut = ["beranda", ...((Array.isArray(data?.terbuka) && data.terbuka) || [])]
            .filter((id, i, arr) => arr.indexOf(id) === i)
            .filter((id) => id === "beranda" || (tabDariId[id] && bisa(id)));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (urut.length > 1) setTabTerbuka(urut);
        if (data?.aktif && urut.includes(data.aktif)) setTabAktif(data.aktif);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(KUNCI_TAB, JSON.stringify({ terbuka: tabTerbuka, aktif: tabAktif }));
        } catch {
            // localStorage tidak tersedia — abaikan
        }
    }, [tabTerbuka, tabAktif]);

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
        const idx = tabTerbuka.indexOf(id);
        const baru = tabTerbuka.filter((t) => t !== id);
        if (tabAktif === id) setTabAktif(baru[Math.max(0, idx - 1)]);
        setTabTerbuka(baru);
    };

    const tabs = tabTerbuka.map((id) => tabDariId[id]).filter(Boolean);
    const tabSekarang = tabDariId[tabAktif] ?? beranda;

    return (
        <>
            <aside
                ref={asideRef}
                className="group flex md:flex-col w-full md:w-16 md:hover:w-56 shrink-0 md:overflow-hidden bg-brand-dark text-white transition-[width] duration-300 ease-in-out"
            >
                {menus.map((m) => (
                    <div key={m.id} className="relative flex-1 md:flex-none">
                        <ul
                            onClick={() => toggleMenu(m.id)}
                            className={`p-4 flex justify-center md:justify-start gap-4 hover:bg-white/8 hover:cursor-pointer transition-colors duration-200 ${
                                menuBuka === m.id ? "bg-white/12" : ""
                            }`}
                        >
                            <m.icon className="stroke-[1.5] shrink-0" />
                            <li className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out md:group-hover:max-w-40 md:group-hover:opacity-100 text-[14px]">
                                {m.label}
                            </li>
                            <ChevronDown
                                className={`hidden md:block ml-auto shrink-0 stroke-[1.5] md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 ${
                                    menuBuka === m.id ? "rotate-180" : ""
                                }`}
                            />
                        </ul>
                        <div
                            className={`grid absolute top-full inset-x-0 md:static bg-brand-dark border-b border-white/10 md:border-t md:border-b-0 md:border-white/10 transition-[grid-template-rows] duration-300 ease-in-out ${
                                menuBuka === m.id ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                        >
                            <ul className="min-h-0 overflow-hidden md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                {m.subs.map((s) => (
                                    <li
                                        key={s.id}
                                        onClick={() => bukaTab(s)}
                                        className={`py-3 pl-4 pr-4 md:pl-14 whitespace-nowrap text-[14px] hover:bg-white/8 hover:cursor-pointer transition-colors duration-200 ${
                                            tabAktif === s.id ? "bg-primary text-white" : "text-white/70"
                                        }`}
                                    >
                                        {s.label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </aside>
            <main className="flex-1 min-w-0 min-h-0 flex flex-col bg-canvas-soft">
                <div className="sticky top-0 z-10 flex overflow-x-auto bg-canvas border-b border-hairline">
                    {tabs.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => setTabAktif(t.id)}
                            className={`px-4 py-2.5 flex items-center gap-2 shrink-0 whitespace-nowrap border-b-2 hover:cursor-pointer transition-colors duration-200 text-[14px] ${
                                tabAktif === t.id
                                    ? "bg-canvas border-primary text-ink"
                                    : "border-transparent text-ink-mute hover:text-ink"
                            }`}
                        >
                            <span>{t.label}</span>
                            {t.id !== beranda.id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        tutupTab(t.id);
                                    }}
                                    aria-label={`Tutup ${t.label}`}
                                    className="p-0.5 rounded-full text-ink-mute hover:bg-hairline hover:text-ink hover:cursor-pointer transition-colors duration-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <section className="p-4 md:p-6 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <h1 className="text-[22px] font-normal leading-[1.1] tracking-[-0.22px] text-ink mb-5">{tabSekarang?.label}</h1>
                    {tabSekarang?.content}
                    <footer className="mt-10 pt-4 border-t border-hairline text-[13px] tracking-[-0.39px] text-ink-mute">
                        Dibuat oleh <span className="text-ink-secondary">PT Stakoo Teknologi Indonesia</span>
                    </footer>
                </section>
            </main>
        </>
    );
}
