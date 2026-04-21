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
    // Update score logic
    const updatedScores = { 
      ...typeScores, 
      [selectedType]: typeScores[selectedType] + 1 
    };

    if (step < quizData.length - 1) {
      setTypeScores(updatedScores)
      setStep(step + 1)
    } else {
      // Logic for the final step
      const winnerType = Object.keys(updatedScores).reduce((a, b) => 
        updatedScores[a] > updatedScores[b] ? a : b
      )
      
      const possibleChars = characters.filter(c => c.type === winnerType)
      const finalChar = possibleChars[Math.floor(Math.random() * possibleChars.length)]
      
      onComplete(finalChar.name)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
        >
          <div className="mb-8">
             <div className="flex justify-between items-end mb-2">
                <span className="text-red-500 font-mono text-xs tracking-widest uppercase">Step {step + 1}</span>
                <span className="text-zinc-500 text-xs font-mono">{step + 1} / {quizData.length}</span>
             </div>
             <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / quizData.length) * 100}%` }}
                  className="h-full bg-red-600"
                />
             </div>
          </div>

          <h2 className="text-2xl font-bold mb-8 text-white leading-tight">
            {quizData[step].question}
          </h2>
          
          <div className="space-y-3">
            {quizData[step].options.map((opt, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(opt.type)}
                className="w-full p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white hover:text-black transition-all text-left font-medium group"
              >
                {opt.text}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}