import LoginForm from "./login-form";

export default function Login() {
    return (
        <div className="w-dvw h-dvh flex justify-center items-center">
            <div className="w-100 p-4 flex flex-col gap-6">
                <h1 className="text-center text-2xl">{process.env.NAMA_PERUSAHAAN}</h1>
                <LoginForm />
                <h1 className="text-sm text-slate-400 text-center">Powered by PT Stakoo Teknologi Indonesia</h1>
            </div>
        </div>
    );
}
