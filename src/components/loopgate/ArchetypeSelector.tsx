import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { ARCHETYPES } from "./ArchetypeBadge";
import { Button } from "@/components/ui/button";

interface ArchetypeSelectorProps {
  value: string | null;
  onChange: (archetype: string | null) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function ArchetypeSelector({ value, onChange, onClose, isOpen = true }: ArchetypeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(value);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);
  
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
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
        <h2 className="text-base font-display font-semibold uppercase">Select Archetype</h2>
        <Button 
          onClick={handleSave}
          size="sm"
          className="bg-gold hover:bg-gold/90 text-background font-semibold px-4"
        >
          Save
        </Button>
      </div>
      
      {/* Subtitle - Fixed */}
      <p className="flex-shrink-0 px-4 py-3 text-sm text-muted-foreground">
        Choose your primary editing identity.
      </p>
      
      {/* Options - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 overscroll-contain">
        <div className="grid gap-2 pb-4">
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
    </motion.div>
  );
}
