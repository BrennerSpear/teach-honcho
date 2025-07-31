import Head from "next/head"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { Label } from "~/components/ui/Label"
import { LoadingSpinner } from "~/components/ui/LoadingSpinner"
import { useApiKey } from "~/hooks/useApiKey"
import { api } from "~/utils/api"

export default function RepresentationPage() {
  const { apiKey, saveApiKey, getObfuscatedKey, clearApiKey, isLoaded } =
    useApiKey()
  const [tempApiKey, setTempApiKey] = useState("")
  const [isSettingApiKey, setIsSettingApiKey] = useState(false)
  const [peerId, setPeerId] = useState("")
  const [targetPeerId, setTargetPeerId] = useState("")

  // Update isSettingApiKey when apiKey loads from localStorage
  useEffect(() => {
    if (isLoaded) {
      setIsSettingApiKey(!apiKey)
    }
  }, [isLoaded, apiKey])

  const handleSetApiKey = () => {
    if (tempApiKey.trim()) {
      saveApiKey(tempApiKey.trim())
      setTempApiKey("")
      setIsSettingApiKey(false)
    }
  }

  // Query for representation data
  const representationQuery = api.chat.getRepresentation.useQuery(
    {
      peerId,
      targetPeerId: targetPeerId || undefined,
      apiKey: apiKey || "",
    },
    {
      enabled: !!(apiKey && peerId),
      retry: false,
    },
  )

  const handleFetchRepresentation = () => {
    if (peerId.trim()) {
      representationQuery.refetch()
    }
  }

  return (
    <>
      <Head>
        <title>Representations - Honcho ChatGPT Uploader</title>
        <meta
          name="description"
          content="View AI representations from Honcho"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                ← Back to Home
              </Link>
              <h1 className="mt-2 font-bold text-3xl text-gray-900">
                AI Representations
              </h1>
              <p className="mt-1 text-gray-600">
                View working representations from Honcho AI memory
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-8">
            {/* API Key Management */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                API Configuration
              </h2>

              {!apiKey || isSettingApiKey ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">Honcho API Key</Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your Honcho API key"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSetApiKey}
                        disabled={!tempApiKey.trim()}
                      >
                        Set Key
                      </Button>
                    </div>
                    <p className="mt-1 text-gray-500 text-sm">
                      Your API key is stored locally and never sent to our
                      servers except for Honcho API calls.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Current API Key:</p>
                      <p className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                        {getObfuscatedKey()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsSettingApiKey(true)}
                      >
                        Change Key
                      </Button>
                      <Button variant="outline" onClick={clearApiKey}>
                        Clear Key
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Representation Query */}
            {apiKey && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                  Query Representation
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="peerId">Peer ID</Label>
                    <Input
                      id="peerId"
                      placeholder="Enter the peer ID to query"
                      value={peerId}
                      onChange={(e) => setPeerId(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-gray-500 text-sm">
                      The ID of the peer whose representation you want to
                      retrieve.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="targetPeerId">
                      Target Peer ID (Optional)
                    </Label>
                    <Input
                      id="targetPeerId"
                      placeholder="Enter target peer ID (optional)"
                      value={targetPeerId}
                      onChange={(e) => setTargetPeerId(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-gray-500 text-sm">
                      If specified, gets what the peer knows about this target
                      peer.
                    </p>
                  </div>

                  <Button
                    onClick={handleFetchRepresentation}
                    disabled={!peerId.trim() || representationQuery.isFetching}
                  >
                    {representationQuery.isFetching ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Fetching...
                      </>
                    ) : (
                      "Get Representation"
                    )}
                  </Button>
                </div>

                {/* Error Display */}
                {representationQuery.error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Query Error</AlertTitle>
                    <AlertDescription>
                      {representationQuery.error.message}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Results Display */}
                {representationQuery.data && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-semibold text-gray-900 text-lg">
                      Representation Result
                    </h3>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm">
                          Retrieved:{" "}
                          {new Date(
                            representationQuery.data.retrievedAt,
                          ).toLocaleString()}
                        </p>
                        <p className="text-gray-600 text-sm">
                          Peer: <span className="font-mono">{peerId}</span>
                          {targetPeerId && (
                            <>
                              {" → Target: "}
                              <span className="font-mono">{targetPeerId}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {representationQuery.data.representation ? (
                        <div className="space-y-4">
                          {/* Current Thoughts */}
                          {representationQuery.data.representation
                            .current_thoughts && (
                            <div>
                              <h4 className="mb-2 font-medium text-gray-900">
                                Current Thoughts
                              </h4>
                              <p className="rounded border bg-white p-3 text-gray-700">
                                {
                                  representationQuery.data.representation
                                    .current_thoughts
                                }
                              </p>
                            </div>
                          )}

                          {/* Emotional State */}
                          {representationQuery.data.representation
                            .emotional_state && (
                            <div>
                              <h4 className="mb-2 font-medium text-gray-900">
                                Emotional State
                              </h4>
                              <p className="rounded border bg-white p-3 text-gray-700">
                                {
                                  representationQuery.data.representation
                                    .emotional_state
                                }
                              </p>
                            </div>
                          )}

                          {/* Goals */}
                          {representationQuery.data.representation.goals &&
                            representationQuery.data.representation.goals
                              .length > 0 && (
                              <div>
                                <h4 className="mb-2 font-medium text-gray-900">
                                  Goals
                                </h4>
                                <ul className="space-y-1 rounded border bg-white p-3">
                                  {representationQuery.data.representation.goals.map(
                                    (goal, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start text-gray-700"
                                      >
                                        <span className="mr-2 text-indigo-600">
                                          •
                                        </span>
                                        {goal}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Long-term Facts */}
                          {representationQuery.data.representation
                            .long_term_facts &&
                            representationQuery.data.representation
                              .long_term_facts.length > 0 && (
                              <div>
                                <h4 className="mb-2 font-medium text-gray-900">
                                  Long-term Facts
                                </h4>
                                <ul className="space-y-1 rounded border bg-white p-3">
                                  {representationQuery.data.representation.long_term_facts.map(
                                    (fact, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start text-gray-700"
                                      >
                                        <span className="mr-2 text-green-600">
                                          •
                                        </span>
                                        {fact}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                          {/* Other Properties */}
                          {Object.entries(
                            representationQuery.data.representation,
                          )
                            .filter(
                              ([key]) =>
                                ![
                                  "current_thoughts",
                                  "emotional_state",
                                  "goals",
                                  "long_term_facts",
                                ].includes(key),
                            )
                            .map(([key, value]) => (
                              <div key={key}>
                                <h4 className="mb-2 font-medium text-gray-900 capitalize">
                                  {key.replace(/_/g, " ")}
                                </h4>
                                <div className="rounded border bg-white p-3">
                                  <pre className="whitespace-pre-wrap text-gray-700 text-sm">
                                    {typeof value === "string"
                                      ? value
                                      : JSON.stringify(value, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ))}

                          {/* Raw JSON View */}
                          <details className="mt-6">
                            <summary className="mb-2 cursor-pointer font-medium text-gray-900">
                              View Raw JSON
                            </summary>
                            <pre className="overflow-x-auto rounded bg-gray-800 p-4 text-green-400 text-sm">
                              {JSON.stringify(
                                representationQuery.data.representation,
                                null,
                                2,
                              )}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No representation data available.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {!apiKey && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-2 font-semibold text-blue-900 text-lg">
                  About Representations
                </h3>
                <div className="space-y-2 text-blue-800">
                  <p>
                    AI representations in Honcho contain the AI's understanding
                    and memory of interactions. They include current thoughts,
                    emotional states, goals, and long-term facts about peers.
                  </p>
                  <p>
                    Enter your Honcho API key above to start querying
                    representations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
