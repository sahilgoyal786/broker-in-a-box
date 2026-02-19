import Link from 'next/link'
import { FileText, FolderOpen, CheckSquare, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">Broker in a Box</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 rounded-full text-blue-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            Now in early access
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Compliance tracking,
            <span className="text-blue-400"> on autopilot</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Broker in a Box automatically tracks compliance documents for every transaction.
            PDFs arrive in your inbox — we classify, file, and flag what&apos;s missing.
          </p>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            Get started free →
          </Link>

          <p className="mt-4 text-slate-500 text-sm">Sign in with Google · No credit card required</p>
        </div>

        {/* Features */}
        <div className="max-w-2xl w-full mt-24 space-y-4">
          <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider text-center mb-8">
            How it works
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start gap-5">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Auto-file PDFs to Drive</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Agents CC a dedicated email address on DocuSign completions. We detect the document type and file it automatically to the right transaction folder.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start gap-5">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Track compliance per transaction</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every transaction gets a checklist based on property type and deal structure — residential, vacant land, commercial, and more. Always know what&apos;s missing before closing.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-start gap-5">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Calendar deadlines from REPC</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                When a REPC is processed, we extract all the key dates — inspection periods, financing contingencies, closing deadlines — and push them to your Google Calendar automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Sign in with Google
          </Link>
        </div>
      </main>
    </div>
  )
}
