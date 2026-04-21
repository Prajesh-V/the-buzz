'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { checkIn, getBookingStats } from '@/app/actions'
import { CheckCircle2, AlertCircle, BarChart3, LogOut, ShieldAlert } from 'lucide-react'

// EDIT THIS LIST TO CONTROL ACCESS
const ALLOWED_ADMINS = ['prajeshv.03@gmail.com']; 

// Define the stats type for TypeScript consistency
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
  
  // Initializing state with default numeric values
  const [stats, setStats] = useState<BookingStats>({ 
    slot1: 0, slot2: 0, total: 0, 
    slot1Percentage: 0, slot2Percentage: 0, 
    slot1Remaining: 200, slot2Remaining: 200 
  })

  const [checkInResult, setCheckInResult] = useState<{ 
    success: boolean; message: string; userName?: string; charName?: string 
  } | null>(null)
  
  const [checkedInList, setCheckedInList] = useState<Array<{ 
    ticketId: string; userName: string; charName: string; time: string 
  }>>([])
  
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null)

  // 1. Load stats on mount and refresh interval
  useEffect(() => {
    if (status === 'authenticated' && ALLOWED_ADMINS.includes(session.user?.email || '')) {
      loadStats()
      const interval = setInterval(loadStats, 10000) 
      return () => clearInterval(interval)
    }
  }, [status, session])

  const loadStats = async () => {
    const result = await getBookingStats()
    
    // Check for success AND that the key data exists
    if (result.success && 'slot1' in result) {
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

  // 2. QR Scanner Logic
  const initializeScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
        disableFlip: false
      },
      false
    )

    scanner.render(
      async (decodedText) => {
        await scanner.pause()
        
        const result = await checkIn(decodedText)
        
        if (result.success) {
          setCheckInResult({
            success: true,
            message: result.message,
            userName: result.userName,
            charName: result.charName
          })
          
          setCheckedInList(prev => [{
            ticketId: decodedText.substring(0, 8),
            userName: result.userName || 'Unknown',
            charName: result.charName || 'Unknown',
            time: new Date().toLocaleTimeString()
          }, ...prev].slice(0, 10))
          
          setTimeout(loadStats, 500) 
        } else {
          setCheckInResult({ success: false, message: result.message })
        }

        setTimeout(() => {
          setCheckInResult(null)
          scanner.resume()
        }, 3000)
      },
      (error) => { /* ignore scan noise */ }
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

  // --- RENDERING LOGIC ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session || !ALLOWED_ADMINS.includes(session.user?.email || '')) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-red-600 mb-6" />
        <h1 className="text-4xl font-black italic mb-2 tracking-tighter">UNAUTHORIZED</h1>
        <p className="text-zinc-500 max-w-xs mb-8">
          This terminal is restricted. Your identity is not registered in the staff database.
        </p>
        <button 
          onClick={() => status === 'unauthenticated' ? signIn('google') : window.location.href = '/'}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all"
        >
          {status === 'unauthenticated' ? 'Sign In as Admin' : 'Return Home'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-10 font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter mb-1">ADMIN PORTAL</h1>
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Terminal • {session.user?.email}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 hover:bg-red-600/10 hover:border-red-600/50 text-zinc-400 hover:text-red-500 rounded-2xl transition-all"
          >
            <LogOut size={18} />
            <span className="font-bold text-sm uppercase">Disconnect</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <section className="lg:col-span-4">
            <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="p-2 bg-red-600/20 rounded-lg text-red-500">
                  <BarChart3 size={20} />
                </span>
                Access Control
              </h2>

              <div className="relative aspect-square mb-6 rounded-3xl overflow-hidden bg-black border border-white/5 shadow-inner">
                {scanning ? (
                  <div id="qr-scanner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                    <div className="w-16 h-16 border-2 border-dashed border-zinc-800 rounded-full flex items-center justify-center mb-4">
                      <ShieldAlert size={24} />
                    </div>
                    <p className="text-xs font-mono tracking-widest uppercase">Scanner Offline</p>
                  </div>
                )}
              </div>

              <button
                onClick={toggleScanner}
                className={`w-full py-4 rounded-2xl font-black tracking-widest uppercase transition-all active:scale-95 ${
                  scanning ? 'bg-zinc-800 text-red-500 border border-red-500/30' : 'bg-red-600 text-white'
                }`}
              >
                {scanning ? 'Stop Scanning' : 'Initiate Scan'}
              </button>

              <AnimatePresence>
                {checkInResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mt-6 p-4 rounded-2xl border ${
                      checkInResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex gap-3">
                      {checkInResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      <div>
                        <p className="font-bold text-sm">{checkInResult.message}</p>
                        {checkInResult.userName && (
                          <p className="text-[10px] opacity-70 uppercase mt-1">{checkInResult.userName} • {checkInResult.charName}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="lg:col-span-8 space-y-8">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h2 className="text-zinc-500 text-xs font-mono tracking-[0.3em] uppercase mb-8">Capacity Tracking</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-tighter">Slot 1 Engagement</span>
                    <span className="font-black text-2xl">{stats.slot1}<span className="text-zinc-700 text-sm">/200</span></span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${stats.slot1Percentage}%` }}
                      className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 uppercase font-mono">{stats.slot1Remaining} Seats Left</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-tighter">Slot 2 Engagement</span>
                    <span className="font-black text-2xl">{stats.slot2}<span className="text-zinc-700 text-sm">/200</span></span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${stats.slot2Percentage}%` }}
                      className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 uppercase font-mono">{stats.slot2Remaining} Seats Left</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
              <h2 className="text-zinc-500 text-xs font-mono tracking-[0.3em] uppercase mb-6">Recent Check-ins</h2>
              <div className="space-y-3">
                {checkedInList.length === 0 ? (
                  <div className="py-12 text-center text-zinc-700 font-mono text-xs italic">Waiting for incoming guests...</div>
                ) : (
                  <AnimatePresence>
                    {checkedInList.map((guest, idx) => (
                      <motion.div 
                        key={guest.time + idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div>
                          <p className="font-black italic text-sm">{guest.userName}</p>
                          <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest">{guest.charName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500">{guest.time}</p>
                          <p className="text-[9px] text-zinc-700 font-mono uppercase">ID: {guest.ticketId}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.div>

      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-600/5 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 blur-[120px] pointer-events-none -z-10" />
    </div>
  )
}