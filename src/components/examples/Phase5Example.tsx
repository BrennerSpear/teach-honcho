"use client"

import { useState } from "react"
import { QueueMonitor } from "~/components/features/QueueMonitor"
import { RepresentationViewer } from "~/components/features/RepresentationViewer"
import { Button } from "~/components/ui/Button"
import { useApiKey } from "~/hooks/useApiKey"

/**
 * Example component demonstrating Phase 5 features:
 * - Background queue monitoring
 * - Representation display UI
 *
 * This shows how to integrate both components in a real application
 */
export function Phase5Example() {
  const { apiKey } = useApiKey()
  const [queueMonitoringEnabled, setQueueMonitoringEnabled] = useState(false)
  const [selectedPeerId, setSelectedPeerId] = useState("")
  const [targetPeerId, setTargetPeerId] = useState("")

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="mb-2 font-semibold text-yellow-800">API Key Required</h3>
        <p className="text-sm text-yellow-700">
          Please set your Honcho API key to use Phase 5 features.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 font-bold text-2xl text-gray-900">
          Phase 5: Advanced Features Demo
        </h2>
        <p className="mb-6 text-gray-600">
          This demonstrates the background queue monitoring and representation
          display features.
        </p>
      </div>

      {/* Queue Monitoring Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">
            Background Queue Monitoring (Deriver Status)
          </h3>
          <Button
            variant={queueMonitoringEnabled ? "secondary" : "default"}
            onClick={() => setQueueMonitoringEnabled(!queueMonitoringEnabled)}
          >
            {queueMonitoringEnabled ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
        </div>

        <p className="text-gray-600 text-sm">
          Monitor the status of work units being processed by Honcho's deriver
          system. You can optionally filter by observer, sender, or session ID.
        </p>

        <QueueMonitor
          apiKey={apiKey}
          workspaceId="teach-honcho-testing"
          environment="production"
          enabled={queueMonitoringEnabled}
          // Optional: Add specific filters if needed
          // observerId="specific-observer"
          // senderId="specific-sender"
          // sessionId="specific-session"
          onStatusChange={(isProcessing) => {
            console.log("Queue processing status:", isProcessing)
          }}
        />
      </div>

      {/* Representation Viewer Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg">
          Working Representation Viewer
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Peer ID (required)
            </label>
            <input
              type="text"
              value={selectedPeerId}
              onChange={(e) => setSelectedPeerId(e.target.value)}
              placeholder="Enter peer ID to get representation for"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Target Peer ID (optional)
            </label>
            <input
              type="text"
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
              placeholder="Enter target peer ID (what peer knows about)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {selectedPeerId && (
          <RepresentationViewer
            apiKey={apiKey}
            peerId={selectedPeerId}
            targetPeerId={targetPeerId || undefined}
            workspaceId="teach-honcho-testing"
            environment="production"
          />
        )}
      </div>

      {/* Integration Notes */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">Integration Notes</h4>
        <ul className="list-inside list-disc space-y-1 text-blue-800 text-sm">
          <li>
            Queue monitoring uses Honcho's deriver status API to track work unit
            processing
          </li>
          <li>
            Monitor shows real-time progress with total, completed, in-progress,
            and pending work units
          </li>
          <li>
            Queue monitoring automatically polls every 5 seconds when enabled
          </li>
          <li>
            Representation viewer supports copying individual sections or entire
            representation
          </li>
          <li>
            Both components handle errors gracefully with retry functionality
          </li>
          <li>Components are designed to work independently or together</li>
          <li>
            All API calls use the same workspace and environment configuration
          </li>
        </ul>
      </div>
    </div>
  )
}
