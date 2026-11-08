'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showStatusDot?: boolean;
  variant?: 'dark' | 'light' | 'subtle';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-5 h-5 text-[10px] rounded-[4px]',
  sm: 'w-6 h-6 text-[10px] rounded-[4px]',
  md: 'w-8 h-8 text-xs rounded-[6px]',
  lg: 'w-9 h-9 text-xs rounded-[6px]',
  xl: 'w-16 h-16 text-xl rounded-[8px]',
};

const DOT_CLASSES: Record<NonNullable<UserAvatarProps['size']>, string> = {
  xs: 'w-2 h-2 -bottom-0.5 -right-0.5 rounded-[2px]',
  sm: 'w-2 h-2 -bottom-0.5 -right-0.5 rounded-[2px]',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 rounded-[2px]',
  lg: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 rounded-[2px]',
  xl: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 rounded-[3px]',
};

const VARIANT_CLASSES: Record<NonNullable<UserAvatarProps['variant']>, string> = {
  dark: 'bg-zinc-950 text-white border-zinc-950',
  light: 'bg-white text-zinc-900 border-zinc-200',
  subtle: 'bg-zinc-100 text-zinc-900 border-zinc-200',
};

export default function UserAvatar({
  name = 'User',
  avatar,
  size = 'md',
  isOnline,
  showStatusDot = false,
  variant = 'subtle',
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : 'U';
  const showImage = Boolean(avatar && avatar.trim() && !imgError);

  return (
    <div className={`relative shrink-0 inline-flex ${className}`}>
      <div
        className={`${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} border flex items-center justify-center font-bold overflow-hidden select-none`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {showStatusDot && (
        <span
          className={`absolute border border-white ${DOT_CLASSES[size]} ${
            isOnline ? 'bg-emerald-600' : 'bg-zinc-300'
          }`}
        />
      )}
    </div>
  );
}

