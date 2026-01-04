import { Shield, Building2 } from "lucide-react";

interface AuthorityBadgeProps {
  role: 'dev' | 'judge' | 'enterprise';
  size?: 'sm' | 'md';
}

export default function AuthorityBadge({ role, size = 'sm' }: AuthorityBadgeProps) {
  const config = {
    dev: { label: 'DEV', title: 'Loopgate Developer', icon: Shield, color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    judge: { label: 'JUDGE', title: 'Official Judge', icon: Shield, color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    enterprise: { label: 'ENTERPRISE', title: 'Enterprise Client', icon: Building2, color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  };
  
  const { label, title, icon: Icon, color } = config[role];
  
  const sizeClasses = size === 'sm' 
    ? 'h-4 px-1.5 text-[9px] gap-0.5' 
    : 'h-5 px-2 text-[10px] gap-1';
  
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses} ${color} rounded-full font-semibold uppercase tracking-wider border`}
      title={title}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  );
}
