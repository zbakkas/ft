"use client";

import React, { useState, useEffect } from 'react'

type Card = { 
  id: string; // Unique identifier for stable keys
  value: number; 
  isVisible: boolean; 
  isRemoving?: boolean 
}
type CardModel = Card[][] // [col][row] 

type RemovalSettings = {
  enableColumnRemoval: boolean
  enableRowRemoval: boolean
}

const getCardColorClasses = (value: number): string => {
    if (value < 0) return "bg-blue-400 text-gray-900"
    if (value <= 2) return "bg-blue-300 text-gray-900"
    if (value <= 5) return "bg-green-400 text-gray-900"
    if (value <= 8) return "bg-yellow-400 text-gray-900"
    if (value <= 11) return "bg-red-400 text-gray-900"
    return "bg-red-600 text-white"
}

// Generate unique ID for cards
let cardIdCounter = 0
const generateCardId = () => `card-${++cardIdCounter}`
  
const CardFace: React.FC<{ 
    card: Card; 
    small?: boolean;
    onClick?: () => void;
}> = ({ card, small = false, onClick }) => 
{
    const sizeClasses = small 
      ? "w-[32px] h-[43px] text-xs" 
      : "w-10 h-14 text-lg"
    
    const colorClasses = card.isVisible 
      ? getCardColorClasses(card.value)
      : "bg-gray-600"

    return (
      <div 
        className={`${sizeClasses} cursor-pointer transition-all duration-500 ease-in-out ${
          card.isRemoving ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        }`}
        style={{ perspective: '1000px' }}
        onClick={!card.isRemoving ? onClick : undefined}
      >
        <div 
          className="relative w-full h-full transition-transform duration-700 ease-in-out"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: card.isVisible ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Card Back - Always visible when not flipped */}
          <div 
            className="absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg bg-gray-600 shadow-black/60 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-500"
            style={{ 
              backfaceVisibility: 'hidden'
            }}
          >
            <div className="text-gray-400 text-2xl font-bold select-none">
              ?
            </div>
          </div>
          
          {/* Card Front - Shows when flipped */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg ${colorClasses} shadow-black/60 flex items-center justify-center select-none transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-gray-900 text-xl ">
              {card.value}
            </div>
          </div>
        </div>
      </div>
    )
}

function createEmptyCards(cols: number = 4, rows: number = 3): CardModel {
    return Array.from({ length: cols }, () =>
      Array.from({ length: rows }, () => ({ 
        id: generateCardId(),
        value: Math.floor(Math.random() * 1) + 1, // Random value 1-12 for demo
        isVisible: false,
        isRemoving: false
      }))
    )
}

// Function to mark complete matching lines for removal based on settings
const markCompleteLines = (cards: CardModel, settings: RemovalSettings): CardModel => {
    const newCards = cards.map(column => 
      column.map(card => ({ ...card, isRemoving: false })) // Reset removing flag
    )
    const currentCols = newCards.length
    const currentRows = newCards[0]?.length || 0
    
    // Check columns - if enabled and ALL cards in a column are visible and have the same value
    if (settings.enableColumnRemoval) {
        for (let col = 0; col < currentCols; col++) {
            const column = newCards[col]
            
            // Check if all cards in this column are visible
            const allVisible = column.every(card => card.isVisible)
            
            if (allVisible && column.length > 0) {
                // Check if all cards have the same value
                const firstValue = column[0].value
                const allSameValue = column.every(card => card.value === firstValue)
                
                if (allSameValue) {
                    // Mark all cards in this column for removal
                    column.forEach(card => {
                        card.isRemoving = true
                    })
                }
            }
        }
    }
    
    // Check rows - if enabled and ALL cards in a row are visible and have the same value
    if (settings.enableRowRemoval) {
        for (let row = 0; row < currentRows; row++) {
            const rowCards = []
            
            // Get all cards in this row
            for (let col = 0; col < currentCols; col++) {
                if (newCards[col][row]) {
                    rowCards.push(newCards[col][row])
                }
            }
            
            // Check if all cards in this row are visible
            const allVisible = rowCards.every(card => card.isVisible)
            
            if (allVisible && rowCards.length > 0) {
                // Check if all cards have the same value
                const firstValue = rowCards[0].value
                const allSameValue = rowCards.every(card => card.value === firstValue)
                
                if (allSameValue) {
                    // Mark all cards in this row for removal
                    for (let col = 0; col < currentCols; col++) {
                        if (newCards[col][row]) {
                            newCards[col][row].isRemoving = true
                        }
                    }
                }
            }
        }
    }
    
    return newCards
}

// Function to actually remove marked cards after animation
const removeMarkedCards = (cards: CardModel): CardModel => {
    // Remove columns that have all cards marked for removal
    let newCards = cards.filter(column => 
        !column.every(card => card.isRemoving)
    )
    
    // Remove rows that have all cards marked for removal
    if (newCards.length > 0) {
        const currentRows = newCards[0]?.length || 0
        const rowsToRemove: number[] = []
        
        for (let row = 0; row < currentRows; row++) {
            const allRemoving = newCards.every(column => 
                column[row] && column[row].isRemoving
            )
            if (allRemoving) {
                rowsToRemove.push(row)
            }
        }
        
        // Remove rows (in reverse order to maintain indices)
        rowsToRemove.reverse().forEach(rowIndex => {
            newCards.forEach(column => {
                column.splice(rowIndex, 1)
            })
        })
    }
    
    return newCards
}

const SettingsPanel: React.FC<{
    settings: RemovalSettings
    onSettingsChange: (settings: RemovalSettings) => void
}> = ({ settings, onSettingsChange }) => {
    return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
            <h3 className="text-white text-lg font-bold mb-3">Removal Settings</h3>
            <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-gray-200">
                    <input
                        type="checkbox"
                        checked={settings.enableColumnRemoval}
                        onChange={(e) => onSettingsChange({
                            ...settings,
                            enableColumnRemoval: e.target.checked
                        })}
                        className="w-4 h-4"
                    />
                    Enable Column Removal
                </label>
                <label className="flex items-center gap-2 text-gray-200">
                    <input
                        type="checkbox"
                        checked={settings.enableRowRemoval}
                        onChange={(e) => onSettingsChange({
                            ...settings,
                            enableRowRemoval: e.target.checked
                        })}
                        className="w-4 h-4"
                    />
                    Enable Row Removal
                </label>
            </div>
            <div className="mt-3 text-sm text-gray-400">
                {!settings.enableColumnRemoval && !settings.enableRowRemoval && 
                    "No removal enabled - cards will only flip"
                }
                {settings.enableColumnRemoval && settings.enableRowRemoval && 
                    "Both column and row removal enabled"
                }
                {settings.enableColumnRemoval && !settings.enableRowRemoval && 
                    "Only column removal enabled"
                }
                {!settings.enableColumnRemoval && settings.enableRowRemoval && 
                    "Only row removal enabled"
                }
            </div>
        </div>
    )
}

const PlayerBoard: React.FC<{
    name: string
    avatar: string
    score: number
    cards: CardModel
    small?: boolean
    isYou?: boolean
    onCardClick?: (col: number, row: number) => void
}> = ({ name, avatar, score, cards, small = false, isYou = false, onCardClick }) => {
    const PlayerInfo = () => (
      <div className="flex flex-col items-center gap-0.5">
        <div className={`${small ? "text-lg" : "text-xl"}`}>
          {avatar}
        </div>
        <div className={`text-gray-200 font-bold ${small ? "text-xs" : "text-sm"}`}>
          {name}
        </div>
        <div className={`text-gray-400 ${small ? "text-xs" : "text-sm"}`}>
          {score}
        </div>
      </div>
    )
    
    const currentCols = cards.length
    const currentRows = cards[0]?.length || 0
  
    return (
      <div className="flex flex-col items-center gap-4">
        {!isYou && <PlayerInfo />}
        
        <div className={`
          bg-black/15  shadow-lg shadow-black/35
          ${small ? "p-1 gap-1.5" : "p-3 gap-2"} flex flex-col transition-all duration-500 ease-in-out
        `}>
          {Array.from({ length: currentRows }).map((_, r) => (
            <div 
              key={`row-${r}-${currentCols}-${currentRows}`}
              className={`flex ${small ? "gap-1.5" : "gap-2"} transition-all duration-500 ease-in-out`}
            >
              {Array.from({ length: currentCols }).map((_, c) => (
                <CardFace 
                  key={cards[c][r].id}
                  card={cards[c][r]} 
                  small={small}
                  onClick={() => onCardClick?.(c, r)}
                />
              ))}
            </div>
          ))}
        </div>
        
        {isYou && <PlayerInfo />}
      </div>
    )
}

export default function Game() {
    // Initialize with null to prevent hydration mismatch
    const [cards, setCards] = useState<CardModel | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [removalSettings, setRemovalSettings] = useState<RemovalSettings>({
        enableColumnRemoval: true,
        enableRowRemoval: true
    })
    
    // Initialize cards on client side only
    useEffect(() => {
        cardIdCounter = 0 // Reset card ID counter
        setCards(createEmptyCards(4, 3))
    }, [])
    
    // Function to handle card clicks and flip them
    const handleCardClick = (col: number, row: number) => 
    {
        if (isProcessing || !cards) return // Prevent clicks during animation or if cards not loaded
        
        setCards(prevCards => {
            if (!prevCards) return prevCards
            
            // Create a new cards array with the clicked card flipped
            const newCards = prevCards.map((column, c) =>
                column.map((card, r) => {
                    if (c === col && r === row) {
                        return { ...card, isVisible: !card.isVisible }
                    }
                    return card
                })
            )
            
            // Check for complete lines and mark them for removal based on settings
            const markedCards = markCompleteLines(newCards, removalSettings)
            
            // Check if any cards are marked for removal
            const hasRemovals = markedCards.some(column => 
                column.some(card => card.isRemoving)
            )
            
            if (hasRemovals) {
                setIsProcessing(true)
                // Remove cards after animation completes
                setTimeout(() => {
                    setCards(currentCards => {
                        if (!currentCards) return currentCards
                        const result = removeMarkedCards(currentCards)
                        setIsProcessing(false)
                        return result
                    })
                }, 600)
            }
            
            return markedCards
        })
    }
    
    // Function to reset the game
    const resetGame = () => {
        if (isProcessing) return
        cardIdCounter = 0 // Reset card ID counter
        setCards(createEmptyCards(4, 3))
    }
    
    // Show loading state until cards are initialized
    if (!cards) {
        return (
            <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center gap-8">
            {/* <div className="flex flex-col">
                <SettingsPanel 
                    settings={removalSettings} 
                    onSettingsChange={setRemovalSettings} 
                />
                <button
                    onClick={resetGame}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Reset Game
                </button>
            </div> */}
            
            <PlayerBoard 
                name="Player 1" 
                avatar="🎮" 
                score={0} 
                cards={cards}
                small={false}
                isYou={true}
                onCardClick={handleCardClick}
            />
        </div>
    )
}