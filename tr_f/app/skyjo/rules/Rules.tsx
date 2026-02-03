"use client";

import { Crown, Grid, Trophy, Users, BookOpen, Layers, Zap, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black font-mono relative overflow-hidden text-gray-300">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
            backgroundSize: '40px 40px'
      }}></div>

      {/* Navbar / Header */}
      <nav className="relative z-20 border-b border-white/5 bg-gray-900/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <BookOpen className="text-cyan-400" />
           <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter">
              SKYJO RULES
           </h1>
        </div>
        <Link href="/skyjo" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
           Back to Lobby
        </Link>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* Intro */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
             GAMEPLAY GUIDE
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            This document describes the complete rules. Every rule below defines how cards are used,
            how the match progresses, and how the final winner is determined.
          </p>
        </section>

        {/* 150 Game Cards - Layout Preserved, Style Updated */}
        <section className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600"></div>
          
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
             <Layers className="text-cyan-400" /> 150 Game Cards
          </h2>

          <div className="space-y-6">
            
            {/* -2 cards */}
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-12 text-right text-lg font-bold text-cyan-300">5 ×</div>
              <div className="flex items-center gap-1">
                <div className="w-12 h-16 bg-blue-600 flex items-center justify-center font-bold text-xl rounded text-white border border-white/20 shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                  -2
                </div>
              </div>
            </div>

            {/* 0 cards */}
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-12 text-right text-lg font-bold text-cyan-300">15 ×</div>
              <div className="flex items-center gap-1">
                <div className="w-12 h-16 bg-cyan-500 flex items-center justify-center font-bold text-xl rounded text-black border border-white/20 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  0
                </div>
              </div>
            </div>

            {/* -1 to 12 cards */}
            <div className="flex items-start gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
              <div className="w-12 text-right text-lg font-bold text-cyan-300 pt-4">10 ×</div>
              <div className="flex flex-wrap items-center gap-2">
                
                {/* -1 card */}
                <div className="w-12 h-16 bg-blue-500 flex items-center justify-center font-bold text-xl rounded text-white border border-white/20 shadow-[0_0_5px_rgba(59,130,246,0.3)]">
                  -1
                </div>

                {/* 1–4 green */}
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="w-12 h-16 bg-emerald-500 flex items-center justify-center font-bold text-xl rounded text-black border border-white/20 shadow-[0_0_5px_rgba(16,185,129,0.3)]"
                  >
                    {n}
                  </div>
                ))}

                {/* 5–8 yellow */}
                {[5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="w-12 h-16 bg-yellow-500 flex items-center justify-center font-bold text-xl rounded text-black border border-white/20 shadow-[0_0_5px_rgba(234,179,8,0.3)]"
                  >
                    {n}
                  </div>
                ))}

                {/* 9–12 red */}
                {[9, 10, 11, 12].map((n) => (
                  <div
                    key={n}
                    className="w-12 h-16 bg-red-500 flex items-center justify-center font-bold text-xl rounded text-white border border-white/20 shadow-[0_0_5px_rgba(239,68,68,0.3)]"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Objective & Setup */}
        <div className="grid md:grid-cols-2 gap-8">
           <section className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Trophy className="text-purple-400" size={20} /> Objective
              </h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                 The goal is simple: <strong>Finish with the lowest score.</strong>
                 <br/><br/>
                 Throughout the game, you will swap high-value cards for lower ones, or eliminate entire rows and columns to reduce your point total.
              </p>
           </section>

           <section className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                 <Grid className="text-green-400" size={20} /> Setup
              </h2>
              <ul className="space-y-3 text-sm text-gray-400">
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                    <span>Each player gets a hidden grid of cards (up to 4x4).</span>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                    <span>Two cards are revealed at the start ("First Head Cards").</span>
                 </li>
                 <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2"></div>
                    <span>High score goes first.</span>
                 </li>
              </ul>
           </section>
        </div>

        {/* Game Modes */}
        <section>
          <div className="flex items-center gap-4 mb-6">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
             <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Game Modes</h2>
             <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/20 p-6 rounded-xl hover:border-blue-500/40 transition-colors">
               <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <Zap size={18} /> Limited Turns
               </h3>
               <p className="text-sm text-gray-400">
                  Play a fixed number of turns (e.g., 8 turns). When the limit is reached, the game ends immediately. Best for quick matches.
               </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/20 p-6 rounded-xl hover:border-purple-500/40 transition-colors">
               <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                  <Crown size={18} /> Max Score
               </h3>
               <p className="text-sm text-gray-400">
                  Play continues until a player hits the score limit (e.g., 100 points). The player with the lowest score at that moment wins.
               </p>
            </div>
          </div>
        </section>

        {/* Mechanics */}
        <section className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative">
           <div className="grid md:grid-cols-2 gap-12">
              
              {/* Turn Flow */}
              <div>
                 <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Turn Flow</h2>
                 <ol className="space-y-4 text-sm text-gray-400 list-decimal list-inside marker:text-cyan-500 marker:font-bold">
                    <li>Draw a card from the deck or the discard pile.</li>
                    <li>Swap it with any card in your grid (hidden or visible).</li>
                    <li>If you swap, discard the old card face up.</li>
                    <li>If you drew from the deck and don't want it, discard it and reveal one hidden card.</li>
                 </ol>
              </div>

              {/* Special Rules */}
              <div>
                 <h2 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-2">Special Mechanics</h2>
                 <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-red-500/20">
                       <h3 className="text-red-400 text-sm font-bold mb-1 flex items-center gap-2">
                          <Trash2 size={14} /> Card Elimination
                       </h3>
                       <p className="text-xs text-gray-400">
                          If you line up identical cards in a row or column (depending on settings), the entire line is discarded, reducing your score!
                       </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-yellow-500/20">
                       <h3 className="text-yellow-400 text-sm font-bold mb-1 flex items-center gap-2">
                          <CheckCircle2 size={14} /> Round End
                       </h3>
                       <p className="text-xs text-gray-400">
                          When a player reveals all their cards, every other player gets one final turn. Then scores are tallied.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-8 text-center">
          <p className="text-gray-600 text-xs uppercase tracking-widest">
             © {new Date().getFullYear()} Skyjo Online • Designed for Speed & Fun
          </p>
        </footer>

      </main>
    </div>
  );
}