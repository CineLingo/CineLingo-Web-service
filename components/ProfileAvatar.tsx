"use client";

import Image from "next/image";
import React, { useState } from "react";

type ProfileAvatarProps = {
  avatarUrl?: string;
  alt?: string;
  size?: number;
  className?: string;
};

export default function ProfileAvatar({ avatarUrl, alt = "프로필 이미지", size = 32, className = "" }: ProfileAvatarProps) {
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
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}


