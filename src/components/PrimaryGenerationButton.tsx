import React from "react";
import { Sparkles } from "lucide-react";

interface PrimaryGenerationButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

export default function PrimaryGenerationButton({ children, disabled = false, onClick }: PrimaryGenerationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 min-w-72 items-center justify-center gap-2 rounded-md bg-violet-600 px-12 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Sparkles className="h-5 w-5" />
      {children}
    </button>
  );
}
