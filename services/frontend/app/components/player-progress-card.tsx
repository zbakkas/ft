"use client";

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useLang } from "../context/LangContext";

interface PlayerProgressCardProps {
  playerId: string;
  history: Array<{
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
  }>;
}

export default function PlayerProgressCard({ playerId, history }: PlayerProgressCardProps) {
  const parseIds = (value: string) =>
    value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

  const totalWins = history.reduce((acc, game) => {
    if (parseIds(game.winner_id).includes(playerId)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const totalLosses = history.reduce((acc, game) => {
    if (!parseIds(game.winner_id).includes(playerId)) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const totalGames = history.length;

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const progressData = sortedHistory.map((game, index) => {
    const wins = sortedHistory.slice(0, index + 1).reduce((acc, game) => {
      if (parseIds(game.winner_id).includes(playerId)) {
        return acc + 1;
      }
      return acc;
    }, 0);

    const losses = sortedHistory.slice(0, index + 1).reduce((acc, game) => {
      if (!parseIds(game.winner_id).includes(playerId)) {
        return acc + 1;
      }
      return acc;
    }, 0);

    const winRate = totalGames > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    return {
      match: index + 1,
      wins,
      losses,
      winRate,
    };
  });

  const { lang } = useLang()!;
  if (progressData.length === 0) {
    return (
      <Card className="w-full h-full bg-transparent border-none text-white">
        <CardContent className="pt-6 flex flex-col justify-center h-full text-center">
          <div>
            {lang === "fr" ? "Aucune donnée de progression disponible." : "No progress data available."}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="w-full bg-transparent border-none text-white">
      <CardContent className="pt-6 flex flex-col justify-center h-full text-center">
        <div className="flex h-full justify-around text-sm mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[rgba(255,0,0,0.7)]">{totalLosses}</div>
            <div className="text-gray-400">{lang === "eng" ? "Losses" : "Pertes"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[rgba(255,255,255,0.8)]">
              {totalWins + totalLosses}
            </div>
            <div className="text-gray-400">{lang === "eng" ? "Total" : "Total"}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[rgba(0,200,0,0.7)]">{totalWins}</div>
            <div className="text-gray-400">{lang === "eng" ? "Wins" : "Victoires"}</div>
          </div>
        </div>

        <div className="w-full h-[190px]">
          <ChartContainer
            config={{
              winRate: {
                label: "Win Rate %",
                color: "#FFFFFF",
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <XAxis
                  dataKey="match"
                  axisLine={true}
                  tickLine={true}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  height={20}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={true}
                  tickLine={true}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  width={20}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="bg-gray-200 border-gray-500 text-black" />
                  }
                  labelFormatter={(value) => `Match ${value}`}
                />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#FFFFFF" }}
                  activeDot={{ r: 4, fill: "#FFFFFF" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
