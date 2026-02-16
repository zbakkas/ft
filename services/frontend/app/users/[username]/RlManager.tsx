"use client";

import { useLang } from "@/app/context/LangContext";
import { Ban, UserMinus, UserPlus } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRl } from "@/app/context/RlContext";
import { getGatewayUrl } from "@/lib/gateway";

export default function RlManager({ username }: { username: string }) {
    const [uid, setUid] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const { lang } = useLang()!;
    const {relation, setRelation} = useRl()!;

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/@${username}`), {
                    credentials: "include",
                });
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await res.json();
                console.log(data);
                setUid(data.id);
                
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [username]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (lang === "eng") {
      return (
          <>
              {relation === "none" ? (
                  <div onClick={() => AddFriend(uid, setRelation)} className="cursor-pointer m-2">
                  <UserPlus className="inline mb-1 mr-2" />
                  <p className="inline">Add Friend</p>
                  </div>
              ) : relation === "friend" ? (
                  <div onClick={() => RemoveFriend(uid, setRelation)} className="cursor-pointer m-2">
                  <UserMinus className="inline mb-1 mr-2" />
                  <p className="inline">Remove Friend</p>
                  </div>
              ) : relation === "incoming" ? (
                  <>
                  <div onClick={() => AcceptFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                      <UserPlus className="inline mb-1 mr-2" />
                      <p className="inline">Accept Friend Request</p>
                  </div>
                  <div onClick={() => DeclineFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                      <UserMinus className="inline mb-1 mr-2" />
                      <p className="inline">Decline Friend Request</p>
                  </div>
                  </>
              ) : relation === "outgoing" ? (
                  <div onClick={() => CancelFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                  <UserMinus className="inline mb-1 mr-2" />
                  <p className="inline">Cancel Friend Request</p>
                  </div>
              ) : (<></>)}
              {relation != "blocked" ? (
                <div onClick={() => BlockUser(uid, setRelation)} className="cursor-pointer m-2">
                    <Ban className="inline mb-1 mr-2" />
                    <p className="inline">Block User</p>
                </div>
              ) : (
                <div onClick={() => Unblock(uid, username, setRelation)} className="cursor-pointer m-2">
                    <UserPlus className="inline mb-1 mr-2" />
                    <p className="inline">Unblock User</p>
                </div>
              )}
          </>
      );
    } else {
      return (
          <>
              {relation === "none" ? (
                  <div onClick={() => AddFriend(uid, setRelation)} className="cursor-pointer m-2">
                  <UserPlus className="inline mb-1 mr-2" />
                  <p className="inline">Ajouter en ami</p>
                  </div>
              ) : relation === "friend" ? (
                  <div onClick={() => RemoveFriend(uid, setRelation)} className="cursor-pointer m-2">
                  <UserMinus className="inline mb-1 mr-2" />
                  <p className="inline">Supprimer l'ami</p>
                  </div>
              ) : relation === "incoming" ? (
                  <>
                  <div onClick={() => AcceptFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                      <UserPlus className="inline mb-1 mr-2" />
                      <p className="inline">Accepter la demande d'ami</p>
                  </div>
                  <div onClick={() => DeclineFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                      <UserMinus className="inline mb-1 mr-2" />
                      <p className="inline">Refuser la demande d'ami</p>
                  </div>
                  </>
              ) : relation === "outgoing" ? (
                  <div onClick={() => CancelFriendRequest(uid, setRelation)} className="cursor-pointer m-2">
                  <UserMinus className="inline mb-1 mr-2" />
                  <p className="inline">Annuler la demande d'ami</p>
                  </div>
              ) : (<></>)}
              {relation != "blocked" ? (
                <div onClick={() => BlockUser(uid, setRelation)} className="cursor-pointer m-2">
                    <Ban className="inline mb-1 mr-2" />
                    <p className="inline">Bloquer l'utilisateur</p>
                </div>
              ) : (
                <div onClick={() => Unblock(uid, username, setRelation)} className="cursor-pointer m-2">
                    <UserPlus className="inline mb-1 mr-2" />
                    <p className="inline">Débloquer l'utilisateur</p>
                </div>
              )}
          </>
      );
    }
}

export async function BlockUser(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/blocks/${uid}`), {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("blocked");
  }
}

export async function AddFriend(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/add`), {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("outgoing");
  }
}

export async function RemoveFriend(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/remove`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("none");
  }
}

export async function AcceptFriendRequest(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/accept`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("friend");
  }
}

export async function DeclineFriendRequest(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/decline`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("none");
  }
}

export async function CancelFriendRequest(uid: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/cancel`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setRelation("none");
  }
}

export async function Unblock(uid: string, username: string, setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>) {
  const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/blocks/${uid}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    setRelation(await GetRelation(username));
  }
}

export async function GetRelation(username: string) {
  let relation: "none" | "friend" | "blocked" | "incoming" | "outgoing" = "none";
  let res = await fetch(getGatewayUrl("/api/v1/user-mgmt/friends?status=received"), {
      credentials: "include",
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
        credentials: "include",
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
        credentials: "include",
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

