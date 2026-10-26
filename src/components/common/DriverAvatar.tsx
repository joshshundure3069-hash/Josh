import React, { useState } from 'react';
import { User } from 'lucide-react';

interface DriverAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DriverAvatar: React.FC<DriverAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute initials
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-2xl',
    lg: 'w-14 h-14 text-base rounded-2xl',
    xl: 'w-20 h-20 text-xl rounded-3xl',
  }[size];

  // Colors based on name hash for consistent attractive gradient
  const colorSchemes = [
    'from-emerald-600 to-teal-800 text-emerald-100',
    'from-blue-600 to-indigo-800 text-blue-100',
    'from-amber-600 to-orange-800 text-amber-100',
    'from-cyan-600 to-blue-800 text-cyan-100',
    'from-purple-600 to-slate-800 text-purple-100',
  ];
  const charCodeSum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorScheme = colorSchemes[charCodeSum % colorSchemes.length];

  if (!avatarUrl || imageError) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br ${colorScheme} flex items-center justify-center font-black tracking-wider shadow shrink-0 border border-white/10 ${className}`}
        title={name}
      >
        {initials || <User size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden ${sizeClasses} ${className}`}>
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
