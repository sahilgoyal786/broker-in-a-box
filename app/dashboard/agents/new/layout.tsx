import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Agent',
}

export default function NewAgentLayout({ children }: { children: React.ReactNode }) {
  return children
}
