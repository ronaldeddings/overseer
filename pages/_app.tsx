import type { AppProps } from 'next/app'
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/layout/navbar"
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Component {...pageProps} />
      </main>
      <Toaster />
    </>
  )
} 