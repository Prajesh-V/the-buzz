'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { Sora, Inter } from 'next/font/google'
import Image from 'next/image'
import { toPng } from 'html-to-image'

const sora = Sora({ subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

interface TicketProps {
  userName: string; 
  charName: string;
  charId: string;
  slot: number;
  ticketId: string;
}

const characteristics: Record<string, [string, string]> = {
  'aarav': ['Unseen', 'Listener'],
  'siddharth': ['Deflecting', 'Humour'],
  'zoya': ['Validation', 'Seeker'],
  'ayushi': ['Overthinking', 'Observer'],
  'kiara': ['Nostalgic', 'Soul'],
  'ayaan': ['Detached', 'Escapist'],
  'vihan': ['Trust', 'Issues'],
  'jhanvi': ['Silent', 'Observer']
}

export default function TicketCard({ charName, charId, slot, ticketId }: TicketProps) {
  const [qrSrc, setQrSrc] = useState('')
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    QRCode.toDataURL(ticketId, { 
      margin: 1, 
      scale: 8, 
      color: { dark: '#0F2842', light: '#ffffff' } 
    }, (err, url) => {
      if (!err) setQrSrc(url)
    })
  }, [ticketId])

  const traits = characteristics[charId.toLowerCase()] || ['Identity', 'Confirmed']
  
  // LOGIC FOR SLOT TIMINGS
  const slotTime = slot === 1 ? "9:30 AM — 12:30 PM" : "2:00 PM — 4:00 PM"
  const eventDate = "29-03-2026"

  const downloadTicketImage = async () => {
    if (ticketRef.current === null) return
    try {
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true,
        backgroundColor: '#DCEAFF',
      })
      const link = document.createElement('a')
      link.download = `the-buzz-ticket-${charName.toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[350px] gap-4">
      {/* THE CAPTURABLE TICKET AREA */}
      <div ref={ticketRef} className="p-4 bg-[#DCEAFF] rounded-[32px]"> 
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative w-full aspect-[9/16] rounded-[24px] overflow-hidden bg-[#0F2842] border border-[#4A7BA7]/30 shadow-2xl"
        >
          {/* ADJUSTED BACKGROUND IMAGE CONTAINER */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src={`/characters/${charId}.webp`} 
              alt={charName} 
              className="w-full h-[101%] -translate-y-[15%] object-cover opacity-60 grayscale" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F2842] via-[#0F2842]/10 to-transparent" />
          </div>

          <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
            {/* LOGO SECTION */}
            <div className="flex flex-col items-center text-center">
              <div className="relative h-20 w-44 mb-1">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
              </div>
              <p className={`${inter.className} text-[9px] text-[#6BA3D4] font-bold tracking-widest mt-[-2px]`}>by Saket Roy</p>
            </div>

            {/* CHARACTER SECTION */}
            <div className="text-center">
              <p className={`${inter.className} text-[10px] text-[#6BA3D4]/80 uppercase tracking-[0.2em] mb-1 font-semibold`}>You resemble</p>
              <h3 className={`${sora.className} text-3xl font-bold mb-2 tracking-tight text-[#FFF8DC]`}>{charName}</h3>
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.15em] text-white/90 uppercase">
                <span>{traits[0]}</span>
                <div className="w-1 h-1 bg-[#6BA3D4] rounded-full" />
                <span>{traits[1]}</span>
              </div>
            </div>

            {/* EVENT INFO SECTION - GLASSMORPHISM */}
            <div className="bg-blue-950/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center space-y-4">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                {qrSrc && <img src={qrSrc} alt="QR" className="w-28 h-28" />}
              </div>
              
              {/* DATE, TIMINGS & VENUE */}
              <div className="w-full text-center space-y-3">
                <p className={`${inter.className} text-[9px] text-[#6BA3D4]/60 font-mono uppercase tracking-[0.1em]`}>
                  Date : {eventDate}
                </p>
                <div className="h-[1px] w-12 bg-[#6BA3D4]/30 mx-auto" />
                <p className={`${sora.className} text-[14px] font-bold tracking-tight text-[#FFF8DC]`}>
                  {slotTime}
                </p>
                <div className="h-[1px] w-12 bg-[#6BA3D4]/30 mx-auto" />
                <p className={`${inter.className} text-xs font-bold tracking-widest text-[#6BA3D4] uppercase`}>
                  Venue: Lecture Hall 1
                </p>
              </div>
            </div>

            <p className="text-center text-[8px] font-mono opacity-40 tracking-widest uppercase text-[#6BA3D4]">ID: {ticketId.substring(0, 10)}</p>
          </div>
        </motion.div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="w-full space-y-3">
        <button 
          onClick={downloadTicketImage}
          className="w-full min-h-[48px] rounded-xl bg-[#6BA3D4] text-[#0F2842] font-bold text-[13px] tracking-widest uppercase active:scale-95 transition-all shadow-lg"
        >
          Download Ticket Image
        </button>

        <button 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="w-full min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] tracking-widest uppercase active:scale-95 transition-all shadow-lg"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}