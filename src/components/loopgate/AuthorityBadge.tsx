import { Shield } from "lucide-react";

interface AuthorityBadgeProps {
  role: 'dev' | 'judge';
  size?: 'sm' | 'md';
}

export default function AuthorityBadge({ role, size = 'sm' }: AuthorityBadgeProps) {
  const label = role === 'dev' ? 'DEV' : 'JUDGE';
  
  const sizeClasses = size === 'sm' 
    ? 'h-4 px-1.5 text-[9px] gap-0.5' 
    : 'h-5 px-2 text-[10px] gap-1';
  
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses} bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full font-semibold uppercase tracking-wider`}
      title={role === 'dev' ? 'Loopgate Developer' : 'Official Judge'}
    >
      <Shield className={iconSize} />
      {label}
    </span>
  );
}
