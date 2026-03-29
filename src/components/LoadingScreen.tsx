import React from "react";

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-on-surface-variant font-medium animate-pulse">Initializing Atelier...</p>
    </div>
  </div>
);

export default LoadingScreen;