import { getGatewayUrl } from "@/lib/gateway";
export async function GetRelation(username: string, token: string | null) {
  let relation: "none" | "friend" | "blocked" | "incoming" | "outgoing" = "none";
  let res = await fetch(getGatewayUrl("/api/v1/user-mgmt/friends?status=received"), {
        headers: {
            Cookie: `token=${token}`,
        },
  });
  if (res.status === 200) {
    let received = await res.json();
    if (received.find((user: any) => user.username === username)) {
        relation = "incoming";
    }
  }
  if (relation != "none") {
    return relation;
  }
  res = await fetch(getGatewayUrl("/api/v1/user-mgmt/friends?status=sent"), {
        headers: {
            Cookie: `token=${token}`,
        },
  });
  if (res.status === 200) {
    let sent = await res.json();
    if (sent.find((user: any) => user.username === username)) {
      relation = "outgoing";
    }
  }
  if (relation != "none") {
    return relation;
  }
  res = await fetch(getGatewayUrl("/api/v1/user-mgmt/friends?status=accepted"), {
        headers: {
            Cookie: `token=${token}`,
        },
  });
  if (res.status === 200) {
    let friends = await res.json();
    if (friends.find((user: any) => user.username === username)) {
      relation = "friend";
    }
  }
  if (relation != "none") {
    return relation;
  }
    res = await fetch(getGatewayUrl("/api/v1/user-mgmt/blocks"), {
        credentials: "include",
  });
  if (res.status === 200) {
    let friends = await res.json();
    if (friends.find((user: any) => user.username === username)) {
      relation = "blocked";
    }
  }
  return relation;
}
