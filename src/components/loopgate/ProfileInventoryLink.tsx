import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ProfileInventoryLink() {
  return (
    <Link to="/inventory">
      <motion.div 
        whileTap={{ scale: 0.98 }}
        className="bg-surface-1 border border-border rounded-md p-2 flex items-center gap-1.5 hover:border-foreground/30 transition-colors"
      >
        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
          <Package className="w-3 h-3 text-primary" />
        </div>
        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="text-[10px] font-medium">Items</p>
        </div>
      </motion.div>
    </Link>
  );
}
