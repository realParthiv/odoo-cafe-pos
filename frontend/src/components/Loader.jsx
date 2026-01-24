import React from "react";
import { theme } from "../theme/theme";

const Loader = ({ size = "large", color = "primary" }) => {
  const isSmall = size === "small";
  const sizeClass = isSmall ? "w-6 h-6" : "w-16 h-16";
  const borderClass = isSmall ? "border-2" : "border-4";
  const containerClass = isSmall
    ? "flex justify-center items-center"
    : "flex flex-col items-center justify-center p-4";

  return (
    <div className={containerClass}>
      <div className={`relative ${sizeClass}`}>
        <div
          className={`absolute top-0 left-0 w-full h-full ${borderClass} rounded-full animate-spin`}
          style={{
            borderColor: `${theme.colors.border} transparent transparent transparent`,
          }}
        />
        <div
          className={`absolute top-0 left-0 w-full h-full ${borderClass} rounded-full animate-spin`}
          style={{
            borderColor: `transparent ${isSmall ? "#fff" : theme.colors.primary} transparent transparent`,
            animationDelay: "-0.15s",
          }}
        />
        <div
          className={`absolute top-0 left-0 w-full h-full ${borderClass} rounded-full animate-spin`}
          style={{
            borderColor: `transparent transparent ${isSmall ? "#fff" : theme.colors.secondary} transparent`,
            animationDelay: "-0.3s",
          }}
        />
        <div
          className={`absolute top-0 left-0 w-full h-full ${borderClass} rounded-full animate-spin`}
          style={{
            borderColor: `transparent transparent transparent ${isSmall ? "#fff" : theme.colors.accent}`,
            animationDelay: "-0.45s",
          }}
        />
      </div>
      {!isSmall && (
        <p
          className="mt-4 text-sm font-medium animate-pulse"
          style={{ color: theme.colors.text.secondary }}
        >
          Loading...
        </p>
      )}
    </div>
  );
};

export default Loader;
