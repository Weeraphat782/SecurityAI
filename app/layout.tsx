import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Security Scanner",
  description: "Real-time screen scanning for fraud detection",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm border-b p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">AI Security Scanner</h1>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  หน้าหลัก
                </Button>
              </Link>
              <Link href="/screen-scanner">
                <Button variant="ghost" size="sm">
                  สแกนหน้าจอ
                </Button>
              </Link>
              <Link href="/mobile-scanner">
                <Button variant="ghost" size="sm">
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
