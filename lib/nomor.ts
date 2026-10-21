const BULAN_ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function keRomawiBulan(bulan: number): string | null {
    return BULAN_ROMAWI[bulan - 1] ?? null;
}

export function bulanDariRomawi(romawi: string): number | null {
    const i = BULAN_ROMAWI.indexOf(romawi);
    return i >= 0 ? i + 1 : null;
}

export function susunNomorPrp(tanggalIso: string, nomorManual: string): string | null {
    const m = tanggalIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const romawi = keRomawiBulan(Number(m[2]));
    if (!romawi) return null;
    const nomor = nomorManual.replace(/\D/g, "").padStart(4, "0");
    return `PRP/${m[1]}/${romawi}/${nomor}`;
}

export function normalisasiNomor(raw: string): string | null {
    const s = raw.trim().toUpperCase().replace(/\s+/g, "");

    const prp = s.match(/^PRP\/?(\d{4})\/?([IVX]+)\/?(\d{1,6})$/);
    if (prp) {
        if (bulanDariRomawi(prp[2]) === null) return null;
        return `PRP/${prp[1]}/${prp[2]}/${prp[3].padStart(4, "0")}`;
    }

    const legacy = s.match(/^(?:JO\/?STU\/?)?(\d{1,6})$/);
    if (legacy) return `JO/STU/${legacy[1].padStart(4, "0")}`;

    return null;
}
