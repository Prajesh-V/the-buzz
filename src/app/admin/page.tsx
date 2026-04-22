'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { checkIn, getBookingStats } from '@/app/actions'
import { CheckCircle2, AlertCircle, BarChart3, LogOut, ShieldAlert } from 'lucide-react'

const ALLOWED_ADMINS = ['prajeshv.03@gmail.com', 'roysaket45@gmail.com']; 

interface BookingStats {
  slot1: number;
  slot2: number;
  total: number;
  slot1Percentage: number;
  slot2Percentage: number;
  slot1Remaining: number;
  slot2Remaining: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<BookingStats>({ 
    slot1: 0, slot2: 0, total: 0, 
    slot1Percentage: 0, slot2Percentage: 0, 
    slot1Remaining: 225, slot2Remaining: 225 
  })

  const [scanStatus, setScanStatus] = useState<{ 
    type: 'idle' | 'success' | 'error' | 'loading', 
    message: string,
    userName?: string 
  }>({ type: 'idle', message: 'System Ready' })
  
  const [checkedInList, setCheckedInList] = useState<Array<{ 
    ticketId: string; userName: string; time: string 
  }>>([])
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && ALLOWED_ADMINS.includes(session.user?.email || '')) {
      loadStats()
      const interval = setInterval(loadStats, 10000) 
      
      // Auto-start scanner on mount
      setTimeout(initializeScanner, 500)

      return () => {
        clearInterval(interval)
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error)
        }
      }
    }
  }, [status, session])

  const loadStats = async () => {
    const result = await getBookingStats()
    if (result.success) {
      setStats({
        slot1: result.slot1 || 0,
        slot2: result.slot2 || 0,
        total: result.total || 0,
        slot1Percentage: result.slot1Percentage || 0,
        slot2Percentage: result.slot2Percentage || 0,
        slot1Remaining: result.slot1Remaining || 0,
        slot2Remaining: result.slot2Remaining || 0,
      })
    }
  }

  const initializeScanner = () => {
    if (scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      { 
        fps: 20, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1,
        videoConstraints: { facingMode: "environment" } // FORCES REAR CAMERA
      },
      false
    )

    scanner.render(
      async (decodedText) => {
        setScanStatus({ type: 'loading', message: 'Verifying...' })
        
        const result = await checkIn(decodedText)
        
        if (result.success) {
          setScanStatus({
            type: 'success',
            message: 'Access Granted',
            userName: result.userName
          })
          
          setCheckedInList(prev => [{
            ticketId: decodedText.substring(0, 8),
            userName: result.userName || 'Unknown Guest',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, ...prev].slice(0, 10))
          
          loadStats() 
        } else {
          setScanStatus({ type: 'error', message: result.message || 'Invalid Ticket' })
        }

        // AUTO-RESET: Prepare for next scan after 2.5 seconds
        setTimeout(() => {
          setScanStatus({ type: 'idle', message: 'System Ready' })
        }, 2500)
      },
      () => { /* noise */ }
    )

    scannerRef.current = scanner
  }

  if (status === 'loading') return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" /></div>

  if (!session || !ALLOWED_ADMINS.includes(session.user?.email || '')) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-red-600 mb-6" />
        <h1 className="text-4xl font-black italic mb-2 tracking-tighter">UNAUTHORIZED</h1>
        <button onClick={() => signIn('google')} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full">Admin Login</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Terminal_Admin</h1>
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">Rear Camera Active • {session.user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SCANNER SECTION */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
              
              <div className="relative aspect-square mb-6 rounded-3xl overflow-hidden bg-black border border-white/5">
                <div id="qr-scanner" className="w-full h-full" />
                
                {/* CONTINUOUS SCAN STATUS OVERLAY */}
                <AnimatePresence>
                  {scanStatus.type !== 'idle' && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={`absolute inset-0 flex flex-col items-center justify-center z-50 backdrop-blur-md ${
                        scanStatus.type === 'success' ? 'bg-green-600/90' : 
                        scanStatus.type === 'error' ? 'bg-red-600/90' : 'bg-black/60'
                      }`}
                    >
                      {scanStatus.type === 'success' ? <CheckCircle2 size={64} /> : 
                       scanStatus.type === 'error' ? <AlertCircle size={64} /> : 
                       <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />}
                      
                      <h2 className="text-2xl font-black mt-4 uppercase italic tracking-tighter">
                        {scanStatus.message}
                      </h2>
                      {scanStatus.userName && (
                        <p className="font-mono text-xs mt-2 bg-black/20 px-3 py-1 rounded-full uppercase">
                          {scanStatus.userName}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Live Scanner Active</p>
              </div>
            </div>
          </div>

          {/* STATS SECTION */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[1, 2].map(num => (
                  <div key={num} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slot {num}</span>
                      <span className="font-black text-2xl">{(num === 1 ? stats.slot1 : stats.slot2)}<span className="text-zinc-700 text-sm">/225</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(num === 1 ? stats.slot1Percentage : stats.slot2Percentage)}%` }} 
                        className={`h-full ${num === 1 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LOG SECTION */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h2 className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase mb-6">Activity_History</h2>
              <div className="space-y-3">
                {checkedInList.length === 0 ? (
                  <div className="py-10 text-center text-zinc-800 text-[10px] font-mono italic tracking-widest">Awaiting Verification...</div>
                ) : (
                  checkedInList.map((guest, idx) => (
                    <motion.div key={guest.time + idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors"
                    >
                      <div>
                        <p className="font-black italic text-sm uppercase tracking-tighter">{guest.userName}</p>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase">ID: {guest.ticketId}</p>
                      </div>
                      <p className="text-[10px] font-mono text-red-500">{guest.time}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}