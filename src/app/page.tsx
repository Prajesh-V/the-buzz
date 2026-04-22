'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import Image from 'next/image'
import CharacterQuiz from "@/components/quiz/CharacterQuiz"
import TicketCard from "@/components/TicketCard"
import { bookTicket } from "./actions"
import { characters } from "@/lib/characters"
import { Sora, Inter } from 'next/font/google'

const sora = Sora({ subsets: ['latin'], weight: ['500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

export default function Home() {
  const { data: session, status } = useSession()
  // Added 'poster' state to the flow
  const [gameState, setGameState] = useState<'landing' | 'quiz' | 'loading' | 'poster' | 'ticket' | 'full'>('landing')
  const [bookingData, setBookingData] = useState<{ charName: string, charId: string, slot: number, ticketId: string } | null>(null)

  const handleQuizComplete = async (charName: string) => {
    setGameState('loading')
    const character = characters.find(c => c.name === charName)
    const charId = character?.id || 'aarav' 

    if (session?.user?.email) {
      const result = await bookTicket(session.user.email, session.user.name || "Guest", charName)
      if (result.success && result.slot && result.ticketId) {
        setBookingData({ charName, charId, slot: result.slot, ticketId: result.ticketId })
        
        // --- NEW TRANSITION LOGIC ---
        // 1. Show the poster first
        setGameState('poster')
        
        // 2. Wait 2 seconds (1.5s visibility + fades) then show ticket
        setTimeout(() => {
          setGameState('ticket')
        }, 2200) 
        
      } else if ('isFull' in result && result.isFull) {
        setGameState('full')
      } else {
        alert(result.message || "Something went wrong")
        setGameState('landing')
      }
    }
  }

  if (status === "loading" || gameState === 'loading') {
    return (
      <div className={`min-h-[100dvh] bg-[radial-gradient(circle_at_top,_#0b1220,_#020617)] flex flex-col items-center justify-center text-white ${inter.className}`}>
        <div className="w-12 h-12 border-4 border-[#60A5FA]/20 border-t-[#38BDF8] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(56,189,248,0.4)]" />
        <p className="text-[13px] font-medium tracking-widest animate-pulse text-[#38BDF8]">CALCULATING IDENTITY</p>
      </div>
    )
  }

  return (
    <main className={`min-h-[100dvh] w-full bg-[radial-gradient(circle_at_top,_#0b1220,_#020617)] text-white relative flex flex-col items-center justify-center p-4 overflow-hidden ${inter.className}`}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.12),transparent_70%)] blur-[20px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          
          {/* LANDING STATE */}
          {gameState === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }} className="w-full">
              <div className="w-full bg-[#0b1220]/85 backdrop-blur-xl border border-[#60A5FA]/20 rounded-[20px] p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="mb-4 relative flex flex-col items-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-[#60A5FA]/10 blur-[30px] rounded-full" />
                  <Image src="/logo.png" alt="Logo" width={180} height={180} className="relative z-10 drop-shadow-2xl" priority />
                  <p className="relative z-10 text-[11px] text-[#CBD5E1] mt-1 font-medium tracking-wide">by Saket Roy</p>
                </div>

                <h1 className={`${sora.className} text-[20px] font-semibold leading-[1.4] mb-2 text-[#E5E7EB]`}>
                  If this made you uncomfortable, it did its job.
                </h1>
                <p className="text-[13px] font-medium text-[#CBD5E1] mb-6">Claim your true identity.</p>

                <div className="w-full flex flex-col gap-3">
                  {!session ? (
                    <button onClick={() => signIn('google')} className="w-full min-h-[48px] rounded-xl bg-gradient-to-br from-[#60A5FA]/20 to-[#38BDF8]/10 border border-[#60A5FA]/40 text-white font-semibold text-[15px] active:scale-[0.97] transition-all">
                      Sign in with Google
                    </button>
                  ) : (
                    <>
                      <div className="w-fit mx-auto bg-white/[0.03] rounded-full py-1.5 px-4 flex items-center gap-2 border border-[#60A5FA]/20 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_8px_#38BDF8]" />
                        <p className="text-[12px] font-medium text-[#CBD5E1]">ID: {session.user?.name?.split(' ')[0]}</p>
                      </div>
                      <button onClick={() => setGameState('quiz')} className={`${sora.className} w-full min-h-[48px] rounded-xl bg-gradient-to-br from-[#60A5FA]/25 to-[#38BDF8]/15 border border-[#60A5FA]/50 text-white font-bold text-[15px] active:scale-[0.97] transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)]`}>
                        Enter Assessment
                      </button>
                      <button onClick={() => signOut()} className="w-full min-h-[44px] rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-[11px] tracking-widest uppercase hover:bg-red-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* QUIZ STATE */}
          {gameState === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="w-full">
               <CharacterQuiz onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {/* POSTER TRANSITION STATE */}
          {gameState === 'poster' && (
            <motion.div 
              key="poster"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full max-w-sm aspect-[9/16] rounded-[24px] overflow-hidden shadow-2xl border border-white/10"
            >
              <img src="/poster.png" alt="The Buzz Poster" className="w-full h-full object-cover" />
            </motion.div>
          )}

          {/* TICKET STATE */}
          {gameState === 'ticket' && bookingData && (
            <motion.div key="ticket" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex justify-center">
               <TicketCard userName={session?.user?.name || "Guest"} charName={bookingData.charName} charId={bookingData.charId} slot={bookingData.slot} ticketId={bookingData.ticketId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}