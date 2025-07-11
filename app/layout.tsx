import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Button } from "@/components/ui/button"
// Removed: import { Shield } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Rabbit Security",
  description: "Real-time screen scanning for fraud detection",
  generator: 'v0.dev',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b p-2 sm:p-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <img src="/Rabbit.jpg" alt="Rabbit Security Logo" className="h-14 w-14 sm:h-20 sm:w-20 rounded-full object-cover" />
              Rabbit Security
            </h1>
            <div className="flex gap-1 sm:gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  พื้นที่เสี่ยงภัย
                </Button>
              </Link>
              <Link href="/screen-scanner">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  สแกนหน้าจอ
                </Button>
              </Link>
              <Link href="/mobile-scanner">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  สแกนมือถือ
                </Button>
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
