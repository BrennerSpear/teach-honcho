import Head from "next/head"
import { useEffect, useState } from "react"
import { FileUploader } from "~/components/features/FileUploader"
import { QueueMonitor } from "~/components/features/QueueMonitor"
import { RepresentationViewer } from "~/components/features/RepresentationViewer"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/Dialog"
import { Input } from "~/components/ui/Input"
import { Label } from "~/components/ui/Label"
import type { ProcessedChat } from "~/core/chatProcessor"
import { useApiKey } from "~/hooks/useApiKey"
import { useHonchoConnection } from "~/hooks/useHonchoConnection"
import { useUploadQueue } from "~/hooks/useUploadQueue"

type TabType = "upload" | "representation"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("upload")
  const { apiKey, saveApiKey, getObfuscatedKey, clearApiKey, isLoaded } =
    useApiKey()
  const [tempApiKey, setTempApiKey] = useState("")
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [queueMonitoringEnabled, setQueueMonitoringEnabled] = useState(false)

  // Connection testing
  const {
    status: connectionStatus,
    testConnection,
    isConnected,
  } = useHonchoConnection({
    apiKey: apiKey || undefined,
    autoTest: false,
  })

  // Test connection when API key loads from localStorage
  useEffect(() => {
    if (isLoaded && apiKey) {
      setTimeout(() => testConnection(), 100)
    }
  }, [isLoaded, apiKey, testConnection])

  // Auto-close dialog when successfully connected
  useEffect(() => {
    if (isApiKeyDialogOpen && isConnected && apiKey) {
      const timer = setTimeout(() => {
        setIsApiKeyDialogOpen(false)
        setTempApiKey("")
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isApiKeyDialogOpen, isConnected, apiKey])

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
      // Enable queue monitoring after uploads complete
      setQueueMonitoringEnabled(true)
    },
  })

  const handleSetApiKey = () => {
    if (tempApiKey.trim()) {
      saveApiKey(tempApiKey.trim())
      // Test connection after setting API key
      setTimeout(() => testConnection(), 100)
    }
  }

  const handleOpenApiKeyDialog = () => {
    setTempApiKey(apiKey || "")
    setIsApiKeyDialogOpen(true)
  }

  const handleCloseApiKeyDialog = () => {
    setIsApiKeyDialogOpen(false)
    setTempApiKey("")
  }

  const handleFileProcessed = (result: {
    success: boolean
    data?: ProcessedChat
    error?: string
    warning?: string
  }) => {
    if (result.success && result.data) {
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
        <title>Honcho ChatGPT Uploader</title>
        <meta
          name="description"
          content="Upload your ChatGPT conversations to Honcho for AI memory management"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 font-extrabold text-4xl text-gray-900 tracking-tight sm:text-5xl">
              Honcho
              <span className="text-indigo-600"> ChatGPT</span>
              <br />
              Uploader
            </h1>
            <p className="mx-auto max-w-2xl text-gray-600 text-lg">
              Transform your ChatGPT conversations into persistent AI memories.
              Upload your exports to Honcho and explore AI representations.
            </p>
          </div>

          <div className="mx-auto max-w-5xl space-y-6">
            {/* Getting Started - Now at the top */}
            <div className={`rounded-lg bg-white p-8 shadow-sm ${isConnected ? 'border-2 border-green-200' : 'border'}`}>
              {isConnected && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="font-medium text-green-800 text-sm">
                    Connected to Honcho
                  </span>
                </div>
              )}
              
              <h2 className="mb-6 font-bold text-2xl text-gray-900">
                Getting Started
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900 text-lg">
                    1. Get Your Honcho API Key
                  </h3>
                  <p className="mb-4 text-gray-600">
                    You'll need a Honcho API key to upload conversations. Contact
                    your Honcho administrator or check your Honcho dashboard for
                    your API key.
                  </p>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Keep your API key secure and
                      never share it publicly.
                    </p>
                  </div>
                  <Button 
                    onClick={handleOpenApiKeyDialog}
                    className="w-full sm:w-auto"
                  >
                    {apiKey ? "Change API Key" : "Add My API Key"}
                  </Button>
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

            {/* Main Content */}
            {apiKey && isConnected && (
              <>
                {/* Tab Navigation */}
                <div className="flex rounded-lg bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "upload"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Upload Conversations
                  </button>
                  <button
                    onClick={() => setActiveTab("representation")}
                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "representation"
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    View Representations
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "upload" ? (
                  <>
                    {/* File Upload Section */}
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
                      <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                        Upload Files
                      </h2>
                      <FileUploader onFileProcessed={handleFileProcessed} />
                    </div>

                    {/* Upload Queue */}
                    {uploadQueue.state.jobs.length > 0 && (
                      <div className="rounded-lg border bg-white p-6 shadow-sm">
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
                            <div className="text-gray-600 text-sm">
                              Total Jobs
                            </div>
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
                            <div className="text-gray-600 text-sm">
                              Completed
                            </div>
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

                    {/* Queue Monitoring */}
                    {uploadQueue.state.completedJobs > 0 && (
                      <div className="rounded-lg border bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="font-semibold text-gray-900 text-xl">
                            Background Processing Status
                          </h2>
                          <Button
                            variant={queueMonitoringEnabled ? "secondary" : "default"}
                            onClick={() => setQueueMonitoringEnabled(!queueMonitoringEnabled)}
                            size="sm"
                          >
                            {queueMonitoringEnabled ? "Stop Monitoring" : "Start Monitoring"}
                          </Button>
                        </div>
                        <QueueMonitor
                          apiKey={apiKey}
                          workspaceId="teach-honcho-testing"
                          environment="production"
                          enabled={queueMonitoringEnabled}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Representation Tab */
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 font-semibold text-gray-900 text-xl">
                      AI Representations
                    </h2>
                    <p className="mb-6 text-gray-600">
                      Query and view AI representations from Honcho. Enter a peer ID to see what the AI remembers.
                    </p>
                    <RepresentationViewer
                      apiKey={apiKey}
                      peerId=""
                      workspaceId="teach-honcho-testing"
                      environment="production"
                    />
                  </div>
                )}
              </>
            )}

            {/* API Key Dialog */}
            <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Honcho API Configuration</DialogTitle>
                  <DialogDescription>
                    Enter your Honcho API key to connect and start uploading conversations.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="modal-apiKey">Honcho API Key</Label>
                    <Input
                      id="modal-apiKey"
                      type="password"
                      placeholder="Enter your Honcho API key"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      className="mt-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tempApiKey.trim()) {
                          handleSetApiKey()
                        }
                      }}
                    />
                    <p className="mt-1 text-gray-500 text-sm">
                      Your API key is stored locally and never sent to our servers except for Honcho API calls.
                    </p>
                  </div>

                  {/* Connection Status in Modal */}
                  {apiKey && (
                    <div className="flex items-center gap-2 rounded-lg border p-3">
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
                          className="ml-auto"
                        >
                          {connectionStatus.testedAt ? "Retest" : "Test"}
                        </Button>
                      )}
                    </div>
                  )}

                  {connectionStatus.error && (
                    <Alert variant="destructive">
                      <AlertTitle>Connection Error</AlertTitle>
                      <AlertDescription>
                        {connectionStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={handleCloseApiKeyDialog}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSetApiKey}
                      disabled={!tempApiKey.trim()}
                    >
                      Set API Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </>
  )
}