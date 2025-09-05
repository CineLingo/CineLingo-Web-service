"use client";

import Image from "next/image";
import React, { useState } from "react";

type ProfileAvatarProps = {
  avatarUrl?: string;
  alt?: string;
  size?: number;
  className?: string;
  fallback?: "initial" | "icon";
};

export default function ProfileAvatar({ avatarUrl, alt = "프로필 이미지", size = 32, className = "", fallback = "initial" }: ProfileAvatarProps) {
  const [errored, setErrored] = useState(false);
  const initials = alt?.trim()?.[0]?.toUpperCase() || "U";

  const dimension = { width: size, height: size };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      {avatarUrl && !errored ? (
        <Image
          src={avatarUrl}
          alt={alt}
          {...dimension}
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : fallback === "icon" ? (
        <svg
          className="w-1/2 h-1/2 text-gray-400 dark:text-gray-300"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}


