import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface FormatInfoProps {
  title: string;
  description: string;
  steps: string[];
  contentTip: string;
}

export default function JudgeFormatInfo({ title, description, steps, contentTip }: FormatInfoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        title={`How ${title} works`}
      >
        <Info className="w-3.5 h-3.5 text-white/70" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl p-5 mx-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-white tracking-wide">{title}</h3>
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4">{description}</p>

              <div className="space-y-2 mb-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-900 text-red-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-zinc-300">{step}</p>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">Content Tip</p>
                <p className="text-xs text-zinc-300">{contentTip}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
