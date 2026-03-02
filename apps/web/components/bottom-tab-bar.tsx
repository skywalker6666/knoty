'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/',       icon: '📋', label: '首頁'    },
  { href: '/risk',   icon: '🔍', label: '風險查詢' },
  { href: '/record', icon: '➕', label: '快速記錄' },
  { href: '/graph',  icon: '🕸️', label: '圖譜'    },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur border-t border-zinc-100">
      <div className="flex pb-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                isActive
                  ? 'text-violet-600'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
