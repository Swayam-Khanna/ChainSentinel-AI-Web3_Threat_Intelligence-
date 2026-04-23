import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string | undefined): string {
  if (!address) return '0x0000...0000';
  if (address === '0x') return 'Contract Creation';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatEth(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) / 1e18 : value / 1e18;
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function shortHash(hash: string | undefined): string {
  if (!hash) return '0x0000...0000';
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
}

export function timeAgo(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
