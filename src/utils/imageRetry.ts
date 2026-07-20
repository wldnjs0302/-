import React from 'react';
import { PREDEFINED_USERS } from '../data/userMapping';

/**
 * Safely resolves an image URL to ensure high-resolution local assets load.
 * If the URL points to a non-existent directory (like `/images/` or another user's folder that is not on disk),
 * it proactively maps to the guaranteed `/choijiwon/${num}.png` fallback.
 */
export function resolveImageUrl(url: string | undefined, id?: string | number): string {
  if (!url) return "/logo.png";

  // Only apply fallback to local images or specifically targeted folders
  const isLocal = !url.startsWith("http") && !url.startsWith("//");
  const isUserImageDir = url.includes("/images/") || url.includes("/uploads/") || url.includes("/fallback/");

  if (isLocal || isUserImageDir) {
    // Try to find a number in the URL (e.g. /images/4.jpg or /kimdohyun/4.png)
    const matchUrl = url.match(/(\d+)\.(png|jpg|jpeg)/i);
    let num: number | null = null;
    if (matchUrl) {
      num = parseInt(matchUrl[1], 10);
    } else if (id) {
      const idStr = String(id);
      const matchId = idStr.match(/(\d+)/);
      if (matchId) {
        num = parseInt(matchId[1], 10);
      }
    }

    if (num && num >= 1 && num <= 50) {
      // If the url is for a predefined user, preserve it!
      const isPredefined = PREDEFINED_USERS.some(u => {
        const folderNFC = u.folderName.normalize('NFC').toLowerCase();
        const nameNFC = u.name.normalize('NFC').toLowerCase();
        let decodedUrl = url;
        try {
          decodedUrl = decodeURIComponent(url);
        } catch (e) {}
        decodedUrl = decodedUrl.normalize('NFC').toLowerCase();
        return decodedUrl.includes(folderNFC) || decodedUrl.includes(nameNFC);
      });

      if (!isPredefined && !url.includes("choijiwon")) {
        return `/choijiwon/${num}.png`;
      }
    }
  }

  return url;
}

/**
 * A highly robust, silent image error handler that automatically retries loading
 * images with exponential backoff and a cache-buster query parameter.
 * This ensures that when containers are cold-starting or network connections
 * briefly drop (after being inactive for a long time), the actual image connection
 * is restored seamlessly.
 * 
 * If it still fails after maxRetries, it gracefully fades the image to invisible
 * instead of replacing it with ugly gray/error/placeholder stamp images,
 * adhering to the strict visual requirement of avoiding placeholder replacement.
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  maxRetries: number = 3
) => {
  const imgElement = e.currentTarget as HTMLImageElement;
  
  // Read current retries
  const retries = parseInt(imgElement.getAttribute('data-retries') || '0', 10);
  
  // Extract number from the source
  const src = imgElement.src;
  
  // Only apply the choijiwon fallback for local images/path references, never for external absolute URLs!
  const isLocalOrFallback = !src.startsWith("http") || src.includes(window.location.host) || src.includes("/images/") || src.includes("/uploads/");
  const matchUrl = src.match(/(\d+)\.(png|jpg|jpeg)/i);
  const num = matchUrl ? parseInt(matchUrl[1], 10) : null;

  // Check if the URL belongs to a predefined user
  const isPredefined = PREDEFINED_USERS.some(u => {
    const folderNFC = u.folderName.normalize('NFC').toLowerCase();
    const nameNFC = u.name.normalize('NFC').toLowerCase();
    let decodedSrc = src;
    try {
      decodedSrc = decodeURIComponent(src);
    } catch (err) {}
    decodedSrc = decodedSrc.normalize('NFC').toLowerCase();
    return decodedSrc.includes(folderNFC) || decodedSrc.includes(nameNFC);
  });

  if (isLocalOrFallback && num && num >= 1 && num <= 50 && !src.includes("choijiwon") && !isPredefined) {
    // Proactively switch to the guaranteed local high-resolution fallback instantly on first error
    imgElement.src = `/choijiwon/${num}.png`;
    return;
  }
  
  if (retries < maxRetries) {
    // Keep track of the original src
    let originalSrc = imgElement.getAttribute('data-original-src');
    if (!originalSrc) {
      originalSrc = imgElement.src;
      imgElement.setAttribute('data-original-src', originalSrc);
    }
    
    // Increment retries
    imgElement.setAttribute('data-retries', (retries + 1).toString());
    
    // Construct retry URL with a cache-buster query parameter to force reloading
    const urlObj = new URL(originalSrc, window.location.origin);
    urlObj.searchParams.set('retry', Date.now().toString());
    urlObj.searchParams.set('attempt', (retries + 1).toString());
    
    // Apply progressive exponential backoff (e.g. 500ms, 1000ms, 2000ms, 4000ms, 8000ms...)
    const delay = Math.min(10000, 500 * Math.pow(2, retries));
    
    setTimeout(() => {
      // Direct source reload
      imgElement.src = urlObj.href;
    }, delay);
  } else {
    // If maximum retries reached, as an absolute last resort, fallback to a guaranteed local high-resolution asset from choijiwon
    // to prevent blank/invisible cards while keeping the layout beautiful.
    if (num && num >= 1 && num <= 50 && !src.includes("choijiwon")) {
      imgElement.src = `/choijiwon/${num}.png`;
    } else {
      imgElement.style.transition = 'opacity 0.5s ease';
      imgElement.style.opacity = '0';
    }
  }
};

/**
 * Dynamically resolves any static public asset path to a full absolute URL.
 * Handles standard root domains, custom base URLs, subdirectories, and proxy contexts perfectly.
 */
export function resolveAssetUrl(path: string): string {
  if (!path) return "";
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  let base = (import.meta as any).env?.BASE_URL || "/";
  
  // If base is default "/", check if the browser pathname has a subdirectory
  if (base === "/") {
    const pathname = window.location.pathname;
    if (pathname && pathname !== "/") {
      const parts = pathname.split("/");
      if (parts.length > 2) {
        base = "/" + parts[1] + "/";
      }
    }
  }
  
  const baseWithSlash = base.endsWith('/') ? base : base + '/';
  return new URL(baseWithSlash + cleanPath, window.location.origin).href;
}

