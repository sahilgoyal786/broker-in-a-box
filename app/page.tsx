import Link from 'next/link'
import { FileText, Shield, CheckSquare, Calendar } from 'lucide-react'

export default function HomePage() {
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
            href="mailto:rob@aubrey.net?subject=RE Broker in a Box Demo Request"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Request Demo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <div className="py-20 text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Compliance Tracking
              <br />
              <span className="text-blue-600">on Autopilot</span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              RE Broker in a Box automatically tracks compliance documents for every transaction. 
              PDFs arrive in your inbox—we classify, file, and flag what&apos;s missing.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border border-green-200 rounded-xl mb-12">
              <span className="text-2xl font-bold text-green-700">$150/month</span>
              <span className="text-gray-400">vs</span>
              <span className="text-lg text-gray-500 line-through">$500-650/month</span>
              <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full">Save $6,000/year</span>
            </div>

            <Link
              href="mailto:rob@aubrey.net?subject=RE Broker in a Box Demo Request"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-blue-600/20"
            >
              Schedule a Demo →
            </Link>

            <p className="mt-6 text-gray-500">15-minute walkthrough · rob@aubrey.net · 801-999-8209</p>
          </div>

          {/* How It Works Section */}
          <div className="py-20">
            <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider text-center mb-16">
              How it works
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Box 1: Data Ownership */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Do You Know Where Your Data Is?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  You will with RE Broker in a Box.
                  <br /><br />
                  Your transaction files live where YOU control them—not buried on corporate servers you can&apos;t see or access. You know exactly where every document is, who has access to it, and what&apos;s happening with your data.
                  <br /><br />
                  Complete transparency. Complete control. No black boxes.
                </p>
              </div>

              {/* Box 2: Agent Sends */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-green-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Agent Sends, We Handle the Rest
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Agent emails a listing agreement or purchase contract? We automatically detect the document type, extract the key details, file it to the right folder, and populate the compliance checklist.
                  <br /><br />
                  No manual data entry. No copying and pasting. Just forward the email—we do the rest.
                </p>
              </div>

              {/* Box 3: Track Compliance */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <CheckSquare className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Track Compliance Per Transaction
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every transaction gets its own compliance checklist based on property type (residential, land, commercial, etc.).
                  <br /><br />
                  We track what&apos;s missing automatically—you don&apos;t even have to look. If required documents haven&apos;t arrived, we notify the agent. You focus on running your brokerage, not chasing paperwork.
                </p>
              </div>

              {/* Box 4: Calendar Deadlines */}
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Calendar Deadlines from Purchase Contract
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Critical deadlines—due diligence, financing contingency, settlement date—are automatically extracted from the purchase contract and added to your calendar.
                  <br /><br />
                  You and your agents get reminders before deadlines hit. Never miss a critical date again.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-20 text-center bg-gray-50 -mx-6 px-6">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Put Compliance on Autopilot?
            </h2>
            <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
              See how RE Broker in a Box can save you $6,000/year and hours of paperwork.
            </p>
            <p className="text-lg text-gray-500 mb-10">
              Call Rob Aubrey: <a href="tel:8019998209" className="text-blue-600 font-semibold hover:underline">801-999-8209</a>
            </p>
            <Link
              href="mailto:rob@aubrey.net?subject=RE Broker in a Box Demo Request"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-blue-600/20"
            >
              Schedule a Demo →
            </Link>
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
