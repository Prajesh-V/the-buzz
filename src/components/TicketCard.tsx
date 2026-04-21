'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { toPng } from 'html-to-image'

interface TicketProps {
  userName: string;
  charName: string;
  charId: string; // This matches the filename in /public/characters/
  slot: number;
  ticketId: string;
}

export default function TicketCard({ userName, charName, charId, slot, ticketId }: TicketProps) {
  const [qrSrc, setQrSrc] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate QR code based on the unique Ticket ID from Supabase
    QRCode.toDataURL(ticketId, { margin: 2, scale: 8 }, (err, url) => {
      if (!err) setQrSrc(url)
    })
  }, [ticketId])

  const handleDownload = async () => {
    if (!ticketRef.current) return
    
    setIsDownloading(true)
    try {
      const dataUrl = await toPng(ticketRef.current)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `ticket-${charName.toLowerCase()}-${ticketId.substring(0, 8)}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div 
        ref={ticketRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm aspect-[9/16] rounded-[2rem] overflow-hidden shadow-2xl bg-black border border-white/10"
      >
        {/* 1. The Character Portrait (Background) */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`/characters/${charId}.webp`} 
            alt={charName}
            className="w-full h-full object-cover opacity-60"
          />
          {/* Dark gradient so text and QR are readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* 2. Ticket Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-between p-8 text-white">
          
          {/* Top Section */}
          <div className="text-center mt-4">
            <p className="text-red-500 font-mono text-xs tracking-[0.3em] uppercase mb-2">Exclusive Entry</p>
            <h2 className="text-4xl font-black italic tracking-tighter">THE BUZZ</h2>
          </div>

          {/* Middle Section: The Reveal */}
          <div className="text-center">
            <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Your Identity</p>
            <h3 className="text-3xl font-bold text-white mb-2">{charName}</h3>
            <div className="h-[2px] w-12 bg-red-600 mx-auto" />
          </div>

          {/* Bottom Section: QR and Slot */}
          <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col items-center">
            <div className="bg-white p-2 rounded-xl mb-4">
              {qrSrc && <img src={qrSrc} alt="Ticket QR" className="w-32 h-32" />}
            </div>
            
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase font-mono">Admit One: {userName}</p>
              <p className="text-lg font-bold mt-1">SLOT #0{slot}</p>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 font-mono mb-2">ID: {ticketId.substring(0, 8)}</p>
        </div>
      </motion.div>

      {/* Download Button */}
      <motion.button
        onClick={handleDownload}
        disabled={isDownloading}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={20} />
        {isDownloading ? 'Downloading...' : 'Download Ticket'}
      </motion.button>
    </div>
  )
}