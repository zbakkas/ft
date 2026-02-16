"use client";

import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

type LangContextType = {
    lang: string;
    setLang: Dispatch<SetStateAction<string>>
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const LangContextProvider = ({ 
    children,
    initialLang = "eng"
}: { 
    children: React.ReactNode;
    initialLang?: string;
}) => {
    const [lang, setLang] = useState(initialLang);

    return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)