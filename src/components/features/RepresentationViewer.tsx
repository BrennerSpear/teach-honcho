"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert"
import { Button } from "~/components/ui/Button"
import { LoadingSpinner } from "~/components/ui/LoadingSpinner"
import type { WorkingRepresentation } from "~/core/honchoClient"
import { useRepresentation } from "~/hooks/useRepresentation"
import { cn } from "~/lib/utils"

interface RepresentationViewerProps {
  apiKey: string
  workspaceId?: string
  environment?: "local" | "production" | "demo"
  className?: string
}

function RepresentationContent({
  representation,
}: {
  representation: WorkingRepresentation
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
    }
  }

  const copyFullRepresentation = async () => {
    const formattedRepresentation = JSON.stringify(representation, null, 2)
    await copyToClipboard(formattedRepresentation, "full")
  }

  const renderValue = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground capitalize">
              {key.replace(/_/g, " ")}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(value.join("\n"), key)}
              className="h-6 px-2 text-xs"
            >
              {copiedKey === key ? "Copied!" : "Copy"}
            </Button>
          </div>
          <ul className="list-inside list-disc space-y-1 pl-4">
            {value.map((item, index) => (
              <li key={index} className="text-muted-foreground text-sm">
                {String(item)}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    if (typeof value === "string") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground capitalize">
              {key.replace(/_/g, " ")}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(value, key)}
              className="h-6 px-2 text-xs"
            >
              {copiedKey === key ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-muted-foreground text-sm">{value}</p>
        </div>
      )
    }

    if (typeof value === "object" && value !== null) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground capitalize">
              {key.replace(/_/g, " ")}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copyToClipboard(JSON.stringify(value, null, 2), key)
              }
              className="h-6 px-2 text-xs"
            >
              {copiedKey === key ? "Copied!" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 capitalize">
            {key.replace(/_/g, " ")}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(String(value), key)}
            className="h-6 px-2 text-xs"
          >
            {copiedKey === key ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">{String(value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-lg">
          Working Representation
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={copyFullRepresentation}
          className="flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copiedKey === "full" ? "Copied!" : "Copy All"}
        </Button>
      </div>

      <div className="divide-y rounded-lg border border-border bg-card">
        {Object.entries(representation).map(([key, value]) => (
          <div key={key} className="p-4">
            {renderValue(key, value)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RepresentationViewer({
  apiKey,
  workspaceId,
  environment,
  className,
}: RepresentationViewerProps) {
  const {
    isLoading,
    error,
    representation,
    lastFetched,
    fetchRepresentation,
    reset,
  } = useRepresentation()

  const handleGetRepresentation = async () => {
    await fetchRepresentation({
      apiKey,
      peerId: "user",
      workspaceId,
      environment,
    })
  }

  const handleRefresh = async () => {
    if (representation) {
      await fetchRepresentation({
        apiKey,
        peerId: "user",
        workspaceId,
        environment,
      })
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!representation && !isLoading && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold text-foreground text-lg">
            Get Working Representation
          </h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground text-sm">
            Get a working representation of you based on your uploaded conversations.
          </p>
          <Button onClick={handleGetRepresentation} disabled={!apiKey}>
            Get Representation
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="py-8 text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="mb-2 font-semibold text-foreground text-lg">
            Fetching Representation...
          </h3>
          <p className="text-muted-foreground text-sm">
            This may take a moment while we process your data
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error Fetching Representation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetRepresentation}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {representation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {lastFetched && (
                <span>Last updated: {lastFetched.toLocaleString()}</span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>
          </div>
          <RepresentationContent representation={representation} />
        </div>
      )}
    </div>
  )
}
