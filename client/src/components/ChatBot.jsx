import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

const ChatBot = () => {
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: ' Hi! I\'m the PingUp assistant. Ask me anything about the app or anything else!'
        }
    ])
    const { getToken } = useAuth()
    const bottomRef = useRef(null)
    const BASE = import.meta.env.VITE_LOCAL_URL || import.meta.env.VITE_BASEURL

    // Auto scroll to latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMsg = { role: 'user', content: input }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        try {
            const token = await getToken()

            // Build history — skip the first welcome message, skip the latest user msg
            // (backend sends the latest message separately)
            const history = newMessages.slice(1, -1).map(m => ({
                role: m.role,
                content: m.content
            }))

            const res = await fetch(`${BASE}/api/chatbot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: input, history })
            })

            const data = await res.json()

            if (data.success) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }])
            } else {
                setMessages([...newMessages, { role: 'assistant', content: '⚠️ ' + data.message }])
            }
        } catch (error) {
            setMessages([...newMessages, {
                role: 'assistant',
                content: '❌ Could not connect to the AI. Make sure your server is running.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>

            {/* Chat Window */}
            {open && (
                <div className='mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden'>

                    {/* Header */}
                    <div className='bg-indigo-600 px-4 py-3 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <Bot className='text-white w-5 h-5' />
                            <span className='text-white font-semibold text-sm'>PingUp Assistant</span>
                        </div>
                        <button onClick={() => setOpen(false)} className='text-indigo-200 hover:text-white'>
                            <X className='w-4 h-4' />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className='flex flex-col gap-3 p-3 h-72 overflow-y-auto bg-slate-50'>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`
                                    px-3 py-2 rounded-xl text-sm max-w-[85%] leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                                    }
                                `}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className='flex justify-start'>
                                <div className='bg-white border border-slate-200 rounded-xl rounded-bl-none px-4 py-2 shadow-sm'>
                                    <div className='flex gap-1 items-center h-4'>
                                        <span className='w-2 h-2 bg-indigo-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
                                        <span className='w-2 h-2 bg-indigo-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
                                        <span className='w-2 h-2 bg-indigo-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className='flex items-center gap-2 p-3 border-t border-slate-200 bg-white'>
                        <input
                            type='text'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder='Ask something…'
                            className='flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-400 bg-slate-50'
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className='bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white p-2 rounded-lg transition-colors'
                        >
                            <Send className='w-4 h-4' />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setOpen(!open)}
                className='bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105'
            >
                {open
                    ? <X className='w-6 h-6' />
                    : <MessageCircle className='w-6 h-6' />
                }
            </button>
        </div>
    )
}

export default ChatBot