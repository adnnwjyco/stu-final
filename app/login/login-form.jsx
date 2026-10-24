"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { KELAS_INPUT, KELAS_LABEL, KELAS_TOMBOL } from "../dashboard/isi/util";

export default function LoginForm() {
    const [state, action, pending] = useActionState(login, undefined);

    return (
        <form action={action} className="flex flex-col gap-3">
            {state?.errors?.umum && <p className="text-[13px] text-ruby text-center">{state.errors.umum[0]}</p>}
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL} htmlFor="username">
                    Username
                </label>
                <input id="username" type="text" name="username" autoComplete="username" className={KELAS_INPUT} />
                {state?.errors?.username && <p className="text-[13px] text-ruby">{state.errors.username[0]}</p>}
            </div>
            <div className="flex flex-col gap-2">
                <label className={KELAS_LABEL} htmlFor="password">
                    Password
                </label>
                <input id="password" type="password" name="password" autoComplete="current-password" className={KELAS_INPUT} />
                {state?.errors?.password && <p className="text-[13px] text-ruby">{state.errors.password[0]}</p>}
            </div>
            <button type="submit" disabled={pending} className={`${KELAS_TOMBOL} mt-1`}>
                {pending ? "Masuk..." : "Masuk"}
            </button>
        </form>
    );
}
