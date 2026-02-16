'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Swords } from "lucide-react";
import { useLang } from '@/app/context/LangContext';
import { useRl } from '@/app/context/RlContext';
import {v7 as uuid} from 'uuid';
import Link from 'next/link';
import { getGatewayUrl, getWsGatewayUrl } from "@/lib/gateway";

interface Message {
    id: string;
    senderId?: string;
    createdAt?: string;
    content: string;
}

interface ChatInterfaceProps {
    uid: string;
    socketUrl?: string;
    useDummyData?: boolean;
    username: string;
}

// Dummy data for visualization
const DUMMY_MESSAGES: Message[] = [
    {
        id: '1',
        content: 'Hey! How are you doing?',
    },
    {
        id: '2',
        content: 'I\'m doing great! Just working on this new chat feature.',    },
    {
        id: '3',
        content: 'That sounds exciting! What kind of features are you adding?',
    },
    {
        id: '4',
        content: 'Real-time messaging with Socket.io, automatic scrolling, and a nice gray theme!',
    },
    {
        id: '5',
        content: 'Nice! I love the gray theme. Very sleek 😎',
    },
    {
        id: '6',
        content: 'Thanks! It\'s coming together really well.',
    },
    {
        id: '7',
        content: 'Can\'t wait to see it in action!',
    },
];

export default function ChatInterface({
    uid,
    useDummyData = false,
    username,
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(!useDummyData);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const [currentUserIdState, setCurrentUserIdState] = useState<string | undefined>(undefined);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { lang } = useLang()!;
    const { relation } = useRl()!;
    const socket = useRef<WebSocket>(null);
    
    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    

    useEffect(() => {
        socket.current = new WebSocket(getWsGatewayUrl("/ws/chat/live"));
        socket.current.onopen = () => {
            socket.current?.send(JSON.stringify({
                type: "subscribe:conversation",
                targetUserId: uid,
            }));
        }
        socket.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "message:new" && data.payload) {
                setMessages(messages => [...messages, {
                    id: data.payload.id,
                    content: data.payload.content,
                    senderId: data.senderId,
                    createdAt: data.payload.createdAt
                }]);
            }
        };
        return () => {
            socket.current?.send(JSON.stringify({
                type: "unsubscribe:conversation",
                targetUserId: uid,
            }));
            socket.current?.close();
        }
    }, []);

    useEffect(() => {
        const loadCurrentUserId = async () => {
            try {
                const response = await fetch(getGatewayUrl('/api/v1/user-mgmt/me'), {
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch current user');
                const data = await response.json();
                const fetchedId = data?.id ?? data?.user?.id ?? data?.data?.id;
                if (fetchedId) setCurrentUserIdState(fetchedId);
            } catch (error) {
                console.error('Error fetching current user id:', error);
            }
        };

        if (!useDummyData) {
            loadCurrentUserId();
        }
    }, [useDummyData]);

    // Load dummy data or fetch from API
    useEffect(() => {
        const loadMessages = async () => {
            if (useDummyData) {
                // Simulate loading delay
                setLoading(true);
                setTimeout(() => {
                    setMessages(DUMMY_MESSAGES);
                    setLoading(false);
                }, 500);
            } else {
                try {
                    setLoading(true);
                                        const response = await fetch(
                                            getGatewayUrl(`/api/v1/chat/dm/${uid}?limit=1000`),
                                            {
                        credentials: 'include',
                                            }
                                        );
                    if (!response.ok) throw new Error('Failed to fetch messages');
                    const data = await response.json();
                    setMessages(data.messages.toReversed());
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                    setLoading(false);
                }
            }
        };
        
        loadMessages();
    }, [uid, useDummyData, username]);

    // Scroll to bottom when messages change or typing status changes
    useEffect(() => {
        scrollToBottom();
    }, [messages, isOtherUserTyping]);

    // Handle input change with typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);

        if (useDummyData) {
            // Simulate other user typing when you type
            if (e.target.value.length > 0 && e.target.value.length % 10 === 0) {
                setIsOtherUserTyping(true);
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setIsOtherUserTyping(false);
                }, 2000);
            }
        } else {
            // Real socket implementation: emit typing event
            // socket.emit('typing', { chatId, userId: currentUserId });
        }
    };

    // Handle send message
    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        if (useDummyData) {
            // Simulate sending a message with dummy data
            const newMessage: Message = {
                id: `msg-${Date.now()}`,
                content: inputValue.trim(),
            };
            setMessages((prev) => [...prev, newMessage]);
            setInputValue('');

            // Show typing indicator before response
            setIsOtherUserTyping(true);

            // Simulate a response after 1.5 seconds
            setTimeout(() => {
                setIsOtherUserTyping(false);
                const responseMessage: Message = {
                    id: `msg-${Date.now()}`,
                    content: 'That\'s interesting! Tell me more.',
                };
                setMessages((prev) => [...prev, responseMessage]);
            }, 1500);
        } else {
            const message= {
                type: "message:send",
                targetUserId: uid,
                payload: {
                    id: uuid(),
                    content: inputValue.trim(),
                }
            }
            socket.current?.send(JSON.stringify(message));
            setInputValue('');
            setMessages(messages => [...messages, {
                id: message.payload.id,
                content: message.payload.content,
                senderId: currentUserIdState,
                createdAt: new Date().toISOString(),
            }]);
        }
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (relation != "friend") {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className='max-w-[40ch] text-center'>
                    {lang === "eng" ? "Here will be the chat interface when you become friends." : "Ici se trouvera l'interface de chat lorsque vous deviendrez amis."}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-900">
            {/* Messages Container */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
                    </div>
                ) : messages.length === 0 ? ( 
                    <div className="flex items-center justify-center h-full text-gray-500">
                        {lang === "eng" ? "No messages yet. Start the conversation!" : "Pas encore de messages. Commencez la conversation !"}
                    </div>
                ) : (
                    messages.map((message) => {
                        const isCurrentUser = message.senderId && currentUserIdState
                            ? message.senderId === currentUserIdState
                            : message.senderId !== uid;
                        return (
                            <div
                                key={message.id}
                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${isCurrentUser
                                            ? 'bg-gray-700 text-gray-100'
                                            : 'bg-gray-800 text-gray-200'
                                        }`}
                                >
                                    {!isCurrentUser && (
                                        <Link href={`/users/${username}`}>
                                            <div className="text-xs text-gray-400 mb-1 font-semibold">
                                                {username}
                                            </div>
                                        </Link>
                                    )}
                                    <div className="break-words">{message.content}</div>
                                    <div
                                        className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                    >
                                        {new Date(message.createdAt || '').toLocaleTimeString(
                                            [],
                                            { hour: '2-digit', minute: '2-digit' }
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                
                {/* Typing Indicator */}
                {isOtherUserTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 text-gray-200 rounded-lg px-4 py-2 max-w-[70%]">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">
                                    {lang === "eng" ? `typing...` : `écrire...`}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Container */}
            <div className="border-t border-gray-700 bg-gray-850 p-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder={lang === "eng" ? "Type a message..." : "Tapez un message..."}
                        className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-600 border border-gray-700"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-100 rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600"
                    >
                        <SendHorizontal className="w-7 h-7" />
                    </button>
                    {currentUserIdState ? (
                        <Link href={`/game2d?privatee=true&roomId=${(currentUserIdState < uid ? currentUserIdState + uid : uid + currentUserIdState)}&playerinvitId=${uid}`}>
                            <button className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-gray-100 rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600">
                                <Swords className="w-7 h-7" />
                            </button>
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="bg-gray-800 text-gray-600 cursor-not-allowed rounded-lg px-6 py-3 font-medium"
                        >
                            <Swords className="w-7 h-7" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
