import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import BottomTabBar from '@/components/bottom-tab-bar';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Knoty · 理清人際，避開地雷',
  description: '大學生人際關係圖譜管理工具——用 Android 通知分析自動建圖，幫你理清誰跟誰好。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <body className={`${geist.variable} font-sans antialiased bg-zinc-50 text-zinc-900`}>
        {/* Mobile-first container：max-w-md 模擬手機寬度 */}
        <div className="mx-auto max-w-md min-h-screen flex flex-col">
          {children}
        </div>
        <BottomTabBar />
      </body>
    </html>
  );
}
