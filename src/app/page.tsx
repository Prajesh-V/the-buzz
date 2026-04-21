'use client'

import { useState } from 'react'
import { signIn, useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import Image from 'next/image'
import CharacterQuiz from "@/components/quiz/CharacterQuiz"
import TicketCard from "@/components/TicketCard"
import { bookTicket } from "./actions"
import { characters } from "@/lib/characters"

export default function Home() {
  const { data: session, status } = useSession()
  const [gameState, setGameState] = useState<'landing' | 'quiz' | 'loading' | 'ticket' | 'full'>('landing')
  const [bookingData, setBookingData] = useState<{ charName: string, charId: string, slot: number, ticketId: string } | null>(null)

  // --- LOGIC (KEEPING 100% UNCHANGED) ---
  const handleQuizComplete = async (charName: string) => {
    setGameState('loading')
    const character = characters.find(c => c.name === charName)
    const charId = character?.id || 'aarav' 

    if (session?.user?.email) {
      const result = await bookTicket(session.user.email, session.user.name || "Guest", charName)
      if (result.success) {
        setBookingData({
          charName,
          charId,
          slot: result.slot,
          ticketId: result.id
        })
        setGameState('ticket')
      } else if (result.isFull) {
        setGameState('full')
      } else {
        alert(result.message)
        setGameState('landing')
      }
    }
  }

  // --- VISUAL LOADING STATE ---
  if (status === "loading" || gameState === 'loading') {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center text-sky-900">
        <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-xs font-mono tracking-[0.5em] animate-pulse uppercase">Processing Identity...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fbfe] text-slate-900 relative overflow-hidden selection:bg-sky-200">
      
      {/* Background Aesthetic (Visual Only) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-200/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-100/50 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 min-h-screen flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          
          {/* --- VISUAL STATE: LANDING --- */}
          {gameState === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center"
            >
              {/* Logo with Soft Glow */}
              <div className="mb-10 relative">
                <div className="absolute inset-0 bg-sky-400/10 blur-[80px] rounded-full" />
                <Image 
                  src="/logo.png" 
                  alt="The Buzz Logo"
                  width={320}
                  height={320}
                  className="relative drop-shadow-[0_10px_30px_rgba(7,89,133,0.15)]"
                  priority
                />
              </div>

              {/* Branded Hero Text */}
              <div className="text-center max-w-2xl mb-12">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-sky-950 mb-6 uppercase italic">
                  The Buzz Premiere
                </h1>
                <p className="text-lg text-sky-800/60 font-medium leading-relaxed">
                  Welcome to the official booking engine. Sign in to start your character assessment and secure your premiere credentials.
                </p>
              </div>

              {/* Unified Auth/Start Action */}
              {!session ? (
                <button 
                  onClick={() => signIn('google')}
                  className="px-12 py-5 bg-white text-sky-700 font-bold rounded-2xl shadow-[0_15px_40px_rgba(186,230,253,0.5)] hover:shadow-sky-300/50 hover:-translate-y-1 transition-all border border-sky-100 active:scale-95"
                >
                  Get Started with Google
                </button>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-sky-100/50 px-4 py-2 rounded-full border border-sky-200">
                    <p className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                      Ready, {session.user?.name?.split(' ')[0]}
                    </p>
                  </div>
                  <button 
                    onClick={() => setGameState('quiz')}
                    className="px-16 py-5 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-200 hover:bg-sky-700 transition-all active:scale-95 uppercase tracking-widest text-lg"
                  >
                    Enter Assessment
                  </button>
                </div>
              )}

              {/* Visual Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl">
                {[
                  { title: 'Identity', text: 'Discover your assigned character persona.' },
                  { title: 'Credentials', text: 'Generate your unique digital premiere pass.' },
                  { title: 'Schedule', text: '400 Seats. 2 Slots. One Night.' }
                ].map((item, i) => (
                  <div key={i} className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-sm">
                    <h3 className="font-bold text-sky-900 mb-2 uppercase text-xs tracking-widest">{item.title}</h3>
                    <p className="text-sm text-sky-800/50 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* --- VISUAL STATE: QUIZ --- */}
          {gameState === 'quiz' && (
            <motion.div 
              key="quiz" 
              initial={{ opacity: 0, x: 100 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="w-full max-w-3xl"
            >
               <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-sky-200/50 border border-white">
                  <div className="mb-8 text-center">
                    <p className="text-sky-400 font-bold text-xs uppercase tracking-[0.4em] mb-2">Internal Assessment</p>
                    <h2 className="text-2xl font-black text-sky-950">Who are you in "The Buzz"?</h2>
                  </div>
                  <CharacterQuiz onComplete={handleQuizComplete} />
               </div>
            </motion.div>
          )}

          {/* --- VISUAL STATE: TICKET --- */}
          {gameState === 'ticket' && bookingData && (
            <motion.div 
              key="ticket" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center"
            >
               <TicketCard 
                userName={session?.user?.name || "Guest"}
                charName={bookingData.charName}
                charId={bookingData.charId}
                slot={bookingData.slot}
                ticketId={bookingData.ticketId}
              />
              <button 
                onClick={() => window.print()} 
                className="mt-12 px-8 py-3 bg-sky-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
              >
                Download Credentials
              </button>
            </motion.div>
          )}

          {/* --- VISUAL STATE: FULL --- */}
          {gameState === 'full' && (
            <motion.div key="full" className="text-center bg-white p-12 rounded-[3rem] border border-sky-100 shadow-xl">
              <h2 className="text-4xl font-black text-sky-900 mb-4 tracking-tighter italic">MAX CAPACITY</h2>
              <p className="text-sky-600/60 max-w-sm mx-auto mb-8">All premiere slots have been claimed. Stay tuned to our socials for the digital release.</p>
              <button onClick={() => window.location.href = 'https://instagram.com'} className="text-sm font-bold underline text-sky-400">Follow The Buzz</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}