"use client";

import { useState, useEffect, Dispatch } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MessageCircle, UserPlus, UserMinus, Ban } from "lucide-react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import AvatarWithOnlineStatus from "./AvatarWithOnlineStatus";
import { getGatewayUrl } from "@/lib/gateway";

type RelationshipMode = "friends" | "sent" | "received" | "blocks";

export default function RelationshipManager() {
    const [activeMode, setActiveMode] = useState<RelationshipMode>("friends");
    const { lang } = useLang()!;
    return (
        <div className="w-full">
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as RelationshipMode)}>
                <TabsList className="bg-gray-900 text-white grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="friends">{lang === "eng" ? "Friends" : "Amis"}</TabsTrigger>
                    <TabsTrigger value="sent">{lang === "eng" ? "Sent" : "Envoyés"}</TabsTrigger>
                    <TabsTrigger value="received">{lang === "eng" ? "Received" : "Reçus"}</TabsTrigger>
                    <TabsTrigger value="blocks">{lang === "eng" ? "Blocks" : "Bloqués"}</TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="mt-0 h-[375px] overflow-y-auto">
                    <div className="text-white px-3">
                        <Relatives relationshipMode="friends" />
                    </div>
                </TabsContent>

                <TabsContent value="sent" className="mt-0 h-[375px] overflow-y-auto">
                    <div className="text-white px-3">
                        <Relatives relationshipMode="sent" />
                    </div>
                </TabsContent>

                <TabsContent value="received" className="mt-0 h-[375px] overflow-y-auto">
                    <div className="text-white px-3">
                        <Relatives relationshipMode="received" />
                    </div>
                </TabsContent>

                <TabsContent value="blocks" className="mt-0 h-[375px] overflow-y-auto">
                    <div className="text-white px-3">
                        <Relatives relationshipMode="blocks" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function RlButtons({ relationshipMode, relative, data, setData }: { relationshipMode: string; relative: any; data: any[]; setData: Dispatch<any>}) {
    if (relationshipMode === "sent") {
        return (
            <div className="space-x-4">
                <UserMinus className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => CancelFriendRequest(relative.userId, data, setData)} />
                <Ban className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => BlockUser(relative.userId, data, setData)} />
            </div>
        );
    } else if (relationshipMode === "received") {
        return (
            <div className="space-x-4">
                <UserPlus className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => AcceptFriendRequest(relative.userId, data, setData)} />
                <UserMinus className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => DeclineFriendRequest(relative.userId, data, setData)} />
                <Ban className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => BlockUser(relative.userId, data, setData)} />
            </div>
        );
    } else if (relationshipMode === "blocks") {
        return (
            <div className="space-x-4">
                <UserPlus className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => Unblock(relative.userId, data, setData)} />
            </div>
        );  
    } else if (relationshipMode === "friends") {
        return (
            <div className="space-x-4">
                <Link href={`/users/${relative.username}`}>
                    <MessageCircle className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" />
                </Link>
                <UserMinus className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => RemoveFriend(relative.userId, data, setData)} />
                <Ban className="w-7 h-7 text-gray-400 hover:text-gray-200 cursor-pointer inline" onClick={() => BlockUser(relative.userId, data, setData)} />
            </div>
        );
    }
    return (<></>);
}

function Relatives({ relationshipMode } : {relationshipMode : string}) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { lang } = useLang()!;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            
            let url: string;
            if (relationshipMode === "friends") {
                url = getGatewayUrl("/api/v1/user-mgmt/friends?status=accepted");
            } else if (relationshipMode === "sent") {
                url = getGatewayUrl("/api/v1/user-mgmt/friends?status=sent");
            } else if (relationshipMode === "received") {
                url = getGatewayUrl("/api/v1/user-mgmt/friends?status=received");
            } else if (relationshipMode === "blocks") {
                url = getGatewayUrl("/api/v1/user-mgmt/blocks");
            } else {
                setError("Invalid relationship mode");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(url, {
                    credentials: "include",
                });
                if (!res.ok) {
                    throw new Error(`Error: ${res.status}`);
                }
                const result = await res.json();
                setData(result);
            } catch (err) {
                setError("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [relationshipMode]);

    if (loading) {
        return <div className="space-y-2 flex flex-col items-center justify-center h-[340px] text-sm text-muted-foreground text-center py-4">Loading...</div>;
    }

    if (error) {
        return <div className="space-y-2 flex flex-col items-center justify-center h-[340px] text-sm text-red-500 text-center py-4">Error: {error}</div>;
    }

    if (!data || data.length === 0) {
        return (
            <div className="space-y-2 flex flex-col items-center justify-center h-[340px]">
                <p className="text-sm text-muted-foreground">
                    {relationshipMode === "friends" ? (lang === "eng" ? "Your friends will appear here" : "Vos amis apparaîtront ici") : ""}
                    {relationshipMode === "sent" ? (lang === "eng" ? "Pending friend requests you've sent" : "Demandes d'amis en attente que vous avez envoyées") : ""}
                    {relationshipMode === "received" ? (lang === "eng" ? "Friend requests you've received" : "Demandes d'amis que vous avez reçues") : ""}
                    {relationshipMode === "blocks" ? (lang === "eng" ? "Users you've blocked" : "Utilisateurs que vous avez bloqués") : ""}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 px-1">
            {data.map((relative: any) => (
                <div
                    key={relative.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    <Link href={`/users/${relative.username}`} className="flex items-center gap-3">
                        {relationshipMode === "friends" ? (
                            <AvatarWithOnlineStatus username={relative.username} userId={relative.userId} />
                        ) : (
                            <Avatar className="aspect-square rounded-full overflow-hidden w-10 h-10 text-blue-500 border border-black">
                                <AvatarImage
                                src={getGatewayUrl(`/api/v1/user-mgmt/@${relative.username}/avatar?size=medium`)}
                                className="h-full w-full"
                                />
                                <AvatarFallback className="bg-transparent">
                                <div className="w-full h-full flex justify-center items-center">
                                    <User className="h-[50%] w-[50%] text-white" />
                                </div>
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div>
                            <p className="font-medium">{relative.username}</p>
                        </div>
                    </Link>
                    <RlButtons relationshipMode={relationshipMode} relative={relative} data={data} setData={setData} />
                </div>
            ))}
        </div>
    );
}

export async function BlockUser(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/blocks/${uid}`), {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function AddFriend(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/add`), {
    method: "POST",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function RemoveFriend(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/remove`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function AcceptFriendRequest(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/accept`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function DeclineFriendRequest(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/decline`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function CancelFriendRequest(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/friends/${uid}/cancel`), {
    method: "PATCH",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}

export async function Unblock(uid: string, data: any[], setData: Dispatch<any>) {
    const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/blocks/${uid}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    setData(data.filter(item => item.userId != uid));
  }
}