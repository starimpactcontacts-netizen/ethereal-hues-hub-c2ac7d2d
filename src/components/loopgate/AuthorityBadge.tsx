import { Shield, Building2 } from "lucide-react";

import { Gavel } from "lucide-react";

interface AuthorityBadgeProps {
  role: 'dev' | 'judge' | 'enterprise';
  size?: 'sm' | 'md';
}

export default function AuthorityBadge({ role, size = 'sm' }: AuthorityBadgeProps) {
  const config = {
    dev: { label: 'DEV', title: 'Loopgate Developer', icon: Shield, color: 'bg-muted text-blue-400 border-border' },
    judge: { label: 'JUDGE', title: 'Official QOI Judge', icon: Gavel, color: 'bg-muted text-muted-foreground border-border' },
    enterprise: { label: 'ENTERPRISE', title: 'Enterprise Client', icon: Building2, color: 'bg-muted text-purple-400 border-border' },
  };
  
  const { label, title, icon: Icon, color } = config[role];
  
  const sizeClasses = size === 'sm' 
    ? 'h-4 px-1.5 text-[9px] gap-0.5' 
    : 'h-5 px-2 text-[10px] gap-1';
  
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  
  return (
    <span 
      className={`inline-flex items-center ${sizeClasses} ${color} rounded font-medium uppercase tracking-wider border`}
      title={title}
    >
      <Icon className={iconSize} />
      {label}
    </span>
  );
}
