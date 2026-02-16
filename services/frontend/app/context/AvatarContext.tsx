"use client";

import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

type AvatarContextType = {
    version: number;
    setVersion: Dispatch<SetStateAction<number>>
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [version, setVersion] = useState(Date.now())
    return <AvatarContext.Provider value={{ version, setVersion }}>{children}</AvatarContext.Provider>
}

export const useAvatar = () => useContext(AvatarContext)