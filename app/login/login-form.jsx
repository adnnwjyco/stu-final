"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
    const [state, action, pending] = useActionState(login, undefined);

    return (
        <form action={action} className="flex flex-col gap-3">
            {state?.errors?.umum && <p className="text-sm text-red-600 text-center">{state.errors.umum[0]}</p>}
            <div className="flex flex-col gap-1">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    autoComplete="username"
                    className="p-2 border border-slate-200 focus:outline-none"
                />
                {state?.errors?.username && <p className="text-sm text-red-600">{state.errors.username[0]}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    className="p-2 border border-slate-200 focus:outline-none"
                />
                {state?.errors?.password && <p className="text-sm text-red-600">{state.errors.password[0]}</p>}
            </div>
            <button
                type="submit"
                disabled={pending}
                className="bg-slate-700 hover:bg-slate-600 hover:cursor-pointer text-white p-2 disabled:opacity-60 disabled:cursor-wait"
            >
                {pending ? "Masuk..." : "Login"}
            </button>
        </form>
    );
}
