import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";

export async function getLang(): Promise<string> {
    const cookieStore: ReadonlyRequestCookies = await cookies();
    const token: string | null = cookieStore.get("token")?.value || null;
    if (!token) {
        return "eng";
    }
    const API_URL = process.env.API_URL || "http://localhost:3000";
    const res = await fetch(`${API_URL}/api/v1/user-mgmt/me`, {
        headers: {
            Cookie: `token=${token}`,
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data.language || 'eng';
    } else {
        return "eng"
    }
}