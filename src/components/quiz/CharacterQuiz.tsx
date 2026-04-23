'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { characters } from '@/lib/characters'

const quizData = [
  {
    question: "In a group, you are:",
    options: [
      { text: "The one doing the work quietly", type: "A" },
      { text: "The one observing everything", type: "B" },
      { text: "The one thinking what others think", type: "C" },
      { text: "The one trying to stay confident", type: "D" }
    ]
  },
  {
    question: "What affects you the most?",
    options: [
      { text: "Not being recognized", type: "A" },
      { text: "Feeling alone", type: "B" },
      { text: "Being judged", type: "C" },
      { text: "Not knowing your path", type: "D" }
    ]
  },
  {
    question: "When stressed, you:",
    options: [
      { text: "Work harder or escape into goals", type: "A" },
      { text: "Shut down or isolate", type: "B" },
      { text: "Overthink everything", type: "C" },
      { text: "Question your life choices", type: "D" }
    ]
  },
  {
    question: "Your biggest internal struggle:",
    options: [
      { text: "I need to prove myself", type: "A" },
      { text: "I feel alone", type: "B" },
      { text: "What do people think of me?", type: "C" },
      { text: "Is this really me?", type: "D" }
    ]
  },
  {
    question: "When you’re completely alone, you:",
    options: [
      { text: "Think about how to do better", type: "A" },
      { text: "Feel the silence and miss someone", type: "B" },
      { text: "Replay conversations and worry", type: "C" },
      { text: "Question who you really are", type: "D" }
    ]
  }
];

export default function CharacterQuiz({ onComplete }: { onComplete: (charName: string) => void }) {
  const [step, setStep] = useState(0)
  const [typeScores, setTypeScores] = useState<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 })

  const handleAnswer = (selectedType: string) => {
    const updatedScores = { 
      ...typeScores, 
      [selectedType]: typeScores[selectedType] + 1 
    };

    if (step < quizData.length - 1) {
      setTypeScores(updatedScores)
      setStep(step + 1)
    } else {
      const winnerType = Object.keys(updatedScores).reduce((a, b) => 
        updatedScores[a] > updatedScores[b] ? a : b
      )
      
      const possibleChars = characters.filter(c => c.type === winnerType)
      const finalChar = possibleChars[Math.floor(Math.random() * possibleChars.length)]
      
      onComplete(finalChar.name)
    }
  }

  return (
    <div className="w-full mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="bg-[#0F2842]/50 border border-[#6BA3D4]/20 p-8 rounded-[2rem] shadow-[0_10px_30px_rgba(15,40,66,0.3)]"
        >
          {/* Progress Tracker */}
          <div className="mb-10">
             <div className="flex justify-between items-end mb-3">
                <span className="text-[#6BA3D4] font-black text-xs tracking-[0.2em] uppercase">Phase 0{step + 1}</span>
                <span className="text-[#6BA3D4]/50 text-xs font-mono font-medium">{step + 1} / {quizData.length}</span>
             </div>
             <div className="h-1.5 w-full bg-[#2C5282]/30 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / quizData.length) * 100}%` }}
                  className="h-full bg-[#6BA3D4] shadow-[0_0_10px_rgba(107,163,212,0.6)]"
                />
             </div>
          </div>

          {/* Question */}
          <h2 className="text-2xl md:text-3xl font-black mb-10 text-[#FFF8DC] leading-tight tracking-tight drop-shadow-md">
            {quizData[step].question}
          </h2>
          
          {/* Options Grid */}
          <div className="space-y-3">
            {quizData[step].options.map((opt, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(opt.type)}
                className="w-full p-5 rounded-2xl border border-white/10 bg-[#2C5282]/20 text-[#E6F4FF]/90 hover:bg-[#2C5282]/40 hover:text-white hover:border-[#6BA3D4]/40 hover:shadow-lg transition-all duration-300 text-left font-semibold group flex items-center justify-between"
              >
                <span>{opt.text}</span>
                <span className="opacity-0 group-hover:opacity-100 text-[#6BA3D4] transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                  →
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}