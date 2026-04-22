'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { checkIn, getBookingStats } from '@/app/actions'
import { CheckCircle2, AlertCircle, BarChart3, LogOut, ShieldAlert } from 'lucide-react'

// RESTRICTED ACCESS LIST
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
  const [scanning, setScanning] = useState(false)
  
  const [stats, setStats] = useState<BookingStats>({ 
    slot1: 0, slot2: 0, total: 0, 
    slot1Percentage: 0, slot2Percentage: 0, 
    slot1Remaining: 225, slot2Remaining: 225 
  })

  const [checkInResult, setCheckInResult] = useState<{ 
    success: boolean; message: string; userName?: string;
  } | null>(null)
  
  const [checkedInList, setCheckedInList] = useState<Array<{ 
    ticketId: string; userName: string; time: string 
  }>>([])
  
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && ALLOWED_ADMINS.includes(session.user?.email || '')) {
      loadStats()
      const interval = setInterval(loadStats, 10000) 
      return () => clearInterval(interval)
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
    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
      false
    )

    scanner.render(
      async (decodedText) => {
        // Prevent duplicate scans while processing
        await scanner.pause()
        
        const result = await checkIn(decodedText)
        
        if (result.success) {
          setCheckInResult({
            success: true,
            message: result.message,
            userName: result.userName
          })
          
          setCheckedInList(prev => [{
            ticketId: decodedText.substring(0, 8),
            userName: result.userName || 'Unknown Guest',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, ...prev].slice(0, 10))
          
          loadStats() 
        } else {
          setCheckInResult({ success: false, message: result.message })
        }

        // Resume scanner after 3 seconds
        setTimeout(() => {
          setCheckInResult(null)
          scanner.resume()
        }, 3000)
      },
      () => { /* noise */ }
    )

    qrScannerRef.current = scanner
  }

  const toggleScanner = async () => {
    if (!scanning) {
      setScanning(true)
      setTimeout(initializeScanner, 100)
    } else {
      if (qrScannerRef.current) {
        await qrScannerRef.current.clear()
        qrScannerRef.current = null
      }
      setScanning(false)
    }
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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">Terminal_Admin</h1>
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">Live Feed • {session.user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="p-3 bg-zinc-900 border border-white/5 rounded-xl text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={20}/></button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Scanner Side */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <div className="relative aspect-square mb-6 rounded-3xl overflow-hidden bg-black border border-white/5">
                {scanning ? <div id="qr-scanner" className="w-full h-full" /> : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                    <ShieldAlert size={48} className="mb-4 opacity-20" />
                    <p className="text-[10px] font-mono tracking-widest uppercase">System Standby</p>
                  </div>
                )}
              </div>
              <button onClick={toggleScanner} className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${scanning ? 'bg-zinc-800 text-red-500' : 'bg-red-600 text-white'}`}>
                {scanning ? 'Kill Scanner' : 'Initialize Scan'}
              </button>

              <AnimatePresence>
                {checkInResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mt-6 p-4 rounded-2xl border ${checkInResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                  >
                    <div className="flex gap-3">
                      {checkInResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      <div>
                        <p className="font-bold text-sm">{checkInResult.message}</p>
                        {checkInResult.userName && <p className="text-[10px] opacity-70 uppercase mt-1">Guest: {checkInResult.userName}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Side */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[1, 2].map(num => (
                  <div key={num} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Slot {num} Occupancy</span>
                      <span className="font-black text-2xl">{(num === 1 ? stats.slot1 : stats.slot2)}<span className="text-zinc-700 text-sm">/225</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(num === 1 ? stats.slot1Percentage : stats.slot2Percentage)}%` }} 
                        className={`h-full ${num === 1 ? 'bg-red-600' : 'bg-white'}`} 
                      />
                    </div>
                    <p className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter">{(num === 1 ? stats.slot1Remaining : stats.slot2Remaining)} Slots Available</p>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h2 className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase mb-6">Access Log_Recent</h2>
              <div className="space-y-3">
                {checkedInList.length === 0 ? (
                  <div className="py-10 text-center text-zinc-800 text-[10px] font-mono italic tracking-widest">Awaiting Identity Verification...</div>
                ) : (
                  checkedInList.map((guest, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5"
                    >
                      <div>
                        <p className="font-black italic text-sm uppercase tracking-tighter">{guest.userName}</p>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase">Validated • ID: {guest.ticketId}</p>
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