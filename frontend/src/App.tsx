"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Plus, Play, Pause, X, AlertCircle } from "lucide-react"
import "./App.css"

interface Stream {
  id: string
  url: string
  status: "connecting" | "connected" | "error" | "paused"
  websocket?: WebSocket
}

const App: React.FC = () => {
  const [streams, setStreams] = useState<Stream[]>([])
  const [newStreamUrl, setNewStreamUrl] = useState("")
  const [isAddingStream, setIsAddingStream] = useState(false)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})

  // Prefer env var, otherwise derive it from the current page (origin + `/ws/stream/`)
  const BACKEND_WS_URL =
    (process.env.REACT_APP_BACKEND_WS_URL &&
      (process.env.REACT_APP_BACKEND_WS_URL.endsWith("/")
        ? process.env.REACT_APP_BACKEND_WS_URL
        : process.env.REACT_APP_BACKEND_WS_URL + "/")) ||
    `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8000/ws/stream/`

  const addStream = () => {
    if (!newStreamUrl.trim()) return

    const streamId = Date.now().toString()
    const newStream: Stream = {
      id: streamId,
      url: newStreamUrl.trim(),
      status: "connecting",
    }

    setStreams((prev) => [...prev, newStream])
    setNewStreamUrl("")
    setIsAddingStream(false)
    connectToStream(newStream)
  }

  const connectToStream = (stream: Stream) => {
    const ws = new WebSocket(`${BACKEND_WS_URL}${stream.id}/`)

    ws.binaryType = "arraybuffer"

    ws.onopen = () => {
      console.log(`WebSocket connected for stream ${stream.id}`)
      ws.send(
        JSON.stringify({
          action: "start_stream",
          rtsp_url: stream.url,
        }),
      )
    }

    ws.onmessage = (event) => {
      let data: any
      try {
        data = JSON.parse(event.data)
      } catch {
        console.warn("Non-JSON message from backend, ignoring")
        return
      }

      if (data.type === "stream_chunk") {
        const videoElement = videoRefs.current[stream.id]
        if (videoElement && data.chunk) {
          const byteCharacters = atob(data.chunk)
          const byteArray = new Uint8Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i)
          }
          const blob = new Blob([byteArray], { type: "video/mp4" })
          videoElement.src = URL.createObjectURL(blob)
        }
      } else if (data.type === "status") {
        setStreams((prev) =>
          prev.map((s) => (s.id === stream.id ? { ...s, status: data.status as Stream["status"] } : s)),
        )
      } else if (data.type === "error") {
        setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, status: "error" } : s)))
      }
    }

    ws.onerror = () => {
      console.error(`WebSocket error for stream ${stream.id}`)
      setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, status: "error" } : s)))
    }

    ws.onclose = () => {
      console.warn(`WebSocket closed for stream ${stream.id}`)
      setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, status: "error" } : s)))
    }

    setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, websocket: ws } : s)))
  }

  const removeStream = (streamId: string) => {
    const stream = streams.find((s) => s.id === streamId)
    if (stream?.websocket) {
      stream.websocket.close()
    }
    setStreams((prev) => prev.filter((s) => s.id !== streamId))
    delete videoRefs.current[streamId]
  }

  const toggleStream = (streamId: string) => {
    const stream = streams.find((s) => s.id === streamId)
    if (!stream) return

    if (stream.status === "paused") {
      stream.websocket?.send(JSON.stringify({ action: "resume_stream" }))
      setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, status: "connected" } : s)))
    } else if (stream.status === "connected") {
      stream.websocket?.send(JSON.stringify({ action: "pause_stream" }))
      setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, status: "paused" } : s)))
    }
  }

  const getGridClass = () => {
    const count = streams.length
    if (count === 1) return "grid-cols-1"
    if (count === 2) return "grid-cols-2"
    if (count <= 4) return "grid-cols-2"
    if (count <= 6) return "grid-cols-3"
    return "grid-cols-4"
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">RTSP Stream Viewer</h1>
            <button
              onClick={() => setIsAddingStream(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stream
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAddingStream && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New RTSP Stream</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={newStreamUrl}
                onChange={(e) => setNewStreamUrl(e.target.value)}
                placeholder="Enter RTSP URL (e.g., rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && addStream()}
              />
              <button
                onClick={addStream}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingStream(false)
                  setNewStreamUrl("")
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {streams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No streams added yet</div>
            <p className="text-gray-400 mb-6">Add an RTSP stream URL to get started</p>
            <button
              onClick={() => setIsAddingStream(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Stream
            </button>
          </div>
        ) : (
          <div className={`grid ${getGridClass()} gap-6`}>
            {streams.map((stream) => (
              <div key={stream.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-video bg-black relative">
                  <video
                    ref={(el) => (videoRefs.current[stream.id] = el)}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    playsInline
                  />

                  {stream.status === "connecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <div>Connecting...</div>
                      </div>
                    </div>
                  )}

                  {stream.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-red-400 text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <div>Connection Error</div>
                      </div>
                    </div>
                  )}

                  {stream.status === "paused" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <Pause className="w-8 h-8 mx-auto mb-2" />
                        <div>Paused</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600 truncate flex-1 mr-4">{stream.url}</div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stream.status === "connected"
                          ? "bg-green-100 text-green-800"
                          : stream.status === "connecting"
                            ? "bg-yellow-100 text-yellow-800"
                            : stream.status === "paused"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {stream.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStream(stream.id)}
                      disabled={stream.status === "connecting" || stream.status === "error"}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stream.status === "paused" ? (
                        <>
                          <Play className="w-4 h-4 mr-1" /> Play
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-1" /> Pause
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => removeStream(stream.id)}
                      className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
