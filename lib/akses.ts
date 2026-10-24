export type Divisi =
    | "admin"
    | "manjemen"
    | "desainer"
    | "sheet_metal"
    | "expanding"
    | "piping_brazing"
    | "perakitan_indoor"
    | "perakitan_outdoor"
    | "quality_assurance"
    | "gudang";

export type Pengguna = { id: string; username: string; divisi: Divisi };

export const DAFTAR_DIVISI: Divisi[] = [
    "admin",
    "manjemen",
    "desainer",
    "sheet_metal",
    "expanding",
    "piping_brazing",
    "perakitan_indoor",
    "perakitan_outdoor",
    "quality_assurance",
    "gudang",
];

export const LABEL_DIVISI: Record<Divisi, string> = {
    admin: "Admin",
    manjemen: "Manjemen",
    desainer: "Desainer",
    sheet_metal: "Sheet Metal",
    expanding: "Expanding",
    piping_brazing: "Piping & Brazing",
    perakitan_indoor: "Perakitan Indoor",
    perakitan_outdoor: "Perakitan Outdoor",
    quality_assurance: "Quality Assurance",
    gudang: "Gudang",
};

export const PIPELINE: Divisi[] = [
    "desainer",
    "sheet_metal",
    "expanding",
    "piping_brazing",
    "perakitan_indoor",
    "perakitan_outdoor",
    "quality_assurance",
    "gudang",
];

export function divisiSetelah(divisi: Divisi | null): Divisi | null {
    if (!divisi) return null;
    const i = PIPELINE.indexOf(divisi);
    if (i < 0 || i >= PIPELINE.length - 1) return null;
    return PIPELINE[i + 1];
}

export function persentaseDivisi(divisi: Divisi | null): number {
    if (!divisi) return 0;
    const i = PIPELINE.indexOf(divisi);
    if (i < 0) return 0;
    return Math.round(((i + 1) / (PIPELINE.length + 1)) * 100);
}

export function divisiValid(x: unknown): x is Divisi {
    return typeof x === "string" && (DAFTAR_DIVISI as string[]).includes(x);
}

export type Aksi = "tambah_job_order" | "lihat_semua_job_order" | "kelola_pelanggan" | "kelola_akun";

export const PEMBOLEH_AKSI: Record<Aksi, Divisi[]> = {
    tambah_job_order: ["admin", "manjemen"],
    lihat_semua_job_order: ["admin", "manjemen", "quality_assurance"],
    kelola_pelanggan: ["admin", "manjemen"],
    kelola_akun: ["admin"],
};

export function bolehAksi(divisi: Divisi, aksi: Aksi): boolean {
    return PEMBOLEH_AKSI[aksi].includes(divisi);
}

export const MENU_PER_DIVISI: Record<Divisi, string[]> = {
    admin: ["job-order-kelola", "job-order-tambah", "pelanggan-kelola", "pelanggan-tambah", "kelola-akun", "profil"],
    manjemen: ["job-order-kelola", "job-order-tambah", "pelanggan-kelola", "pelanggan-tambah", "profil"],
    quality_assurance: ["job-order-kelola", "profil"],
    desainer: ["job-order-kelola", "profil"],
    sheet_metal: ["job-order-kelola", "profil"],
    expanding: ["job-order-kelola", "profil"],
    piping_brazing: ["job-order-kelola", "profil"],
    perakitan_indoor: ["job-order-kelola", "profil"],
    perakitan_outdoor: ["job-order-kelola", "profil"],
    gudang: ["job-order-kelola", "profil"],
};

export function bolehMenu(divisi: Divisi, idMenu: string): boolean {
    return MENU_PER_DIVISI[divisi].includes(idMenu);
}

export function bolehKelolaJo(divisi: Divisi, divisiPengerjaan: Divisi | null): boolean {
    return divisi === "admin" || (divisiPengerjaan !== null && divisi === divisiPengerjaan);
}
