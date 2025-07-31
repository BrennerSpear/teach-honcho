import Head from "next/head"
import Link from "next/link"
import { useEffect, useState } from "react"
import { FileUploader } from "~/components/features/FileUploader"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { Input } from "~/components/ui/Input"
import { Label } from "~/components/ui/Label"
import type { ProcessedChat } from "~/core/chatProcessor"
import { useApiKey } from "~/hooks/useApiKey"
import { useHonchoConnection } from "~/hooks/useHonchoConnection"
import { useUploadQueue } from "~/hooks/useUploadQueue"

export default function UploadPage() {
  const { apiKey, saveApiKey, getObfuscatedKey, clearApiKey, isLoaded } =
    useApiKey()
  const [tempApiKey, setTempApiKey] = useState("")
  const [isSettingApiKey, setIsSettingApiKey] = useState(false)

  // Connection testing
  const {
    status: connectionStatus,
    testConnection,
    isConnected,
  } = useHonchoConnection({
    apiKey: apiKey || undefined,
    autoTest: false, // Disable auto-test to prevent infinite loops
  })

  // Update isSettingApiKey when apiKey loads from localStorage
  useEffect(() => {
    if (isLoaded) {
      setIsSettingApiKey(!apiKey)
      // Test connection if API key exists
      if (apiKey) {
        setTimeout(() => testConnection(), 100)
      }
    }
  }, [isLoaded, apiKey, testConnection])

  // Upload queue management
  const uploadQueue = useUploadQueue({
    apiKey: apiKey || "",
    onJobComplete: (job) => {
      console.log("Job completed:", job)
    },
    onJobFailed: (job) => {
      console.log("Job failed:", job)
    },
    onQueueComplete: () => {
      console.log("All uploads completed!")
    },
  })

  const handleSetApiKey = () => {
    if (tempApiKey.trim()) {
      saveApiKey(tempApiKey.trim())
      setTempApiKey("")
      setIsSettingApiKey(false)
      // Test connection after setting API key
      setTimeout(() => testConnection(), 100)
    }
  }

  const handleFileProcessed = (result: {
    success: boolean
    data?: ProcessedChat
    error?: string
    warning?: string
  }) => {
    if (result.success && result.data) {
      // Add the processed chat to the upload queue
      uploadQueue.addJob(result.data)
    }

    if (result.error) {
      console.error("File processing error:", result.error)
    }
  }

  const handleStartUploads = () => {
    if (
      uploadQueue.state.jobs.filter((job) => job.status === "pending").length >
      0
    ) {
      uploadQueue.startProcessing()
    }
  }

  return (
    <>
      <Head>
        <title>Upload - Honcho ChatGPT Uploader</title>
        <meta
          name="description"
          content="Upload your ChatGPT conversations to Honcho"
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
                Upload ChatGPT Conversations
              </h1>
              <p className="mt-1 text-gray-600">
                Process and upload your ChatGPT exports to Honcho
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

                  {connectionStatus.error && (
                    <Alert variant="destructive">
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>
                        {connectionStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Current API Key:</p>
                      <p className="rounded bg-gray-100 px-2 py-1 font-mono text-sm break-all">
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

                  {/* Connection Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        connectionStatus.testing
                          ? "bg-yellow-400"
                          : isConnected
                            ? "bg-green-400"
                            : "bg-red-400"
                      }`}
                    />
                    <span className="text-gray-600 text-sm">
                      {connectionStatus.testing
                        ? "Testing connection..."
                        : isConnected
                          ? "Connected to Honcho"
                          : connectionStatus.testedAt
                            ? "Connection failed"
                            : "Not tested"}
                    </span>
                    {!connectionStatus.testing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={testConnection}
                      >
                        {connectionStatus.testedAt ? "Retest" : "Test"}
                      </Button>
                    )}
                  </div>

                  {connectionStatus.error && (
                    <Alert variant="destructive">
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>
                        {connectionStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            {apiKey && isConnected && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                  Upload Files
                </h2>
                <FileUploader onFileProcessed={handleFileProcessed} />
              </div>
            )}

            {/* Upload Queue */}
            {apiKey && uploadQueue.state.jobs.length > 0 && (
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 text-xl">
                    Upload Queue
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartUploads}
                      disabled={
                        uploadQueue.state.isProcessing ||
                        uploadQueue.state.jobs.filter(
                          (job) => job.status === "pending",
                        ).length === 0
                      }
                    >
                      {uploadQueue.state.isProcessing
                        ? "Uploading..."
                        : "Start Uploads"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={uploadQueue.stopProcessing}
                      disabled={!uploadQueue.state.isProcessing}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outline"
                      onClick={uploadQueue.clearCompleted}
                      disabled={uploadQueue.state.completedJobs === 0}
                    >
                      Clear Completed
                    </Button>
                  </div>
                </div>

                {/* Queue Statistics */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="font-bold text-2xl text-gray-900">
                      {uploadQueue.state.totalJobs}
                    </div>
                    <div className="text-gray-600 text-sm">Total Jobs</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <div className="font-bold text-2xl text-blue-600">
                      {
                        uploadQueue.state.jobs.filter(
                          (job) => job.status === "pending",
                        ).length
                      }
                    </div>
                    <div className="text-gray-600 text-sm">Pending</div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <div className="font-bold text-2xl text-green-600">
                      {uploadQueue.state.completedJobs}
                    </div>
                    <div className="text-gray-600 text-sm">Completed</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <div className="font-bold text-2xl text-red-600">
                      {uploadQueue.state.failedJobs}
                    </div>
                    <div className="text-gray-600 text-sm">Failed</div>
                  </div>
                </div>

                {/* Job List */}
                <div className="space-y-2">
                  {uploadQueue.state.jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        job.status === "completed"
                          ? "border-green-200 bg-green-50"
                          : job.status === "failed"
                            ? "border-red-200 bg-red-50"
                            : job.status === "uploading" ||
                                job.status === "retrying"
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            Chat ({job.chat.messageCount} messages)
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 font-medium text-xs ${
                              job.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : job.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : job.status === "uploading"
                                    ? "bg-blue-100 text-blue-800"
                                    : job.status === "retrying"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {job.status}
                          </span>
                          {job.retryCount > 0 && (
                            <span className="text-gray-500 text-xs">
                              (Retry {job.retryCount}/{job.maxRetries})
                            </span>
                          )}
                        </div>
                        {job.error && (
                          <p className="mt-1 text-red-600 text-sm">
                            {job.error}
                          </p>
                        )}
                        {job.uploadedAt && (
                          <p className="mt-1 text-gray-500 text-xs">
                            Completed:{" "}
                            {new Date(job.uploadedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {(job.status === "uploading" ||
                        job.status === "retrying") && (
                        <div className="w-16 text-right">
                          <span className="font-medium text-sm">
                            {job.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Retry Failed Button */}
                {uploadQueue.state.failedJobs > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={uploadQueue.retryFailed}
                      disabled={uploadQueue.state.isProcessing}
                    >
                      Retry Failed Jobs ({uploadQueue.state.failedJobs})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {!apiKey && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="mb-2 font-semibold text-blue-900 text-lg">
                  Getting Started
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-blue-800">
                  <li>Enter your Honcho API key above to get started</li>
                  <li>
                    Export your ChatGPT conversations (Settings → Data Export)
                  </li>
                  <li>Drag and drop the conversations.json file to upload</li>
                  <li>Monitor the upload progress and manage your queue</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
