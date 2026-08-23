import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Demo',
}

export default function BookDemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
