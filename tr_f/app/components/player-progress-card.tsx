"use client";

import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../context/LangContext";

interface PlayerProgressCardProps {
  playerName: string;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  progressData: Array<{
    match: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;
}

export default function PlayerProgressCard({
  totalWins = 24,
  totalLosses = 8,
  progressData = [
    { match: 0, wins: 0, losses: 0, winRate: 0 },
    { match: 5, wins: 4, losses: 1, winRate: 80 },
    { match: 10, wins: 8, losses: 2, winRate: 80 },
    { match: 15, wins: 11, losses: 4, winRate: 73 },
    { match: 20, wins: 16, losses: 4, winRate: 80 },
    { match: 25, wins: 20, losses: 5, winRate: 80 },
    { match: 32, wins: 24, losses: 8, winRate: 75 },
  ],
}: PlayerProgressCardProps) {
  if (progressData.length === 0) {
    return (
      <Card className="w-full h-full bg-transparent border-none text-white">
        <CardContent className="pt-6 flex flex-col justify-center h-full text-center">
          <div>No progress data available.</div>
        </CardContent>
      </Card>
  );
  }
  const { lang } = useLang()!;
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
