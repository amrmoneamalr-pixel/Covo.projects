import { useState } from "react";

/**
 * DeveloperLogo - Shows a developer's logo at a fixed, consistent size.
 * Falls back to a colored circle with the developer's initial if the logo fails to load.
 *
 * Props:
 *   - name (string, required): developer name (used for initial + alt text)
 *   - url (string, optional): logo image URL
 *   - size (number, default 40): pixel size of the circle (width = height)
 */
export default function DeveloperLogo({ name, url, size = 40 }) {
  const [failed, setFailed] = useState(false);

  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const showImage = url && !failed;

  const dimension = `${size}px`;

  return (
    <div
      style={{ width: dimension, height: dimension }}
      className="shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm"
    >
      {showImage ? (
        <img
          src={url}
          alt={`${name} logo`}
          onError={() => setFailed(true)}
          className="w-full h-full object-contain p-1"
          loading="lazy"
        />
      ) : (
        <span
          className="text-[#B8860B] font-bold"
          style={{ fontSize: `${size * 0.4}px` }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
