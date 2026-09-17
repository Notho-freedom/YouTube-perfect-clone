import React from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: 'bottom' | 'top';
}

/** YouTube's small dark tooltip, shown after a short hover delay. */
export function Tooltip({ label, children, side = 'bottom' }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded bg-[#616161] px-2 py-1 text-[12px] font-medium leading-4 text-white opacity-0 transition-opacity delay-300 duration-150 ease-out group-hover/tooltip:opacity-100 ${
        side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'}`
        }>
        
        {label}
      </span>
    </span>);

}