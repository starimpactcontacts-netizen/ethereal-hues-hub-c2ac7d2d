import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { ARCHETYPES, ArchetypeId } from "./ArchetypeBadge";
import { Button } from "@/components/ui/button";

interface ArchetypeSelectorProps {
  value: string | null;
  onChange: (archetype: string | null) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function ArchetypeSelector({ value, onChange, onClose, isOpen = true }: ArchetypeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(value);
  
  const handleSave = () => {
    onChange(selected);
    onClose?.();
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-display font-semibold">Select Your Archetype</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        {/* Subtitle */}
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Choose your primary editing identity. This defines your main focus as an editor.
        </p>
        
        {/* Options */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid gap-2">
            {ARCHETYPES.map((archetype) => {
              const Icon = archetype.icon;
              const isSelected = selected === archetype.id;
              
              return (
                <motion.button
                  key={archetype.id}
                  onClick={() => setSelected(archetype.id)}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-gold/10 border-gold' 
                      : 'bg-surface-1 border-border hover:border-gold/30'
                  }`}
                >
                  <div className={`p-2 rounded-full ${isSelected ? 'bg-gold/20' : 'bg-muted'}`}>
                    <Icon size={20} className={isSelected ? 'text-gold' : 'text-muted-foreground'} />
                  </div>
                  <span className={`flex-1 text-left font-medium ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                    {archetype.label}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1 bg-gold rounded-full"
                    >
                      <Check size={14} className="text-background" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            onClick={handleSave}
            className="w-full bg-gold hover:bg-gold/90 text-background font-semibold"
          >
            Save Archetype
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
