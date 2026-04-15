"use client";
import { getFlagUrl } from "@/lib/countries";

/**
 * Renders a country flag image from flagcdn.com
 * Falls back to a neutral placeholder if the image fails to load.
 *
 * Props:
 *   code    - ISO 3166-1 alpha-2 code (e.g. "IT")
 *   name    - Country name, used as alt text
 *   size    - Pixel width (default 32). Height is auto.
 *   style   - Extra inline styles
 */
export default function FlagImage({ code, name = "", size = 32, style = {} }) {
  if (!code) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size * 0.67,
          background: "rgba(255,255,255,0.1)",
          borderRadius: "3px",
          fontSize: size * 0.5,
          ...style,
        }}
      >
        🏳️
      </span>
    );
  }

  return (
    <img
      src={getFlagUrl(code, size > 80 ? 80 : 40)}
      alt={name || code}
      width={size}
      style={{
        borderRadius: "3px",
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
