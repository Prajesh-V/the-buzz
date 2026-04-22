'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { Sora, Inter } from 'next/font/google'
import Image from 'next/image'

const sora = Sora({ subsets: ['latin'], weight: ['500', '600', '700', '800'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

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

  useEffect(() => {
    QRCode.toDataURL(ticketId, { margin: 1, scale: 8, color: { dark: '#020617', light: '#ffffff' } }, (err, url) => {
      if (!err) setQrSrc(url)
    })
  }, [ticketId])

  const traits = characteristics[charId.toLowerCase()] || ['Identity', 'Confirmed']

  return (
    <div className="flex flex-col items-center w-full max-w-[350px]">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative w-full aspect-[9/16] rounded-[24px] overflow-hidden bg-[#020617] border border-[#60A5FA]/20 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img src={`/characters/${charId}.webp`} alt={charName} className="w-full h-full object-cover opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-25 w-75 mb-1">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <p className={`${inter.className} text-[9px] text-[#38BDF8] font-bold tracking-widest mt-[-6px]`}>by Saket Roy</p>
          </div>

          <div className="text-center">
            <p className={`${inter.className} text-[10px] text-[#60A5FA] uppercase tracking-[0.2em] mb-1 font-semibold`}>You resemble</p>
            <h3 className={`${sora.className} text-3xl font-bold mb-2 tracking-tight`}>{charName}</h3>
            <div className="flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.15em] text-white/50 uppercase">
              <span>{traits[0]}</span>
              <div className="w-1 h-1 bg-[#38BDF8] rounded-full shadow-[0_0_8px_#38BDF8]" />
              <span>{traits[1]}</span>
            </div>
          </div>

          <div className="bg-[#0b1220]/60 backdrop-blur-sm rounded-xl p-4 border border-white/5 flex flex-col items-center">
            <div className="bg-white p-1.5 rounded-lg mb-3">
              {qrSrc && <img src={qrSrc} alt="QR" className="w-24 h-24" />}
            </div>
            <p className={`${sora.className} text-base font-bold tracking-widest uppercase`}>SLOT #0{slot}</p>
          </div>

          <p className="text-center text-[8px] font-mono opacity-20 tracking-widest uppercase">ID: {ticketId.substring(0, 10)}</p>
        </div>
      </motion.div>

      <button onClick={() => signOut({ callbackUrl: '/' })} className="mt-6 w-full min-h-[44px] rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-[11px] tracking-widest uppercase hover:bg-red-500/20 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)]">
        Sign out
      </button>
    </div>
  )
}