import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { getGatewayUrl } from "@/lib/gateway";

export async function getLang(): Promise<string> {
    const cookieStore: ReadonlyRequestCookies = await cookies();
    const token: string | null = cookieStore.get("token")?.value || null;
    if (!token) {
        return "eng";
    }
    const res = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
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