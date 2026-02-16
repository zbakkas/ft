"use client"

import { useEffect, useState } from "react";
import { RoundResult, useSocket } from "../contexts/SocketContext";
import { Trash2, Trophy, X, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchUserProfile } from "../utils/fetchUserProfile";
import { useLang } from "@/app/context/LangContext";

type Card = { 
    id: string;
    value: number; 
    isVisible: boolean; 
    isRemoving?: boolean 
}

const getCardColorClasses = (value: number): string => {
    if (value < 0) return "bg-blue-400 text-gray-900"
    if (value <= 2) return "bg-blue-300 text-gray-900"
    if (value <= 5) return "bg-green-400 text-gray-900"
    if (value <= 8) return "bg-yellow-400 text-gray-900"
    if (value <= 11) return "bg-red-400 text-gray-900"
    return "bg-red-600 text-white"
}

const SLOT_POSITIONS = [
    "absolute bottom-2 left-1/2 -translate-x-1/2", // 0 - You (always bottom center)
    "absolute top-2 left-1/2 -translate-x-1/2",    // 1 - top center
    "absolute right-4 top-1/2 -translate-y-1/2",   // 2 - right center
    "absolute left-4 top-1/2 -translate-y-1/2",    // 3 - left center
    "absolute top-28 right-12 lg:right-[8%]",       // 4 - top right
    "absolute top-28 left-12 lg:left-[8%]",         // 5 - top left
    "absolute bottom-28 right-12 lg:right-[10%]",   // 6 - bottom right
    "absolute bottom-28 left-12 lg:left-[10%]",     // 7 - bottom left
]

type CardModel = Card[][]

// Timer Component for individual player
const PlayerTimer: React.FC<{
  timeLeft: number;
  isVisible: boolean;
}> = ({ timeLeft, isVisible }) => {
  if (!isVisible || timeLeft > 15) return null;

  const getTimerColor = () => {
    if (timeLeft <= 5) return "text-red-500 border-red-500 bg-red-500/20";
    if (timeLeft <= 10) return "text-orange-500 border-orange-500 bg-orange-500/20";
    return "text-yellow-500 border-yellow-500 bg-yellow-500/20";
  };

  const getAnimationClass = () => {
    if (timeLeft <= 5) return "animate-pulse";
    if (timeLeft <= 10) return "animate-bounce";
    return "";
  };

  return (
    <div className={`
      flex items-center gap-1 px-2 py-1 rounded border
      ${getTimerColor()} ${getAnimationClass()}
      backdrop-blur-sm text-xs font-bold
    `}>
      <Clock size={12} />
      <span>{timeLeft}s</span>
    </div>
  );
};

const CardFace: React.FC<{ 
    card: Card; 
    small?: boolean;
    onClick?: () => void;
    isYou?: boolean
}> = ({ card, small = false, onClick, isYou = true }) => {
    const sizeClasses = small 
  ? "w-[32px] h-[43px] text-xs sm:w-1 sm:h-4 sm:text-sm md:w-7 md:h-10 md:text-base"
  : "w-10 h-14 text-lg sm:w-14 sm:h-20 sm:text-xl md:w-16 md:h-24 md:text-2xl"

    const colorClasses = card.isVisible 
      ? getCardColorClasses(card.value)
      : "bg-gray-600"

    return (
      <div 
      className={`${sizeClasses} ${isYou ? "cursor-pointer" : ""} transition-all duration-500 ease-in-out ${
        card.isRemoving ? 'card-removing' : ''
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
          <div 
            className={`absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg bg-gray-600 shadow-black/60 flex items-center justify-center transition-all duration-300 ${isYou?"hover:scale-105 hover:shadow-xl hover:bg-gray-500":""}`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-gray-400 text-2xl font-bold select-none">?</div>
          </div>
          
          <div 
            className={`absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg ${colorClasses} shadow-black/60 flex items-center justify-center select-none transition-all duration-300 ${isYou?"hover:scale-105 hover:shadow-xl":""}`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-gray-900 text-xl">{card.value}</div>
          </div>
        </div>
      </div>
    )
}

const CardFace_in_table: React.FC<{ 
  card: Card; 
  onClick?: () => void;
  selected?: boolean;
}> = ({ card, onClick, selected = false }) => {
  const sizeClasses = "w-[32px] h-[43px] text-xs sm:w-1 sm:h-4 sm:text-sm md:w-7 md:h-10 md:text-base"
  
  const colorClasses = card.isVisible 
    ? getCardColorClasses(card.value)
    : "bg-gray-600"

  const selectionClasses = selected 
    ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-transparent scale-110 z-10" 
    : ""

  return (
    <div 
      className={`${sizeClasses} cursor-pointer transition-all duration-500 ease-in-out ${
        card.isRemoving ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
      } ${selectionClasses} relative`}
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
        <div 
          className={`absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg bg-gray-600 shadow-black/60 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-500 ${selected ? "bg-gray-500 shadow-blue-500/50" : ""}`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-gray-400 text-2xl font-bold select-none">?</div>
        </div>
        
        <div 
          className={`absolute inset-0 w-full h-full rounded-sm border border-black/50 shadow-lg ${colorClasses} shadow-black/60 flex items-center justify-center select-none transition-all duration-300 hover:scale-105 hover:shadow-xl ${selected ? "shadow-blue-500/50 brightness-110" : ""}`}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="text-gray-900 text-xl">{card.value}</div>
        </div>
      </div>
      
      {selected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse z-20" />
      )}
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
    isYourTurn?: boolean
    onCardClick?: (col: number, row: number) => void
    timeLeft?: number
    showTimer?: boolean
}> = ({ name, avatar, score, cards, small = false, isYou = false, onCardClick, isYourTurn = false, timeLeft = 0, showTimer = false }) => {
    const PlayerInfo = () => (
      <div className="flex flex-col items-center gap-0.5">
        <div className="relative">
          <img 
              src={avatar} 
              alt="Avatar" 
              className="w-7 h-7 object-cover rounded-full"
            />
          {/* Timer positioned next to avatar - ONLY TIMER */}
          {showTimer && isYourTurn && timeLeft <= 15 && (
            <div className="absolute top-2 -right-15 z-10">
              <PlayerTimer timeLeft={timeLeft} isVisible={true} />
            </div>
          )}
        </div>
        <div className={`text-gray-200 font-bold ${small ? "text-xs" : "text-sm"}`}>
          {name}
        </div>
        <div className={`text-gray-400 ${small ? "text-xs" : "text-sm"}`}>{score}</div>
      </div>
    )
    
    const currentCols = cards.length
    const currentRows = cards[0]?.length || 0
  
    return (
      <div className="flex flex-col items-center gap-1">
        {!isYou && <PlayerInfo />}
        
        <div className={`
          bg-black/15 shadow-lg shadow-black/35
          ${small ? "p-1 gap-1.5" : "p-3 gap-2"} flex flex-col ${isYourTurn ? "border-2 border-sky-500 shadow-sky-500/50" : "border border-gray-600"} transition-all duration-500 ease-in-out
        `}>
          {Array.from({ length: currentRows }).map((_, r) => (
            <div 
              key={`row-${r}-${currentCols}-${currentRows}`}
              className={`flex ${small ? "gap-1.5" : "gap-2"} transition-all duration-500 ease-in-out`}
            >
              {Array.from({ length: currentCols }).map((_, c) => (
                <CardFace 
                  key={`card-${c}-${r}-${cards[c][r]?.id || 'empty'}`}
                  card={cards[c][r]} 
                  small={small}
                  onClick={() => onCardClick?.(c, r)}
                  isYou={isYou}
                />
              ))}
            </div>
          ))}
        </div>
        
        {isYou && <PlayerInfo />}
      </div>
    )
}

interface playerWithCards {
    cards: CardModel;
    name: string;
    avatar: string;
    score: number;
    isYourTurn: boolean;
    first_hrade_cards:number;
    remove_card:boolean;
}


// Results Popup Component
const ResultsPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  results: RoundResult[];
  currentRound?: number; // Optional: to know how many rounds to display
}> = ({ isOpen, onClose, results, currentRound }) => {
  const { lang } = useLang()!;
  if (!isOpen) return null;

  // Sort results by totalScore descending for proper ranking
  // const sortedResults = [...results].sort((a, b) => b.totalScore - a.totalScore);
  
  // Determine how many rounds to show
  const maxRounds = currentRound || results[0].roundScore.length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-600 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{lang === "eng" ? "Score" : "Score"}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Table */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-gray-300 font-semibold py-3 px-4">{lang === "eng" ? "Rank" : "Rang"}</th>
                  <th className="text-left text-gray-300 font-semibold py-3 px-4">{lang === "eng" ? "Name" : "Nom"}</th>
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <th key={i} className="text-center text-gray-300 font-semibold py-3 px-4">
                      {lang === "eng" ? "Round" : "Manche"} {i + 1}
                    </th>
                  ))}
                  <th className="text-center text-gray-300 font-semibold py-3 px-4">{lang === "eng" ? "Total" : "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((player, index) => (
                  <tr key={player.name} className="border-b border-gray-700/50">
                    <td className="py-4 px-4 text-white font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : `${index + 1}.`}
                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={player.avatar} 
                          alt="Avatar" 
                          className="w-8 h-8 object-cover rounded-full"
                        />
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                    </td>
                    {Array.from({ length: maxRounds }, (_, roundIndex) => (
                      <td key={roundIndex} className="py-4 px-4 text-center text-white">
                        {player.roundScore[roundIndex] || 0}
                      </td>
                    ))}
                    <td className="py-4 px-4 text-center text-white font-bold">
                      {player.totalScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty state */}
          {results.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400">{lang === "eng" ? "No results available" : "Aucun résultat disponible"}</div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors"
          >
            {lang === "eng" ? "Close" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GameOf() {
  const { lang } = useLang()!;
  const [isProcessing, setIsProcessing] = useState(false)
  const { cardsClick, room, Allplayers, gameOvrer ,playerID, name_of_turn, click_card_in_table, click_random_card_in_table, remove_random_card_in_table, last_turn, first_hrade_cards ,all_first_hrade_cards,final_turn_Results} = useSocket();
  const [Allplayers2, setAllplayers2] = useState<playerWithCards[]>([]);
  const [see_finl_results, setSee_final_results] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [name_player, setName_player] = useState<string>("");

    const router = useRouter();
  // Timer states
  const [timeLeft, setTimeLeft] = useState(60);

  // Fetch user profile to get username
  useEffect(() => {
    if (playerID) {
      fetchUserProfile(playerID).then((profile) => {
        setName_player(profile.username);
      });
    }
  }, [playerID]);


  // useEffect(() => {
  //   if (gameOvrer) {
  //     // alert("Game Over! The game has ended.");
  //     // setShowResultsPopup(true);
  //     // console.log("Game over triggered in UI");
      
  //   }
  // }, [gameOvrer]);

  // Function to rearrange players with current player at index 0 
  const rearrangePlayers = (players: playerWithCards[], currentPlayerName: string): playerWithCards[] => {
      if (!players || players.length === 0) return [];
      
      const currentPlayerIndex = players.findIndex(player => player.name === currentPlayerName);
      if (currentPlayerIndex === -1) return players;
      
      return [
          players[currentPlayerIndex],
          ...players.slice(currentPlayerIndex + 1),
          ...players.slice(0, currentPlayerIndex)
      ];
  }

  // Timer effect - reset when turn changes
  useEffect(() => {
    if (name_of_turn && all_first_hrade_cards) {
      setTimeLeft(60);
    }
  }, [name_of_turn, all_first_hrade_cards]);

  // Countdown effect
  useEffect(() => {
    if (!name_of_turn || !all_first_hrade_cards || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer expired - you might want to trigger an action here
          console.log("Timer expired for player:", name_of_turn);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [name_of_turn, all_first_hrade_cards, timeLeft]);

  useEffect(() => {
      if (Allplayers && name_player) {
          const rearrangedPlayers = rearrangePlayers(Allplayers, name_player);
          setAllplayers2(rearrangedPlayers);
      }
  }, [Allplayers, name_player]);

  useEffect(() => {
    if (final_turn_Results && final_turn_Results.length > 0) {
      setSee_final_results(true);
      setShowResultsPopup(true);
    }
  }, [final_turn_Results]);

  return (
      <div className="relative w-full h-screen">
          {/* Results Popup */}
          {final_turn_Results && (
            <ResultsPopup
              isOpen={showResultsPopup}
              onClose={() => {setShowResultsPopup(false);if(gameOvrer){ router.push('/skyjo');router.refresh};}}
              results={final_turn_Results}
            />
          )}

          {/* Players */}
          {Array.isArray(Allplayers2) && Allplayers2.map((player, displayIndex) => {
              const isCurrentPlayer = displayIndex === 0;
              const isPlayerTurn = player.name === name_of_turn;
              
              return (
                  <div 
                      key={`${player.name}-${displayIndex}`}
                      className={`
                          ${SLOT_POSITIONS[displayIndex] ?? SLOT_POSITIONS[0]}
                          ${displayIndex > 1 ? 'hidden lg:block' : ''}
                          ${displayIndex > 3 ? 'hidden xl:block' : ''}
                      `}
                  >
                      <PlayerBoard
                          name={player.name}
                          avatar={player.avatar}
                          score={player.score}
                          cards={player.cards}
                          small={true}
                          isYou={isCurrentPlayer}
                          onCardClick={(col, row) => cardsClick(col, row, player.name)}
                          isYourTurn={player.isYourTurn}
                          timeLeft={timeLeft}
                          showTimer={all_first_hrade_cards && isPlayerTurn}
                      />
                  </div>
              );
          })}

          {/* Center area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              {last_turn && <div className="mb-4 text-lg font-bold text-red-600 animate-pulse">{lang === "eng" ? "Last Turn" : "Dernier tour"}</div>}
              {name_of_turn === name_player && all_first_hrade_cards && <div className="mb-4 text-lg font-bold text-blue-600 animate-bounce">{lang === "eng" ? "Your Turn" : "Votre tour"}</div>}
              {first_hrade_cards > 0 && <div className="mb-4 text-lg font-bold text-yellow-600 animate-pulse">{lang === "eng" ? "First Trade Cards Left" : "Cartes d'échange restantes"}: {first_hrade_cards}</div>}
              
              <div className="flex gap-4 items-center">
                  {room?.random_card_in_table && (
                      <CardFace_in_table 
                          card={room.random_card_in_table} 
                          onClick={() => click_random_card_in_table(room.roomId)}
                          selected={room?.random_card_in_table_selected}
                      />
                  )}
                  
                  {room?.card_in_table && !room?.random_card_in_table_selected && (
                      <CardFace_in_table 
                          card={room.card_in_table} 
                          onClick={() => click_card_in_table(room.roomId)}
                          selected={room?.card_in_table_selected}
                      />
                  )}
                  
                  {room?.random_card_in_table_selected && (
                      <div>
                          <Trash2 
                              onClick={() => remove_random_card_in_table(room.roomId)} 
                              color="red" 
                              className="border-2 p-1.5 border-dashed border-red-700 w-10 h-14 cursor-pointer"
                          />
                      </div>
                  )}
              </div>
          </div>

          {/* Turn indicator */}
          {name_of_turn && (
              <div className="absolute top-4 left-4 bg-gray-800 text-white px-4 py-2 rounded">
                  <div className="text-sm">{lang === "eng" ? "Current Turn" : "Tour actuel"}:</div>
                  <div className="font-bold">{name_of_turn}</div>
              </div>
          )}
      </div>
  );
}