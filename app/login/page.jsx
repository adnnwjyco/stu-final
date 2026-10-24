import LoginForm from "./login-form";

export default function Login() {
    return (
        <div className="w-dvw min-h-dvh flex justify-center items-center bg-canvas-soft relative overflow-hidden">
            <div className="mesh-hero absolute inset-x-0 top-0 h-72 pointer-events-none" aria-hidden />
            <div className="relative w-full max-w-96 p-6 flex flex-col gap-6 bg-canvas border border-hairline rounded-xl shadow-lift-2 mx-4">
                <div className="flex flex-col gap-1 items-center text-center">
                    <span className="w-2 h-2 rounded-full bg-primary mb-2" aria-hidden />
                    <h1 className="text-[26px] font-light leading-[1.12] tracking-[-0.26px] text-ink">
                        {process.env.NAMA_PERUSAHAAN}
                    </h1>
                </div>
                <LoginForm />
                <p className="text-[13px] tracking-[-0.39px] text-ink-mute text-center">
                    Dibuat oleh <span className="text-ink-secondary">PT Stakoo Teknologi Indonesia</span>
                </p>
            </div>
        </div>
    );
}
