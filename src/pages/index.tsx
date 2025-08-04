import Head from "next/head"
import { useEffect, useState } from "react"
import { FileUploader } from "~/components/features/FileUploader"
import { QueueMonitor } from "~/components/features/QueueMonitor"
import { RepresentationViewer } from "~/components/features/RepresentationViewer"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/Dialog"
import { Input } from "~/components/ui/Input"
import { Label } from "~/components/ui/Label"
import { ThemeToggle } from "~/components/ui/ThemeToggle"
import type { ProcessedChat } from "~/core/chatProcessor"
import { useApiKey } from "~/hooks/useApiKey"
import { useHonchoConnection } from "~/hooks/useHonchoConnection"
import { useUploadQueue } from "~/hooks/useUploadQueue"

type TabType = "upload" | "representation"

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("upload")
  const { apiKey, saveApiKey, isLoaded } = useApiKey()
  const [tempApiKey, setTempApiKey] = useState("")
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false)
  const [queueMonitoringEnabled, setQueueMonitoringEnabled] = useState(false)
  const [userDisabledMonitoring, setUserDisabledMonitoring] = useState(false)

  // Connection testing
  const {
    status: connectionStatus,
    testConnection,
    isConnected,
  } = useHonchoConnection({
    apiKey: apiKey || undefined,
    autoTest: false,
  })

  // Test connection when API key loads from localStorage (but not when it changes)
  useEffect(() => {
    if (isLoaded && apiKey) {
      testConnection()
    }
  }, [isLoaded, testConnection])

  // Auto-enable queue monitoring when connected (but not if user manually disabled it)
  useEffect(() => {
    if (isConnected && !queueMonitoringEnabled && !userDisabledMonitoring) {
      setQueueMonitoringEnabled(true)
    }
  }, [isConnected, queueMonitoringEnabled, userDisabledMonitoring])

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

  const handleSetApiKey = async () => {
    if (tempApiKey.trim()) {
      const newKey = tempApiKey.trim()
      saveApiKey(newKey)
      // Test connection immediately with the new key value
      await testConnection(newKey)
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

  const handleToggleQueueMonitoring = () => {
    const newState = !queueMonitoringEnabled
    setQueueMonitoringEnabled(newState)

    // Track if user manually disabled monitoring
    if (!newState) {
      setUserDisabledMonitoring(true)
    } else {
      setUserDisabledMonitoring(false)
    }
  }

  const handleFileProcessed = (result: {
    success: boolean
    data?: ProcessedChat | ProcessedChat[]
    error?: string
    warning?: string
  }) => {
    if (result.success && result.data) {
      // Handle both single chat and array of chats
      if (Array.isArray(result.data)) {
        // Add each conversation as a separate job
        console.log(
          "[Index Page] Processing multiple chats:",
          result.data.length,
        )
        for (const chat of result.data) {
          console.log("[Index Page] Adding chat to queue:", {
            title: chat.title,
            create_time: chat.create_time,
            messageCount: chat.messages?.length,
          })
          uploadQueue.addJob(chat)
        }
      } else {
        // Single conversation
        console.log("[Index Page] Processing single chat:", {
          title: result.data.title,
          create_time: result.data.create_time,
          messageCount: result.data.messages?.length,
        })
        uploadQueue.addJob(result.data)
      }
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
        <title>Teach Honcho</title>
        <meta
          name="description"
          content="Upload your ChatGPT conversations to Honcho for AI memory management"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Theme Toggle */}
          <div className="mb-8">
            <div className="mb-4 flex justify-end">
              <ThemeToggle />
            </div>
            <div className="text-center">
              <h1 className="mb-4 font-extrabold text-4xl text-foreground tracking-tight sm:text-5xl">
                Teach Honcho
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Give your ChatGPT conversations to Honcho to explore a derived
                representations of you.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl space-y-6">
            {/* Getting Started - Now at the top */}
            <div
              className={`rounded-lg border bg-card p-8 shadow-sm ${isConnected ? "border-2 border-primary" : "border-border"}`}
            >
              <h2 className="mb-6 font-bold text-2xl text-foreground">
                Getting Started
              </h2>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold text-foreground text-lg">
                    1. Get Your Honcho API Key
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    You'll need a Honcho API key to upload conversations. Get
                    your API key from{" "}
                    <a
                      href="https://app.honcho.dev/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      app.honcho.dev/api-keys
                    </a>
                    .
                  </p>

                  <Button
                    onClick={handleOpenApiKeyDialog}
                    className="w-full sm:w-auto"
                  >
                    {apiKey ? "Change API Key" : "Add My API Key"}
                  </Button>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold text-foreground text-lg">
                    2. Export from ChatGPT
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    In ChatGPT, go to Settings → Data Controls → Export data. It
                    will be emailed to you. unzip the file, and upload the{" "}
                    <span className="font-mono">conversations.json</span> file
                  </p>
                </div>
              </div>
            </div>
            {isConnected && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 p-3">
                <div className="h-2 w-2 rounded-full bg-green-400" />
                <span className="font-medium text-green-800 text-sm">
                  Connected to Honcho
                </span>
              </div>
            )}
            {/* Main Content */}
            {apiKey && isConnected && (
              <>
                {/* Tab Navigation */}
                <div className="flex rounded-lg bg-card p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "upload"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground"
                    }`}
                  >
                    Upload Conversations
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("representation")}
                    className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "representation"
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    View Representations
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "upload" ? (
                  <>
                    {/* File Upload Section */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                      <h2 className="mb-4 font-semibold text-foreground text-xl">
                        Upload Files
                      </h2>
                      <FileUploader onFileProcessed={handleFileProcessed} />
                    </div>

                    {/* Upload Queue */}
                    {uploadQueue.state.jobs.length > 0 && (
                      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="font-semibold text-foreground text-xl">
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
                          <div className="rounded-lg bg-muted p-3 text-center">
                            <div className="font-bold text-2xl text-foreground">
                              {uploadQueue.state.totalJobs}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              Total Jobs
                            </div>
                          </div>
                          <div className="rounded-lg bg-secondary p-3 text-center">
                            <div className="font-bold text-2xl text-secondary-foreground">
                              {
                                uploadQueue.state.jobs.filter(
                                  (job) => job.status === "pending",
                                ).length
                              }
                            </div>
                            <div className="text-secondary-foreground text-sm">
                              Pending
                            </div>
                          </div>
                          <div className="rounded-lg bg-success p-3 text-center">
                            <div className="font-bold text-2xl text-primary-foreground">
                              {uploadQueue.state.completedJobs}
                            </div>
                            <div className="text-primary-foreground text-sm">
                              Completed
                            </div>
                          </div>
                          <div className="rounded-lg bg-destructive p-3 text-center">
                            <div className="font-bold text-2xl text-destructive-foreground">
                              {uploadQueue.state.failedJobs}
                            </div>
                            <div className="text-destructive-foreground text-sm">
                              Failed
                            </div>
                          </div>
                        </div>

                        {/* Job List */}
                        <div className="space-y-2">
                          {uploadQueue.state.jobs.map((job) => (
                            <div
                              key={job.id}
                              className={`flex items-center justify-between rounded-lg border p-3 ${
                                job.status === "completed"
                                  ? "border-primary bg-primary/10"
                                  : job.status === "failed"
                                    ? "border-destructive bg-destructive/10"
                                    : job.status === "uploading" ||
                                        job.status === "retrying"
                                      ? "border-primary bg-primary/10"
                                      : "border-secondary bg-secondary/10"
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
                                        ? "bg-primary text-primary-foreground"
                                        : job.status === "failed"
                                          ? "bg-destructive text-destructive-foreground"
                                          : job.status === "uploading"
                                            ? "bg-primary text-primary-foreground"
                                            : job.status === "retrying"
                                              ? "bg-secondary text-secondary-foreground"
                                              : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {job.status}
                                  </span>
                                  {job.retryCount > 0 && (
                                    <span className="text-muted-foreground text-xs">
                                      (Retry {job.retryCount}/{job.maxRetries})
                                    </span>
                                  )}
                                </div>
                                {job.error && (
                                  <p className="mt-1 text-destructive text-sm">
                                    {job.error}
                                  </p>
                                )}
                                {job.uploadedAt && (
                                  <p className="mt-1 text-muted-foreground text-xs">
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

                    {/* Queue Monitoring - Always show when connected */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="font-semibold text-foreground text-xl">
                            Background Processing Status
                          </h2>
                          <p className="mr-4 text-muted-foreground text-sm">
                            Now that your conversations have been uploaded,
                            Honcho will process your conversations in the
                            background. Honcho's representation of you will be
                            complete when this process is complete
                          </p>
                        </div>
                        <Button
                          variant={
                            queueMonitoringEnabled ? "secondary" : "default"
                          }
                          onClick={handleToggleQueueMonitoring}
                          size="sm"
                        >
                          {queueMonitoringEnabled
                            ? "Stop Monitoring"
                            : "Start Monitoring"}
                        </Button>
                      </div>
                      <QueueMonitor
                        apiKey={apiKey}
                        workspaceId="teach-honcho"
                        environment="production"
                        enabled={queueMonitoringEnabled}
                      />
                    </div>
                  </>
                ) : (
                  /* Representation Tab */
                  <>
                    {/* Background Processing Status */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="font-semibold text-foreground text-xl">
                            Background Processing Status
                          </h2>
                          <p className="mr-4 text-muted-foreground text-sm">
                            Now that your conversations have been uploaded,
                            Honcho will process your conversations in the
                            background. Honcho's representation of you will be
                            complete when this process is complete
                          </p>
                        </div>
                        <Button
                          variant={
                            queueMonitoringEnabled ? "secondary" : "default"
                          }
                          onClick={handleToggleQueueMonitoring}
                          size="sm"
                        >
                          {queueMonitoringEnabled
                            ? "Stop Monitoring"
                            : "Start Monitoring"}
                        </Button>
                      </div>
                      <QueueMonitor
                        apiKey={apiKey}
                        workspaceId="teach-honcho"
                        environment="production"
                        enabled={queueMonitoringEnabled}
                      />
                    </div>

                    {/* AI Representations */}
                    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                      <h2 className="mb-4 font-semibold text-foreground text-xl text-center">
                        Honcho's Representation of You
                      </h2>
                      <p className="mb-6 text-muted-foreground text-center">
                        Honcho's representation of you is a derived
                        representation of you based on your uploaded
                        conversations.
                      </p>
                      <RepresentationViewer
                        apiKey={apiKey}
                        workspaceId="teach-honcho"
                        environment="production"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* API Key Dialog */}
            <Dialog
              open={isApiKeyDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseApiKeyDialog()
                } else {
                  setIsApiKeyDialogOpen(true)
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Honcho API Configuration</DialogTitle>
                  <DialogDescription>
                    Enter your Honcho API key to connect and start uploading
                    conversations.
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
                    <p className="mt-1 text-muted-foreground text-sm">
                      Your API key is stored locally and never sent to our
                      servers except for Honcho API calls.
                    </p>
                  </div>

                  {/* Connection Status in Modal */}
                  {apiKey && (
                    <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          connectionStatus.testing
                            ? "bg-yellow-400"
                            : isConnected
                              ? "bg-green-400"
                              : "bg-red-400"
                        }`}
                      />
                      <span className="text-muted-foreground text-sm">
                        {connectionStatus.testing
                          ? "Testing connection..."
                          : isConnected
                            ? "Connected to Honcho"
                            : connectionStatus.testedAt
                              ? "Connection failed"
                              : "Not tested"}
                      </span>
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
