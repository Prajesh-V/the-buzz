'use client'

import { useState, useEffect } from 'react'
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
  const [gameState, setGameState] = useState<'landing' | 'slot-selection' | 'quiz' | 'loading' | 'poster' | 'ticket' | 'full'>('landing')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [bookingData, setBookingData] = useState<{ charName: string, charId: string, slot: number, ticketId: string } | null>(null)
  
  const [posterIndex, setPosterIndex] = useState(0)
  const posters = ['/poster1.png', '/poster2.png', '/poster3.png']

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState === 'poster') {
      interval = setInterval(() => {
        setPosterIndex((prev) => (prev + 1) % posters.length)
      }, 1500) 
    }
    return () => clearInterval(interval)
  }, [gameState])

  const handleQuizComplete = async (charName: string) => {
    setGameState('loading')
    const character = characters.find(c => c.name === charName)
    const charId = character?.id || 'aarav' 

    if (session?.user?.email && selectedSlot) {
      const result = await bookTicket(session.user.email, session.user.name || "Guest", charName, selectedSlot)
      if (result.success && result.slot && result.ticketId) {
        setBookingData({ charName, charId, slot: result.slot, ticketId: result.ticketId })
        setGameState('poster')
        
        // DISPLAY DURATION: 9 seconds total (3s per poster x 3 posters)
        setTimeout(() => {
          setGameState('ticket')
        }, 9000) 
      } else if ('isFull' in result && result.isFull) {
        setGameState('full')
      } else {
        alert(result.message || "Something went wrong")
        setGameState('landing')
      }
    }
  }

  const downloadCurrentPoster = () => {
    const link = document.createElement('a')
    link.href = posters[posterIndex]
    link.download = `the-buzz-poster-${posterIndex + 1}.png`
    link.click()
  }

  if (status === "loading" || gameState === 'loading') {
    return (
      <div className={`min-h-[100dvh] bg-[#DCEAFF] flex flex-col items-center justify-center text-white ${inter.className}`}>
        <div className="w-12 h-12 border-4 border-[#0F2842]/20 border-t-[#2C5282] rounded-full animate-spin mb-4" />
        <p className="text-[13px] font-medium tracking-widest animate-pulse text-[#0F2842]">CALCULATING IDENTITY</p>
      </div>
    )
  }

  return (
    <main className={`min-h-[100dvh] w-full bg-[#DCEAFF] text-white relative flex flex-col items-center justify-center p-4 overflow-hidden ${inter.className}`}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(31,58,95,0.15),transparent_70%)] blur-[40px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          
          {gameState === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
              <div className="w-full bg-[#0F2842]/70 backdrop-blur-xl border border-[#6BA3D4]/20 rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="mb-4 relative flex flex-col items-center">
                  <Image src="/logo.png" alt="Logo" width={180} height={180} className="relative z-10 drop-shadow-2xl" priority />
                  <p className="relative z-10 text-[11px] text-[#6BA3D4]/80 mt-1 font-medium tracking-wide">by Saket Roy</p>
                </div>
                <h1 className={`${sora.className} text-[20px] font-semibold leading-[1.4] mb-2 text-[#E6F4FF]`}>
                  Let's see who you are when you're not performing
                </h1>
                <div className="w-full flex flex-col gap-3 mt-6">
                  {!session ? (
                    <button onClick={() => signIn('google')} className="w-full min-h-[50px] rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-[15px]">Sign in with Google</button>
                  ) : (
                    <>
                      <button onClick={() => { setSelectedSlot(null); setGameState('slot-selection'); }} className={`${sora.className} w-full min-h-[50px] rounded-xl bg-gradient-to-br from-[#2C5282] to-[#0F2842] border border-[#4A7BA7]/40 text-white font-bold shadow-lg`}>Enter Assessment</button>
                      <button onClick={() => signOut()} className="text-red-300 text-[11px] font-bold tracking-widest uppercase mt-2">Sign out</button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'slot-selection' && (
            <motion.div key="slot-selection" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
              <div className="w-full bg-[#0F2842]/70 backdrop-blur-xl border border-[#6BA3D4]/20 rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center">
                <h2 className={`${sora.className} text-[18px] font-semibold leading-[1.4] mb-6 text-[#E6F4FF]`}>
                  Select Your Time Slot
                </h2>
                <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={() => { setSelectedSlot(1); setGameState('quiz'); }}
                    className={`w-full p-4 rounded-xl border-2 transition-all font-bold tracking-widest text-white ${
                      selectedSlot === 1
                        ? 'bg-[#2C5282] border-[#6BA3D4]'
                        : 'bg-transparent border-[#6BA3D4]/30 hover:bg-[#2C5282]/30'
                    }`}
                  >
                    Slot 1: 9:30 AM — 12:30 PM
                  </button>
                  <button
                    onClick={() => { setSelectedSlot(2); setGameState('quiz'); }}
                    className={`w-full p-4 rounded-xl border-2 transition-all font-bold tracking-widest text-white ${
                      selectedSlot === 2
                        ? 'bg-[#2C5282] border-[#6BA3D4]'
                        : 'bg-transparent border-[#6BA3D4]/30 hover:bg-[#2C5282]/30'
                    }`}
                  >
                    Slot 2: 2:00 PM — 4:00 PM
                  </button>
                </div>
                <button
                  onClick={() => setGameState('landing')}
                  className="mt-6 text-[#6BA3D4] text-[11px] font-bold tracking-widest uppercase hover:text-[#E6F4FF] transition-colors"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'quiz' && (
            <motion.div key="quiz" className="w-full bg-[#0F2842]/50 backdrop-blur-xl rounded-[28px] p-2 border border-white/10 shadow-2xl">
               <CharacterQuiz onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {gameState === 'poster' && (
            <motion.div key="poster-slideshow-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
              <div className="relative w-full max-w-[340px] aspect-[9/13.5] rounded-[24px] overflow-hidden shadow-2xl border border-[#0F2842]/30 bg-[#0F2842]">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={posters[posterIndex]}
                    src={posters[posterIndex]} 
                    alt="The Buzz Poster" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </AnimatePresence>
              </div>
              
              <button 
                onClick={downloadCurrentPoster}
                className="px-6 py-2 bg-[#0F2842] border border-[#6BA3D4]/30 rounded-full text-[10px] font-bold tracking-[0.2em] text-[#6BA3D4] uppercase active:scale-95 transition-all"
              >
                Download This Poster
              </button>
            </motion.div>
          )}

          {gameState === 'ticket' && bookingData && (
            <motion.div key="ticket" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex justify-center">
               <TicketCard {...bookingData} userName={session?.user?.name || "Guest"} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}