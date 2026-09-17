import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface MenuItem {
  icon?: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  onSelect?: () => void;
  /** Renders a hairline above the item. */
  separated?: boolean;
}

interface DropdownMenuProps {
  items: MenuItem[];
  /** The trigger's accessible name. */
  label: string;
  icon: React.ReactNode;
  triggerClassName?: string;
  wrapperClassName?: string;
  align?: 'left' | 'right';
  width?: number;
}

export function DropdownMenu({
  items,
  label,
  icon,
  triggerClassName = '',
  wrapperClassName = '',
  align = 'right',
  width = 250
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={triggerClassName}>
        
        {icon}
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          style={{
            width,
            transformOrigin: align === 'right' ? 'top right' : 'top left',
            [align]: 0
          }}
          className="absolute top-9 z-50 overflow-hidden rounded-xl bg-yt-elevated py-2 shadow-[0_4px_32px_rgba(0,0,0,0.2)] ring-1 ring-black/5 dark:ring-white/10"
          role="menu">
          
            {items.map((item) =>
          <React.Fragment key={item.label}>
                {item.separated && <hr className="my-2 border-0 border-t border-yt-border" />}
                <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                item.onSelect?.();
                setOpen(false);
              }}
              className="flex h-10 w-full items-center gap-4 px-4 text-left text-[14px] leading-none text-yt-text transition-colors duration-150 hover:bg-yt-hover">
              
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.trailing}
                </button>
              </React.Fragment>
          )}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}