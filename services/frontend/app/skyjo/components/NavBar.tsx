"use client";
import { Pacifico } from "next/font/google";
import Link from "next/link";
import { useLang } from "@/app/context/LangContext";

const pacifico = Pacifico({
    subsets: ['latin'],
    weight: ['400']
});

export default function NavBar() {
    const { lang } = useLang()!;
    return (
        <div className="sticky top-0 z-50 flex items-center justify-between bg-gray-900/80 backdrop-blur-md border-b border-cyan-500/20 px-6 py-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-8">
                {/* Neon Logo */}
                <Link href={'/skyjo'} className={`${pacifico.className} text-3xl p-1 relative group`}>
                    <span className="absolute -inset-1 blur opacity-40 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg group-hover:opacity-75 transition duration-200"></span>
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                        SKYjo
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href={"/"} 
                        className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 text-gray-400 hover:text-purple-400 hover:bg-white/5 border border-transparent hover:border-purple-500/30"
                    >{lang === "eng" ? "Home" : "Accueil"}
                    </Link>
                    <Link
                        href={"/skyjo/dashboard"} 
                        className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 text-gray-400 hover:text-cyan-400 hover:bg-white/5 border border-transparent hover:border-cyan-500/30"
                    >
                        {lang === "eng" ? "Dashboard" : "Tableau de Bord"}
                    </Link>
                    
                    <Link
                        href={"/skyjo/rules"} 
                        className="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 text-gray-400 hover:text-purple-400 hover:bg-white/5 border border-transparent hover:border-purple-500/30"
                    >
                        {lang === "eng" ? "Rules" : "Règles"}
                        Rules
                    </Link>
                    
                </div>
            </div>
        </div>
    );
}