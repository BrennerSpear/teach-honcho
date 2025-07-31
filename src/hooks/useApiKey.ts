"use client"

import { useEffect, useState } from "react"

const API_KEY_STORAGE_KEY = "honcho-api-key"

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
      if (stored) {
        setApiKey(stored)
      }
    } catch (error) {
      console.error("Failed to load API key from localStorage:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const saveApiKey = (key: string) => {
    try {
      localStorage.setItem(API_KEY_STORAGE_KEY, key)
      setApiKey(key)
    } catch (error) {
      console.error("Failed to save API key to localStorage:", error)
      throw new Error("Failed to save API key")
    }
  }

  const clearApiKey = () => {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
      setApiKey(null)
    } catch (error) {
      console.error("Failed to clear API key from localStorage:", error)
    }
  }

  const getObfuscatedKey = () => {
    if (!apiKey) return null
    if (apiKey.length <= 8) return "*".repeat(apiKey.length)
    return apiKey.slice(0, 4) + "*".repeat(apiKey.length - 8) + apiKey.slice(-4)
  }

  return {
    apiKey,
    isLoaded,
    saveApiKey,
    clearApiKey,
    getObfuscatedKey,
    hasApiKey: Boolean(apiKey),
  }
}
