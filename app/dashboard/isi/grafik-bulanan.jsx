"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function labelBulan(bulan) {
    const [tahun, bulanIdx] = String(bulan).split("-");
    const nama = NAMA_BULAN[Number(bulanIdx) - 1] ?? bulanIdx;
    return `${nama} ${tahun}`;
}

function TooltipKustom({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 px-3 py-2 text-xs shadow-sm">
            <p className="font-semibold text-slate-700">{labelBulan(label)}</p>
            <p className="text-slate-600 mt-0.5">{payload[0].value} job order diterima</p>
        </div>
    );
}

export default function GrafikBulanan({ data = [] }) {
    if (data.length === 0) {
        return <p className="text-sm text-slate-400 p-4 text-center border border-dashed border-slate-300 bg-white">Belum ada data job order.</p>;
    }

    const grafik = data.map((d) => ({ ...d, label: labelBulan(d.bulan) }));

    return (
        <div className="bg-white border border-slate-200 p-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafik} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TooltipKustom />} cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="jumlah" name="JO diterima" fill="#334155" maxBarSize={48} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
