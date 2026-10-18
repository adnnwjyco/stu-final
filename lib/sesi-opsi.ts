export const NAMA_COOKIE_SESI = "stu_session";

export const opsiSesi = {
    password: process.env.SESSION_PASSWORD ?? "",
    cookieName: NAMA_COOKIE_SESI,
    ttl: Number(process.env.SESSION_DURATION_HOURS ?? 168) * 60 * 60,
    cookieOptions: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
    },
};
