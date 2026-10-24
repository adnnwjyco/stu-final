import LacakJobOrder from "./beranda/lacak-job-order";

export default function BerandaPublik() {
    return (
        <div className="w-dvw min-h-dvh flex flex-col bg-canvas">
            <div className="mesh-hero w-full h-64 shrink-0" aria-hidden />
            <div className="w-full max-w-xl mx-auto -mt-40 md:-mt-44 px-4 pb-16 flex flex-col gap-8">
                <header className="flex flex-col gap-3 text-center">
                    <h1 className="text-[36px] md:text-[48px] font-light leading-[1.05] tracking-[-0.96px] text-ink">
                        Lacak Proses Job Order
                    </h1>
                    <p className="text-[15px] font-light leading-[1.4] text-ink-secondary max-w-md mx-auto">
                        Masukkan nomor job order yang Anda terima untuk melihat proses pengerjaannya.
                    </p>
                </header>
                <LacakJobOrder />
                <footer className="text-[13px] tracking-[-0.39px] text-ink-mute text-center">
                    Dibuat oleh <span className="text-ink-secondary">PT Stakoo Teknologi Indonesia</span>
                </footer>
            </div>
        </div>
    );
}
