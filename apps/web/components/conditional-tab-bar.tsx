'use client';
import { usePathname } from 'next/navigation';
import BottomTabBar from './bottom-tab-bar';

const HIDE_PATHS = ['/login', '/onboarding'];

export default function ConditionalTabBar() {
  const pathname = usePathname();
  if (HIDE_PATHS.some((p) => pathname.startsWith(p))) return null;
  return <BottomTabBar />;
}
