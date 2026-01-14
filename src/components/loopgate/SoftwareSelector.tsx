import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { SOFTWARE_OPTIONS } from "./SoftwareBadge";
import { Button } from "@/components/ui/button";

interface SoftwareSelectorProps {
  value: string[];
  onChange: (software: string[]) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function SoftwareSelector({ value, onChange, onClose, isOpen = true }: SoftwareSelectorProps) {
  const [selected, setSelected] = useState<string[]>(value || []);
  
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
  
  const toggleSoftware = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };
  
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
        <h2 className="text-lg font-display font-semibold uppercase">Select Software</h2>
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>
      
      {/* Subtitle - Fixed */}
      <div className="flex-shrink-0 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Select all the editing software you use. You can choose multiple options.
        </p>
        {selected.length > 0 && (
          <span className="text-xs text-gold font-medium mt-1 block">
            {selected.length} selected
          </span>
        )}
      </div>
      
      {/* Options - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 overscroll-contain">
        <div className="grid gap-2 pb-4">
          {SOFTWARE_OPTIONS.map((software) => {
            const isSelected = selected.includes(software.id);
            
            return (
              <motion.button
                key={software.id}
                onClick={() => toggleSoftware(software.id)}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 p-3.5 rounded-lg border transition-all ${
                  isSelected 
                    ? 'bg-gold/10 border-gold' 
                    : 'bg-surface-1 border-border hover:border-gold/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isSelected ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'
                }`}>
                  {software.short}
                </div>
                <span className={`flex-1 text-left font-medium ${isSelected ? 'text-gold' : 'text-foreground'}`}>
                  {software.label}
                </span>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-gold border-gold' : 'border-muted-foreground/50'
                }`}>
                  {isSelected && <Check size={12} className="text-background" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Footer - Fixed */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background safe-area-bottom">
        <Button 
          onClick={handleSave}
          className="w-full bg-gold hover:bg-gold/90 text-background font-semibold h-12"
        >
          Save Software ({selected.length})
        </Button>
      </div>
    </motion.div>
  );
}
