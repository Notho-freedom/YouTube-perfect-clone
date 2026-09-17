import React from 'react';
import { CircleUserRoundIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SignInPromptProps {
  title: string;
  description: string;
}

export function SignInPrompt({ title, description }: SignInPromptProps) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center px-4 py-24 text-center">
      <h1 className="text-[24px] font-bold leading-8 text-yt-text">{title}</h1>
      <p className="mt-2 max-w-[420px] text-[14px] leading-5 text-yt-sub">{description}</p>
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        className="mt-6 flex h-9 items-center gap-1.5 rounded-full border border-yt-searchBorder pl-3 pr-4 text-[14px] font-medium leading-none text-yt-blue transition-colors duration-150 hover:bg-[rgba(6,95,212,0.1)] dark:hover:bg-[rgba(62,166,255,0.2)]">
        
        <CircleUserRoundIcon className="h-6 w-6" strokeWidth={1.8} />
        Sign in
      </button>
    </div>);

}