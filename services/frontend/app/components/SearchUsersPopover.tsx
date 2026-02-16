"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Search, User } from "lucide-react";
import debounce from "lodash.debounce";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import Link from "next/link";
import { getGatewayUrl } from "@/lib/gateway";

type User = {
  id: number;
  username: string;
  avatarPath: string;
  avatarName: string;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function UserSearchPopover() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchUsers = React.useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          getGatewayUrl(`/api/v1/user-mgmt/users?q=${encodeURIComponent(q)}`),
          {
          credentials: "include",
          }
        );
        if (!res.ok) {
          console.error("fetch users failed", res.status, res.statusText);
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  React.useEffect(() => {
    fetchUsers(query);
  }, [query, fetchUsers]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="rounded-full transition">
          <Search className="h-[20px] sm:h-[25px] lg:h-[30px] w-auto text-white" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 w-60 sm:w-72 lg:w-80 rounded-xl bg-white shadow-lg border border-gray-200 p-4"
        >
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-black w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />

          <div className="mt-3 max-h-40 sm:max-h-52 lg:max-h-60 overflow-y-auto pr-1">
            {loading ? (
              <div className="text-sm text-gray-500">Searching...</div>
            ) : results.length === 0 && query ? (
              <div className="text-sm text-gray-500">No users found</div>
            ) : (
              <ul className="space-y-2">
                {Array.isArray(results) && results.map((user) => (
                  <Link href={`/users/${user.username}`} key={user.id}>
                    <li
                      className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 p-2 rounded-md cursor-pointer"
                    >
                      <Avatar className="aspect-square rounded-full overflow-hidden w-5 h-5 text-blue-500 border border-black">
                        <AvatarImage
                          src={getGatewayUrl(`/api/v1/user-mgmt/@${user.username}/avatar?size=small`)}
                          className="h-full w-full"
                        />
                        <AvatarFallback>
                          <div className="w-full h-full flex justify-center items-center">
                            <User className="h-[75%] w-[75%] text-black" />
                          </div>
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.username}</div>
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
