import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The thin red bar YouTube runs across the top of the masthead on every
 * navigation. It eases towards 90% while the new view mounts and fetches,
 * then snaps to 100% and fades — it never sits at a fixed width, because a
 * progress bar that doesn't move reads as a broken one.
 */
export function NavigationProgress() {
  const { pathname, search } = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(8);

    const ramp = window.setInterval(() => {
      // Decelerating approach to 90%: fast at first, then crawling.
      setProgress((current) => current >= 90 ? current : current + (90 - current) * 0.18);
    }, 120);

    const finish = window.setTimeout(() => {
      window.clearInterval(ramp);
      setProgress(100);
    }, 520);

    const hide = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 860);

    return () => {
      window.clearInterval(ramp);
      window.clearTimeout(finish);
      window.clearTimeout(hide);
    };
  }, [pathname, search]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease-out' }}>
      
      <div
        className="h-full bg-yt-brand"
        style={{
          width: `${progress}%`,
          transition: 'width 180ms cubic-bezier(0.23, 1, 0.32, 1)'
        }} />
      
    </div>);

}