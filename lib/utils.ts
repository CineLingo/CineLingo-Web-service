import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a UUID v4
 * @returns A random UUID string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a filename with UUID and original extension
 * @param originalFilename - The original filename
 * @returns A new filename with UUID and original extension
 */
export function generateUUIDFilename(originalFilename: string): string {
  const extension = originalFilename.split('.').pop();
  const uuid = generateUUID();
  return extension ? `${uuid}.${extension}` : uuid;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
