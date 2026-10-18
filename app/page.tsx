import LacakJobOrder from "./beranda/lacak-job-order";

export default function BerandaPublik() {
    return (
        <div className="w-dvw min-h-dvh flex justify-center p-4">
            <div className="w-full max-w-140 my-auto p-4 flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-center text-2xl">Lacak Proses Job Order</h1>
                    <p className="text-center text-sm text-slate-500">
                        Masukkan nomor job order yang Anda terima untuk melihat proses pengerjaannya.
                    </p>
                </div>
                <LacakJobOrder />
                <p className="text-sm text-slate-400 text-center">Powered by PT Stakoo Teknologi Indonesia</p>
            </div>
        </div>
    );
}
