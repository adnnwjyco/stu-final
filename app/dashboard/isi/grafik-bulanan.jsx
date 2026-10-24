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
        <div className="bg-canvas border border-hairline px-3 py-2 text-[13px] rounded-lg shadow-lift-2">
            <p className="font-normal text-ink">{labelBulan(label)}</p>
            <p className="tnum text-ink-mute mt-0.5">{payload[0].value} job order diterima</p>
        </div>
    );
}

export default function GrafikBulanan({ data = [] }) {
    if (data.length === 0) {
        return (
            <p className="text-[14px] text-ink-mute p-8 text-center border border-dashed border-hairline rounded-xl bg-canvas">
                Belum ada data job order.
            </p>
        );
    }

    const grafik = data.map((d) => ({ ...d, label: labelBulan(d.bulan) }));

    return (
        <div className="bg-canvas border border-hairline rounded-xl p-5 shadow-lift-1" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafik} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e8ee" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748d", fontWeight: 300 }} tickLine={false} axisLine={{ stroke: "#e3e8ee" }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748d", fontWeight: 300 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<TooltipKustom />} cursor={{ fill: "#f6f9fc" }} />
                    <Bar dataKey="jumlah" name="JO diterima" fill="#533afd" maxBarSize={48} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
