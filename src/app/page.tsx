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
  const [gameState, setGameState] = useState<'landing' | 'quiz' | 'loading' | 'poster' | 'ticket' | 'full'>('landing')
  const [bookingData, setBookingData] = useState<{ charName: string, charId: string, slot: number, ticketId: string } | null>(null)
  
  const [posterIndex, setPosterIndex] = useState(0)
  const posters = ['/poster1.png', '/poster2.png', '/poster3.png']

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameState === 'poster') {
      interval = setInterval(() => {
        setPosterIndex((prev) => (prev + 1) % posters.length)
      }, 3000) // Each poster stays for 3 seconds
    }
    return () => clearInterval(interval)
  }, [gameState])

  const handleQuizComplete = async (charName: string) => {
    setGameState('loading')
    const character = characters.find(c => c.name === charName)
    const charId = character?.id || 'aarav' 

    if (session?.user?.email) {
      const result = await bookTicket(session.user.email, session.user.name || "Guest", charName)
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
      <div className={`min-h-[100dvh] bg-[#87CEEB] flex flex-col items-center justify-center text-white ${inter.className}`}>
        <div className="w-12 h-12 border-4 border-[#3D2B1F]/20 border-t-[#8B4513] rounded-full animate-spin mb-4" />
        <p className="text-[13px] font-medium tracking-widest animate-pulse text-[#3D2B1F]">CALCULATING IDENTITY</p>
      </div>
    )
  }

  return (
    <main className={`min-h-[100dvh] w-full bg-[#87CEEB] text-white relative flex flex-col items-center justify-center p-4 overflow-hidden ${inter.className}`}>
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(61,43,31,0.1),transparent_70%)] blur-[40px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          
          {gameState === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full">
              <div className="w-full bg-[#3D2B1F]/90 backdrop-blur-xl border border-[#D2B48C]/20 rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center">
                <div className="mb-4 relative flex flex-col items-center">
                  <Image src="/logo.png" alt="Logo" width={180} height={180} className="relative z-10 drop-shadow-2xl" priority />
                  <p className="relative z-10 text-[11px] text-[#D2B48C]/80 mt-1 font-medium tracking-wide">by Saket Roy</p>
                </div>
                <h1 className={`${sora.className} text-[20px] font-semibold leading-[1.4] mb-2 text-[#FFF8DC]`}>
                  If this made you uncomfortable, it did its job.
                </h1>
                <div className="w-full flex flex-col gap-3 mt-6">
                  {!session ? (
                    <button onClick={() => signIn('google')} className="w-full min-h-[50px] rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-[15px]">Sign in with Google</button>
                  ) : (
                    <>
                      <button onClick={() => setGameState('quiz')} className={`${sora.className} w-full min-h-[50px] rounded-xl bg-gradient-to-br from-[#5D4037] to-[#3D2B1F] border border-[#8B4513]/40 text-white font-bold shadow-lg`}>Enter Assessment</button>
                      <button onClick={() => signOut()} className="text-red-300 text-[11px] font-bold tracking-widest uppercase mt-2">Sign out</button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'quiz' && (
            <motion.div key="quiz" className="w-full bg-[#3D2B1F]/70 backdrop-blur-xl rounded-[28px] p-2 border border-white/10 shadow-2xl">
               <CharacterQuiz onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {gameState === 'poster' && (
            <motion.div key="poster-slideshow-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
              <div className="relative w-full max-w-[340px] aspect-[9/13.5] rounded-[24px] overflow-hidden shadow-2xl border border-[#3D2B1F]/30 bg-[#3D2B1F]">
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
                className="px-6 py-2 bg-[#3D2B1F] border border-[#D2B48C]/30 rounded-full text-[10px] font-bold tracking-[0.2em] text-[#D2B48C] uppercase active:scale-95 transition-all"
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