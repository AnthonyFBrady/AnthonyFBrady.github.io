import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Anthony Brady",
  description: "Personal website of Anthony Brady",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;500;700&display=swap"
        />
      </head>
      <body className={inter.className} style={{ fontFamily: "Product Sans, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}

