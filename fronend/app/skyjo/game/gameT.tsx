"use client"

import React from "react"

/**
 * SkymoStaticBoard
 * - Modern Next.js component with Tailwind CSS
 * - Responsive layout for desktop and mobile
 * - Up to 8 players arranged around the table
 * - Easy player configuration
 *
 * Usage:
 *   <SkymoStaticBoard 
 *     players={[
 *       { name: "You", avatar: "🦉", score: 5 },
 *       { name: "Alice", avatar: "🐝", score: 15 },
 *       { name: "Bob", avatar: "🐧", score: -1 }
 *     ]}
 *     mode="turn" 
 *     turnText="Turn 2 cards" 
 *     discardValue={11} 
 *   />
 */

type Mode = "choose" | "turn"
type Card = { value: number; isVisible: boolean }
type CardModel = Card[][] // [col][row] 3x4

interface PlayerData {
  name: string
  avatar: string
  score: number
  cards?: CardModel
}

interface Props {
  players?: PlayerData[]
  mode?: Mode
  turnText?: string
  discardValue?: number | null
}

const CARD_COLS = 3
const CARD_ROWS = 4

// Slot positions for up to 8 players (index => Tailwind classes)
const SLOT_POSITIONS = [
  "absolute bottom-12 left-1/2 -translate-x-1/2", // 0 - You (bottom center)
  "absolute top-12 left-1/2 -translate-x-1/2", // 1 - top center
  "absolute right-12 top-1/2 -translate-y-1/2", // 2 - right center
  "absolute left-12 top-1/2 -translate-y-1/2", // 3 - left center
  "absolute top-28 right-12 lg:right-[8%]", // 4 - top right
  "absolute top-28 left-12 lg:left-[8%]", // 5 - top left
  "absolute bottom-28 right-12 lg:right-[10%]", // 6 - bottom right
  "absolute bottom-28 left-12 lg:left-[10%]", // 7 - bottom left
]

// Default players data
const DEFAULT_PLAYERS: PlayerData[] = [
  { name: "You", avatar: "🦉", score: 5 },
  { name: "Tutu", avatar: "🐢", score: 15 },
  { name: "Gladys", avatar: "🐝", score: -1 },
  { name: "Cha", avatar: "🐧", score: 12 },
  { name: "Niko", avatar: "🦊", score: 20 },
  { name: "Mimi", avatar: "🐼", score: 9 },
  { name: "Tara", avatar: "🐸", score: 7 },
  { name: "Zed", avatar: "🐨", score: 11 },
]

// Sample visible cards for each player (for demo purposes)
const SAMPLE_VISIBLE_CARDS: Array<Array<{ c: number; r: number; value: number }>> = [
  [{ c: 2, r: 0, value: 7 }, { c: 1, r: 2, value: -2 }],
  [{ c: 2, r: 0, value: 5 }, { c: 0, r: 3, value: 10 }],
  [{ c: 1, r: 0, value: 0 }, { c: 1, r: 1, value: -1 }],
  [{ c: 1, r: 0, value: 4 }, { c: 1, r: 1, value: 8 }],
  [{ c: 2, r: 1, value: 6 }],
  [{ c: 0, r: 2, value: 9 }],
  [{ c: 2, r: 3, value: -2 }],
  [{ c: 1, r: 2, value: 3 }],
]

const getCardColorClasses = (value: number): string => {
  if (value < 0) return "bg-blue-400 text-gray-900"
  if (value <= 2) return "bg-blue-300 text-gray-900"
  if (value <= 5) return "bg-green-400 text-gray-900"
  if (value <= 8) return "bg-yellow-400 text-gray-900"
  if (value <= 11) return "bg-red-400 text-gray-900"
  return "bg-red-600 text-white"
}

function createEmptyCards(): CardModel {
  return Array.from({ length: CARD_COLS }, () =>
    Array.from({ length: CARD_ROWS }, () => ({ value: 0, isVisible: false }))
  )
}

function injectVisibleCards(base: CardModel, visible: Array<{ c: number; r: number; value: number }>): CardModel {
  const grid = base.map(col => col.map(card => ({ ...card })))
  visible.forEach(({ c, r, value }) => {
    if (grid[c]?.[r]) {
      grid[c][r] = { value, isVisible: true }
    }
  })
  return grid
}

const CardFace: React.FC<{ card: Card; small?: boolean }> = ({ card, small = false }) => {
  const sizeClasses = small 
    ? "w-[42px] h-[56px] text-xs" 
    : "w-16 h-20 text-lg"
  
  const colorClasses = card.isVisible 
    ? getCardColorClasses(card.value)
    : "bg-gray-600 text-transparent"

  return (
    <div className={`
      ${sizeClasses} 
      ${colorClasses}
      rounded-lg border-2 border-gray-700 shadow-lg
      flex items-center justify-center font-black select-none
      shadow-black/60
    `}>
      {card.isVisible ? card.value : ""}
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
}> = ({ name, avatar, score, cards, small = false, isYou = false }) => {
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

  return (
    <div className="flex flex-col items-center gap-2.5">
      {!isYou && <PlayerInfo />}
      
      <div className={`
        bg-black/15 border-2 border-gray-700 rounded-xl shadow-lg shadow-black/35
        ${small ? "p-1 gap-1" : "p-1.5 gap-1.5"} flex flex-col
      `}>
        {Array.from({ length: CARD_ROWS }).map((_, r) => (
          <div key={r} className={`flex ${small ? "gap-1.5" : "gap-2"}`}>
            {Array.from({ length: CARD_COLS }).map((_, c) => (
              <CardFace key={`${c}-${r}`} card={cards[c][r]} small={small} />
            ))}
          </div>
        ))}
      </div>
      
      {isYou && <PlayerInfo />}
    </div>
  )
}

const CenterPiles: React.FC<{
  mode: Mode
  text?: string
  discardValue?: number | null
}> = ({ mode, text, discardValue }) => {
  const label = text ?? (mode === "turn" ? "Turn 2 cards" : "Choose a pile")
  
  const discardColorClasses = typeof discardValue === "number" 
    ? getCardColorClasses(discardValue)
    : "bg-gray-600"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-gray-300 text-sm font-bold">
        {label}
      </div>
      <div className="flex gap-4 items-center">
        {/* Draw pile */}
        <div className="w-16 h-20 sm:w-14 sm:h-19 rounded-lg border-2 border-gray-700 bg-gray-600 shadow-lg shadow-black/55" />
        
        {/* Discard pile */}
        <div className={`
          w-16 h-20 sm:w-14 sm:h-19 rounded-lg border-2 border-gray-700 shadow-lg shadow-black/55
          flex items-center justify-center font-black text-lg select-none
          ${discardColorClasses}
        `}>
          {typeof discardValue === "number" ? discardValue : ""}
        </div>
      </div>
    </div>
  )
}

const MiniPlayerBoard: React.FC<{
  player: PlayerData
  cards: CardModel
}> = ({ player, cards }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{player.avatar}</span>
      <span className="text-gray-200 text-xs font-bold truncate max-w-20">
        {player.name.replace(" (You)", "")}
      </span>
      <span className="text-gray-400 text-xs ml-auto">
        {player.score}
      </span>
    </div>
    <div className="p-1 rounded-lg bg-black/15 border-2 border-gray-700 shadow-md shadow-black/35">
      {Array.from({ length: CARD_ROWS }).map((_, r) => (
        <div key={r} className={`flex gap-1 ${r < CARD_ROWS - 1 ? 'mb-1' : ''}`}>
          {Array.from({ length: CARD_COLS }).map((_, c) => (
            <CardFace key={`${c}-${r}`} card={cards[c][r]} small />
          ))}
        </div>
      ))}
    </div>
  </div>
)

export default function SkymoStaticBoard({
  players,
  mode = "choose",
  turnText,
  discardValue = 2,
}: Props) {
  // Use provided players or defaults, limit to 8
  const gamePlayers = (players ?? DEFAULT_PLAYERS).slice(0, 8)
  
  // Generate cards for each player
  const playersWithCards = gamePlayers.map((player, index) => ({
    ...player,
    cards: player.cards ?? injectVisibleCards(
      createEmptyCards(),
      SAMPLE_VISIBLE_CARDS[index] ?? []
    ),
  }))

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      {/* Custom background pattern */}
      {/* <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundPosition: "0 0, 25px 25px",
          backgroundSize: "50px 50px"
        }}
      /> */}

      {/* Desktop/Tablet: Show all players in their positions */}
      {playersWithCards.map((player, index) => (
        <div 
          key={index} 
          className={`
            ${SLOT_POSITIONS[index] ?? SLOT_POSITIONS[0]}
            ${index > 1 ? 'hidden lg:block' : ''}
            ${index > 3 ? 'hidden xl:block' : ''}
          `}
        >
          <PlayerBoard
            name={player.name}
            avatar={player.avatar}
            score={player.score}
            cards={player.cards}
            small={index !== 0}
            isYou={index === 0}
          />
         </div>
      ))}

      {/* Center piles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-2/5">
        <CenterPiles mode={mode} text={turnText} discardValue={discardValue} />
      </div>

      {/* Mobile: Sidebar for other players */}
      <div className="absolute left-2 top-18 bottom-30 w-30 md:hidden flex flex-col gap-3.5 overflow-y-auto pr-1.5">
        {playersWithCards.slice(1).map((player, index) => (
          <MiniPlayerBoard
            key={`mini-${index}`}
            player={player}
            cards={player.cards}
          />
        ))}
      </div>
    </div>
  )
}