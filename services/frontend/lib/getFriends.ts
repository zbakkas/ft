import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { getGatewayUrl } from "@/lib/gateway";

export async function getFriends() {
    const cookieStore: ReadonlyRequestCookies = await cookies();
    const token: string | null = cookieStore.get("token")?.value || null;
    
    const res = await fetch(getGatewayUrl("/api/v1/user-mgmt/friends?status=accepted"), {
        headers: {
            Cookie: `token=${token}`,
        },
    });
    if (res.ok) {
        const data = await res.json();
        return data.friends || [];
    } else {
        return [];
    }
}