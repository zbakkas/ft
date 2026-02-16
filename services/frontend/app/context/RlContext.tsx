"use client";

import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

type RlContextType = {
    relation: "none" | "friend" | "blocked" | "incoming" | "outgoing";
    setRelation: Dispatch<SetStateAction<"none" | "friend" | "blocked" | "incoming" | "outgoing">>
}

const RlContext = createContext<RlContextType | undefined>(undefined);

export const RlContextProvider = ({ 
    children,
    initialRelation
}: { 
    children: React.ReactNode;
    initialRelation: "none" | "friend" | "blocked" | "incoming" | "outgoing";
}) => {
    const [relation, setRelation] = useState(initialRelation);

    return <RlContext.Provider value={{ relation, setRelation }}>{children}</RlContext.Provider>
}

export const useRl = () => useContext(RlContext)