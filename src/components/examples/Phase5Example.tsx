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
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">API Key Required</h3>
        <p className="text-yellow-700 text-sm">
          Please set your Honcho API key to use Phase 5 features.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Phase 5: Advanced Features Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demonstrates the background queue monitoring and representation display features.
        </p>
      </div>

      {/* Queue Monitoring Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Background Queue Monitoring (Deriver Status)
          </h3>
          <Button
            variant={queueMonitoringEnabled ? "secondary" : "default"}
            onClick={() => setQueueMonitoringEnabled(!queueMonitoringEnabled)}
          >
            {queueMonitoringEnabled ? "Stop Monitoring" : "Start Monitoring"}
          </Button>
        </div>
        
        <p className="text-sm text-gray-600">
          Monitor the status of work units being processed by Honcho's deriver system. 
          You can optionally filter by observer, sender, or session ID.
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
        <h3 className="text-lg font-semibold text-gray-900">
          Working Representation Viewer
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peer ID (required)
            </label>
            <input
              type="text"
              value={selectedPeerId}
              onChange={(e) => setSelectedPeerId(e.target.value)}
              placeholder="Enter peer ID to get representation for"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Peer ID (optional)
            </label>
            <input
              type="text"
              value={targetPeerId}
              onChange={(e) => setTargetPeerId(e.target.value)}
              placeholder="Enter target peer ID (what peer knows about)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Integration Notes</h4>
        <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
          <li>Queue monitoring uses Honcho's deriver status API to track work unit processing</li>
          <li>Monitor shows real-time progress with total, completed, in-progress, and pending work units</li>
          <li>Queue monitoring automatically polls every 5 seconds when enabled</li>
          <li>Representation viewer supports copying individual sections or entire representation</li>
          <li>Both components handle errors gracefully with retry functionality</li>
          <li>Components are designed to work independently or together</li>
          <li>All API calls use the same workspace and environment configuration</li>
        </ul>
      </div>
    </div>
  )
}