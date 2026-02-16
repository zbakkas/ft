"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "../context/LangContext";
import { getGatewayUrl } from "@/lib/gateway";

interface MatchItem {
  id: number;
  game_id: string;
  player1_id: string;
  player1_score: number;
  player2_id: string;
  player2_score: number;
  winner_id: string;
  game_mode: string;
  duration: number;
  timestamp: string;
}

interface MatcheHistoryProps {
  playerId?: string;
  history?: MatchItem[];
}

const defaultHistory: MatchItem[] = [
  {
    id: 3,
    game_id: "6VNCEU",
    player1_id: "019aa74f-3870-76b3-98ba-b17db19bd2b2,019aa750-3d30-7840-ae20-c9fc59ee6cc0",
    player1_score: 7,
    player2_id: "019aa752-b2dc-7bd2-abc3-8b19605bfccd,019aac64-8b53-7df2-8e0a-51e88422d56e",
    player2_score: 4,
    winner_id: "019aa74f-3870-76b3-98ba-b17db19bd2b2,019aa750-3d30-7840-ae20-c9fc59ee6cc0",
    game_mode: "2v2",
    duration: 16148,
    timestamp: "2026-02-08 09:50:00"
  },
  {
    id: 2,
    game_id: "P0GPVO",
    player1_id: "019aa74f-3870-76b3-98ba-b17db19bd2b2",
    player1_score: 2,
    player2_id: "019aa750-3d30-7840-ae20-c9fc59ee6cc0",
    player2_score: 7,
    winner_id: "019aa750-3d30-7840-ae20-c9fc59ee6cc0",
    game_mode: "1v1",
    duration: 22930,
    timestamp: "2026-02-07 13:50:48",
  },
  {
    id: 1,
    game_id: "NC78HQ",
    player1_id: "019aa750-3d30-7840-ae20-c9fc59ee6cc0",
    player1_score: 0,
    player2_id: "019aa74f-3870-76b3-98ba-b17db19bd2b2",
    player2_score: 7,
    winner_id: "019aa74f-3870-76b3-98ba-b17db19bd2b2",
    game_mode: "1v1",
    duration: 15080,
    timestamp: "2026-02-07 13:49:59",
  },
];

export default function MatcheHistory({ playerId, history }: MatcheHistoryProps) {
  const { lang } = useLang() ?? { lang: "eng" };
  const labels = useMemo(
    () =>
      lang === "fr"
        ? { win: "Victoire", loss: "Défaite" }
        : { win: "Win", loss: "Loss" },
    [lang]
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(playerId ?? null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<MatchItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const parseIds = (value: string) =>
    value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

  const sortedHistory = useMemo(() => {
    return [...history].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [history]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (playerId) {
        setCurrentUserId(playerId);
      }
      try {
        const res = await fetch(getGatewayUrl("/api/v1/user-mgmt/me"), {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch current user");
        }
        const data = await res.json();
        setCurrentUserId((prev) => prev ?? data.id ?? null);
        setCurrentUsername(data.username ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    loadCurrentUser();
  }, [playerId]);

  useEffect(() => {
    const loadOpponents = async () => {
      if (!currentUserId) return;
      try {
        const allIds = new Set<string>();
        sortedHistory.forEach((match) => {
          parseIds(match.player1_id).forEach((id) => allIds.add(id));
          parseIds(match.player2_id).forEach((id) => allIds.add(id));
        });

        const opponentIds = Array.from(allIds).filter((id) => id !== currentUserId);

        const results = await Promise.all(
          opponentIds.map(async (id) => {
            const res = await fetch(getGatewayUrl(`/api/v1/user-mgmt/${id}`), {
              credentials: "include",
            });
            if (!res.ok) {
              return [id, "Unknown"] as const;
            }
            const data = await res.json();
            return [id, data.username ?? "Unknown"] as const;
          })
        );

        const map: Record<string, string> = {};
        results.forEach(([id, name]) => {
          map[id] = name;
        });
        setOpponentNames(map);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadOpponents();
  }, [currentUserId, sortedHistory]);

  useEffect(() => {
    if (!hoveredMatch || !tooltipRef.current) return;
    const { width, height } = tooltipRef.current.getBoundingClientRect();
    setTooltipSize({ width, height });
  }, [hoveredMatch]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-gray-400">
        Loading match history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-red-400">
        {error}
      </div>
    );
  }

  if (sortedHistory.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-white">
        {lang === "fr" ? "Aucun match pour l'instant." : "No matches yet."}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full p-4">
      <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto">
        {sortedHistory.map((match) => {
          const winnerIds = parseIds(match.winner_id);
          const isWin = winnerIds.includes(currentUserId ?? "");

          const team1Ids = parseIds(match.player1_id);
          const team2Ids = parseIds(match.player2_id);
          const isOnTeam1 = team1Ids.includes(currentUserId ?? "");
          const opponentIds = isOnTeam1 ? team2Ids : team1Ids;
          const opponentEntries = opponentIds.map((id) => ({
            id,
            name: opponentNames[id] ?? "Unknown",
          }));

          return (
            <div
              key={match.id}
              onMouseEnter={(event) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const rawX = event.clientX - rect.left + 12;
                const rawY = event.clientY - rect.top + 12;
                const maxX = Math.max(rect.width - tooltipSize.width - 8, 0);
                const maxY = Math.max(rect.height - tooltipSize.height - 8, 0);
                setTooltipPos({
                  x: Math.min(Math.max(rawX, 0), maxX),
                  y: Math.min(Math.max(rawY, 0), maxY),
                });
                setHoveredMatch(match);
              }}
              onMouseLeave={() => setHoveredMatch(null)}
              onMouseMove={(event) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const rawX = event.clientX - rect.left + 12;
                const rawY = event.clientY - rect.top + 12;
                const maxX = Math.max(rect.width - tooltipSize.width - 8, 0);
                const maxY = Math.max(rect.height - tooltipSize.height - 8, 0);
                setTooltipPos({
                  x: Math.min(Math.max(rawX, 0), maxX),
                  y: Math.min(Math.max(rawY, 0), maxY),
                });
              }}
              className={`flex items-center justify-between rounded-md px-4 py-3 text-sm text-white border border-gray-600 ${
                isWin ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <div className="flex-1 text-left font-medium truncate">
                vs{" "}
                {opponentEntries.map((opponent, index) => {
                  const isUnknown = opponent.name === "Unknown";
                  const href =
                    currentUsername && opponent.name === currentUsername
                      ? "/me"
                      : `/users/${encodeURIComponent(opponent.name)}`;
                  const content = isUnknown ? (
                    <span>{opponent.name}</span>
                  ) : (
                    <Link
                      href={href}
                      className="underline decoration-dotted underline-offset-2 hover:text-white"
                    >
                      {opponent.name}
                    </Link>
                  );

                  return (
                    <span key={opponent.id}>
                      {content}
                      {index < opponentEntries.length - 1 ? " & " : ""}
                    </span>
                  );
                })}
              </div>
              <div className="flex-1 text-center text-gray-300 uppercase">{match.game_mode}</div>
              <div className={`flex-1 text-right font-semibold ${isWin ? "text-green-300" : "text-red-300"}`}>
                {isWin ? labels.win : labels.loss}
              </div>
            </div>
          );
        })}
      </div>
      {hoveredMatch && (
        <div
          ref={tooltipRef}
          className="absolute z-50 rounded-md border border-gray-700 bg-black/90 px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="text-gray-300">Score</div>
          <div className="font-semibold">
            {hoveredMatch.player1_score} - {hoveredMatch.player2_score}
          </div>
          <div className="mt-1 text-gray-300">Date</div>
          <div className="font-semibold">
            {new Date(hoveredMatch.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
