import React from 'react';
import { GuideContent } from './GuideContent';

export function Sidebar() {
  return (
    <aside className="yt-scroll fixed left-0 top-14 z-30 hidden h-[calc(100%-56px)] w-[240px] overflow-y-auto overflow-x-hidden bg-yt-bg lg:block">
      <GuideContent />
    </aside>);

}