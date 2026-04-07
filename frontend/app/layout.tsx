import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from 'react-hot-toast';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Garage Radiator ERP',
  description: 'ERP system for radiator repair shop and parts warehouse',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={cn("font-sans", geist.variable)}>
      <body className="bg-slate-50 text-slate-900" suppressHydrationWarning>
        <Toaster position="top-right" />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
