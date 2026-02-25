'use client'

import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function BookDemoPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 font-semibold text-lg">RE Broker in a Box</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Schedule Your Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how RE Broker in a Box can save you $6,000/year and put compliance tracking on autopilot. 
              Pick a time that works for you.
            </p>
          </div>

          {/* Calendly Widget */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
            <div 
              className="calendly-inline-widget" 
              data-url="https://calendly.com/raubrey/re-broker-in-a-box-demo" 
              style={{minWidth:'320px', height:'700px'}}
            />
          </div>

          {/* Contact Info Below */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-2">
              Prefer to call? Reach Rob Aubrey directly:
            </p>
            <p className="text-lg">
              <a href="tel:8019998209" className="text-blue-600 font-semibold hover:underline">
                801-999-8209
              </a>
              {' · '}
              <a href="mailto:rob@aubrey.net" className="text-blue-600 font-semibold hover:underline">
                rob@aubrey.net
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2026 RE Broker in a Box · Built for independent brokers</p>
          <p className="mt-2">Contact: rob@aubrey.net | 801-999-8209</p>
        </div>
      </footer>

    </div>
  )
}
