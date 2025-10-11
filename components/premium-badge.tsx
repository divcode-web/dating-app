import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  tierId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function PremiumBadge({ tierId, size = 'md', showLabel = false }: PremiumBadgeProps) {
  if (!tierId || tierId === 'free') return null;

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerSizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const tierLabels: Record<string, string> = {
    basic_monthly: 'Basic',
    standard_3month: 'Standard',
    premium_yearly: 'VIP'
  };

  const tierColors: Record<string, string> = {
    basic_monthly: 'from-pink-500 to-rose-600',
    standard_3month: 'from-purple-500 to-indigo-600',
    premium_yearly: 'from-yellow-500 to-amber-600'
  };

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${tierColors[tierId] || tierColors.premium_yearly} text-white rounded-full font-semibold ${containerSizes[size]}`}>
        <Crown className={sizes[size]} />
        <span>{tierLabels[tierId] || 'Premium'}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center bg-gradient-to-r ${tierColors[tierId] || tierColors.premium_yearly} text-white rounded-full p-1`} title={`${tierLabels[tierId] || 'Premium'} Member`}>
      <Crown className={sizes[size]} />
    </div>
  );
}
