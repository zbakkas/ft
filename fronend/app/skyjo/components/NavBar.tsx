"use client";
import { Pacifico } from "next/font/google";
import { 
    LogIn,
    ChevronDown,
    Settings,
    LogOut,
    Upload,
    Globe
} from 'lucide-react';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const pacifico = Pacifico({
    subsets: ['latin'],
    weight: ['400']
});

export default function NavBar() {
    const [isLogin, setIsLogin] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [userName, setUserName] = useState("zbakkas");
    const [userImage, setUserImage] = useState("https://cdn.intra.42.fr/users/6d030343555caf95ee7b42b49513b614/zbakkas.jpg");
    const [selectedLanguage, setSelectedLanguage] = useState("English");
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);

    const languages = [
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
        { code: "es", name: "Español", flag: "🇪🇸" },
        { code: "ar", name: "العربية", flag: "🇲🇦" },
        { code: "de", name: "Deutsch", flag: "🇩🇪" }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setUserImage(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        if (value.length <= 10) {
            setUserName(value);
        }
    };

    const handleLanguageChange = (language) => {
        setSelectedLanguage(language.name);
        console.log("Language changed to:", language);
        // Add your language change logic here
    };

    const handleLogout = () => {
        setIsLogin(false);
        setIsDropdownOpen(false);
    };

    const handleDashboard = () => {
        console.log("Navigate to dashboard");
        setIsDropdownOpen(false);
    };

    return (
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border-b border-white/20 px-4 py-3">
            <div className="flex items-center gap-3">
                <Link href={'/'} className={`${pacifico.className} text-2xl p-1`}>SKYjo</Link>
                <div className="flex items-center gap-2">
                    <Link
                    href={"/Leaderboard"} 
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10 text-blue-200 hover:bg-white/20">
                        Leaderboard
                    </Link>
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10 text-blue-200 hover:bg-white/20">
                        Rules
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10 text-blue-200 hover:bg-white/20">
                        About
                    </button>
                </div>
            </div>
            
            <div className="relative" ref={dropdownRef}>
                {isLogin ? (
                    <>
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm font-semibold transition-all duration-200 bg-white/10 text-blue-200 hover:bg-white/20"
                        >
                            <img src={userImage} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                            {userName}
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-blue-900 backdrop-blur-md border border-white/20 rounded-lg shadow-xl py-2 z-50">
                                {/* Dashboard Button */}
                                <Link
                                    onClick={handleDashboard}
                                    href={"/dashboard"}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-200 hover:bg-white/20 transition-all duration-200"
                                >
                                    <Settings size={16} />
                                    Dashboard
                                </Link>
                                
                                <div className="border-t border-white/20 my-2"></div>
                                
                                {/* Change Name */}
                                <div className="px-4 py-3">
                                    <label className="block text-xs text-blue-300 mb-2 font-medium">Change Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={handleNameChange}
                                            maxLength={10}
                                            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-blue-200 placeholder-blue-300/50"
                                            placeholder="Enter your name"
                                        />
                                        <span className="absolute right-3 top-2 text-xs text-blue-300/70">
                                            {userName.length}/10
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Change Image */}
                                <div className="px-4 py-3">
                                    <label className="block text-xs text-blue-300 mb-2 font-medium">Change Profile Image</label>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition-all duration-200 text-blue-200"
                                    >
                                        <Upload size={16} />
                                        Upload Image
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>

                                {/* Language Selection */}
                                <div className="px-4 py-3">
                                    <label className="block text-xs text-blue-300 mb-2 font-medium">
                                        <Globe size={12} className="inline mr-1" />
                                        Language
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {languages.map((language) => (
                                            <button
                                                key={language.code}
                                                onClick={() => handleLanguageChange(language)}
                                                className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-xs rounded-md transition-all duration-200 border ${
                                                    selectedLanguage === language.name
                                                        ? 'bg-gradient-to-br from-blue-500/40 to-blue-600/30 text-blue-100 border-blue-400/60 shadow-sm'
                                                        : 'bg-white/5 text-blue-200 border-white/20 hover:bg-white/15 hover:border-white/30'
                                                }`}
                                            >
                                                <span className="text-sm">{language.flag}</span>
                                                <span className="font-medium leading-tight text-center text-xs">
                                                    {language.code.toUpperCase()}
                                                </span>
                                                {selectedLanguage === language.name && (
                                                    <div className="w-1 h-1 bg-blue-300 rounded-full animate-pulse"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="border-t border-white/20 my-2"></div>
                                
                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <Link
                    href={"/login"} 
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200  text-blue-200 hover:bg-white/20
                    bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700  transform">
                        <LogIn size={16} />
                        Login
                    </Link>
                )}
            </div>
        </div>
    );
}