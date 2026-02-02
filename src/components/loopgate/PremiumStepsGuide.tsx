import { motion } from "framer-motion";
import { Crown, CheckCircle2, Sparkles } from "lucide-react";
import RichMessageContent from "./RichMessageContent";

interface PremiumStep {
  title: string;
  description: string;
}

interface PremiumStepsGuideProps {
  steps: PremiumStep[];
  currentStep?: number;
  hasJoined: boolean;
}

export default function PremiumStepsGuide({ 
  steps, 
  currentStep = 0, 
  hasJoined
}: PremiumStepsGuideProps) {
  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 via-surface-1 to-surface-1 border-2 border-purple-500/40 rounded-xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-base flex items-center gap-2">
            <span>How to Enter</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </h3>
          <p className="text-[10px] text-muted-foreground">Follow these steps to compete</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = hasJoined && index === 0;
          const isCurrent = hasJoined ? index === 1 : index === 0;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex gap-4 p-3 rounded-lg transition-all ${
                isCompleted 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : isCurrent 
                    ? 'bg-purple-500/10 border border-purple-500/40' 
                    : 'bg-surface-2/50 border border-border'
              }`}
            >
              {/* Step Number */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isCompleted 
                  ? 'bg-emerald-500' 
                  : isCurrent 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : 'bg-surface-2 border border-border'
              }`}>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-background" />
                ) : (
                  <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-muted-foreground'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  isCompleted ? 'text-emerald-400' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${
                  isCompleted ? 'text-emerald-400/70' : 'text-muted-foreground'
                }`}>
                  <RichMessageContent content={step.description} />
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
}
