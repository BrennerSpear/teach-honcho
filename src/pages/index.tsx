import Head from "next/head"
import Link from "next/link"
import { Button } from "~/components/ui/Button"

export default function Home() {
  return (
    <>
      <Head>
        <title>Honcho ChatGPT Uploader</title>
        <meta
          name="description"
          content="Upload your ChatGPT conversations to Honcho for AI memory management"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 font-extrabold text-5xl text-gray-900 tracking-tight sm:text-6xl">
              Honcho
              <span className="text-indigo-600"> ChatGPT</span>
              <br />
              Uploader
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-gray-600 text-xl">
              Transform your ChatGPT conversations into persistent AI memories.
              Upload your ChatGPT exports to Honcho and enable your AI to
              remember and learn from past conversations.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Uploading
                </Button>
              </Link>
              <Link href="/representation">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  View Representations
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                Easy Upload
              </h3>
              <p className="text-gray-600">
                Simply drag and drop your ChatGPT export JSON files. We handle
                the processing and validation automatically.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                Batch Processing
              </h3>
              <p className="text-gray-600">
                Upload multiple conversations at once with progress tracking and
                automatic retry for failed uploads.
              </p>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 text-xl">
                AI Memory
              </h3>
              <p className="text-gray-600">
                Your conversations become part of Honcho's AI memory system,
                enabling persistent context across interactions.
              </p>
            </div>
          </div>

          {/* Getting Started */}
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-bold text-2xl text-gray-900">
              Getting Started
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 text-lg">
                  1. Get Your API Key
                </h3>
                <p className="mb-4 text-gray-600">
                  You'll need a Honcho API key to upload conversations. Contact
                  your Honcho administrator or check your Honcho dashboard for
                  your API key.
                </p>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Keep your API key secure and
                    never share it publicly.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 text-lg">
                  2. Export from ChatGPT
                </h3>
                <p className="mb-4 text-gray-600">
                  In ChatGPT, go to Settings → Data Export → Export data.
                  Download the conversations.json file from your export.
                </p>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Large files (over 50MB) will show a
                    warning but can still be processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
