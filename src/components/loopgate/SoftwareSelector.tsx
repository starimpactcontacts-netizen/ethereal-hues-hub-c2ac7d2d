import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { SOFTWARE_OPTIONS, SoftwareId } from "./SoftwareBadge";
import { Button } from "@/components/ui/button";

interface SoftwareSelectorProps {
  value: string[];
  onChange: (software: string[]) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export default function SoftwareSelector({ value, onChange, onClose, isOpen = true }: SoftwareSelectorProps) {
  const [selected, setSelected] = useState<string[]>(value || []);
  
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
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-display font-semibold">Select Software</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        
        {/* Subtitle */}
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Select all the editing software you use. You can choose multiple options.
        </p>
        
        {/* Selected count */}
        {selected.length > 0 && (
          <div className="px-4 pb-2">
            <span className="text-xs text-gold font-medium">
              {selected.length} selected
            </span>
          </div>
        )}
        
        {/* Options */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid gap-2">
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
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            onClick={handleSave}
            className="w-full bg-gold hover:bg-gold/90 text-background font-semibold"
          >
            Save Software ({selected.length})
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
