"use client";

import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

type OnlineContextType = {
    online: any[];
    setOnline: Dispatch<SetStateAction<any[]>>
}

const OnlineContext = createContext<OnlineContextType | undefined>(undefined);

export const OnlineContextProvider = ({ 
    children
}: { 
    children: React.ReactNode;
    initialOnline?: any[];
}) => {
    const [online, setOnline] = useState<any[]>([]);

    return <OnlineContext.Provider value={{ online, setOnline }}>{children}</OnlineContext.Provider>
}

export const useOnline = () => useContext(OnlineContext)