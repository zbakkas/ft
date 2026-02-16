import { cookies } from "next/headers";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { getGatewayUrl } from "@/lib/gateway";

export async function verify(): Promise<boolean> {
    const cookieStore: ReadonlyRequestCookies = await cookies();
    const token: string | null = cookieStore.get("token")?.value || null;
    if (!token) {
        return false;
    }
    const res = await fetch(getGatewayUrl("/api/v1/auth/verify"), {
        headers: {
            Cookie: `token=${token}`,
        },
    });
    if (res.ok) {
        return true;
    } else {
        return false;
    }
}