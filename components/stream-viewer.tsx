"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Plus,
  Play,
  Pause,
  AlertCircle,
  LayoutGrid,
  Maximize2,
  Volume2,
  VolumeX,
  Star,
  StarOff,
  Search,
  Monitor,
  Wifi,
  Expand,
  Moon,
  Sun,
  Activity,
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Share2,
  Camera,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Stream {
  id: string
  url: string
  name: string
  status: "connecting" | "connected" | "error" | "paused" | "recording"
  websocket?: WebSocket
  category: string
  isFavorite: boolean
  quality: "auto" | "high" | "medium" | "low"
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  bandwidth: number
  fps: number
  resolution: string
  uptime: number
  lastError?: string
  thumbnail?: string
  isRecording: boolean
  recordingDuration: number
}

interface StreamStats {
  totalStreams: number
  activeStreams: number
  totalBandwidth: number
  averageFps: number
  uptime: number
}

export function StreamViewer() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [newStreamUrl, setNewStreamUrl] = useState("")
  const [newStreamName, setNewStreamName] = useState("")
  const [newStreamCategory, setNewStreamCategory] = useState("default")
  const [isAddingStream, setIsAddingStream] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "theater" | "pip">("grid")
  const [gridSize, setGridSize] = useState(2)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [autoReconnect, setAutoReconnect] = useState(true)
  const [selectedStream, setSelectedStream] = useState<string | null>(null)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  const reconnectTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const { toast } = useToast()

  const BACKEND_WS_URL =
    process.env.REACT_APP_BACKEND_WS_URL ||
    `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8000/ws/stream/`

  // Calculate stats
  const stats: StreamStats = {
    totalStreams: streams.length,
    activeStreams: streams.filter((s) => s.status === "connected").length,
    totalBandwidth: streams.reduce((sum, s) => sum + s.bandwidth, 0),
    averageFps: streams.length > 0 ? streams.reduce((sum, s) => sum + s.fps, 0) / streams.length : 0,
    uptime: streams.length > 0 ? streams.reduce((sum, s) => sum + s.uptime, 0) / streams.length : 0,
  }

  // Categories
  const categories = ["all", ...new Set(streams.map((s) => s.category))]

  // Filtered streams
  const filteredStreams = streams.filter((stream) => {
    const matchesSearch =
      stream.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || stream.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addStream = useCallback(() => {
    if (!newStreamUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid RTSP stream URL",
        variant: "destructive",
      })
      return
    }

    const streamId = Date.now().toString()
    const newStream: Stream = {
      id: streamId,
      url: newStreamUrl.trim(),
      name: newStreamName.trim() || `Stream ${streams.length + 1}`,
      status: "connecting",
      category: newStreamCategory,
      isFavorite: false,
      quality: "auto",
      volume: 100,
      isMuted: false,
      isFullscreen: false,
      bandwidth: 0,
      fps: 0,
      resolution: "Unknown",
      uptime: 0,
      isRecording: false,
      recordingDuration: 0,
    }

    setStreams((prev) => [...prev, newStream])
    setNewStreamUrl("")
    setNewStreamName("")
    setIsAddingStream(false)
    connectToStream(newStream)

    toast({
      title: "Stream Added",
      description: `${newStream.name} is connecting...`,
    })
  }, [newStreamUrl, newStreamName, newStreamCategory, streams.length, toast])

  const connectToStream = useCallback(
    (stream: Stream, isReconnect = false) => {
      const ws = new WebSocket(`${BACKEND_WS_URL}${stream.id}/`)
      ws.binaryType = "arraybuffer"

      ws.onopen = () => {
        console.log(`WebSocket connected for stream ${stream.id}`)
        ws.send(
          JSON.stringify({
            action: "start_stream",
            rtsp_url: stream.url,
            quality: stream.quality,
          }),
        )

        if (isReconnect) {
          toast({
            title: "Reconnected",
            description: `${stream.name} reconnected successfully`,
          })
        }
      }

      ws.onmessage = (event) => {
        let data: any
        try {
          data = JSON.parse(event.data)
        } catch {
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
          setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, status: data.status } : s)))
        } else if (data.type === "stats") {
          setStreams((prev) =>
            prev.map((s) =>
              s.id === stream.id
                ? {
                    ...s,
                    bandwidth: data.bandwidth || 0,
                    fps: data.fps || 0,
                    resolution: data.resolution || "Unknown",
                    uptime: s.uptime + 1,
                  }
                : s,
            ),
          )
        } else if (data.type === "error") {
          setStreams((prev) =>
            prev.map((s) => (s.id === stream.id ? { ...s, status: "error", lastError: data.message } : s)),
          )

          if (autoReconnect && !isReconnect) {
            scheduleReconnect(stream)
          }
        }
      }

      ws.onerror = () => {
        setStreams((prev) =>
          prev.map((s) => (s.id === stream.id ? { ...s, status: "error", lastError: "Connection failed" } : s)),
        )

        if (autoReconnect) {
          scheduleReconnect(stream)
        }
      }

      ws.onclose = () => {
        setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, status: "error" } : s)))
      }

      setStreams((prev) => prev.map((s) => (s.id === stream.id ? { ...s, websocket: ws } : s)))
    },
    [BACKEND_WS_URL, autoReconnect, toast],
  )

  const scheduleReconnect = useCallback(
    (stream: Stream) => {
      if (reconnectTimeouts.current[stream.id]) {
        clearTimeout(reconnectTimeouts.current[stream.id])
      }

      reconnectTimeouts.current[stream.id] = setTimeout(() => {
        console.log(`Attempting to reconnect stream ${stream.id}`)
        connectToStream(stream, true)
      }, 5000)
    },
    [connectToStream],
  )

  const removeStream = useCallback(
    (streamId: string) => {
      const stream = streams.find((s) => s.id === streamId)
      if (stream?.websocket) {
        stream.websocket.close()
      }
      if (reconnectTimeouts.current[streamId]) {
        clearTimeout(reconnectTimeouts.current[streamId])
        delete reconnectTimeouts.current[streamId]
      }
      setStreams((prev) => prev.filter((s) => s.id !== streamId))
      delete videoRefs.current[streamId]

      toast({
        title: "Stream Removed",
        description: `${stream?.name || "Stream"} has been removed`,
      })
    },
    [streams, toast],
  )

  const toggleStream = useCallback(
    (streamId: string) => {
      const stream = streams.find((s) => s.id === streamId)
      if (!stream) return

      if (stream.status === "paused") {
        stream.websocket?.send(JSON.stringify({ action: "resume_stream" }))
        setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, status: "connected" } : s)))
      } else if (stream.status === "connected") {
        stream.websocket?.send(JSON.stringify({ action: "pause_stream" }))
        setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, status: "paused" } : s)))
      }
    },
    [streams],
  )

  const toggleFavorite = useCallback((streamId: string) => {
    setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isFavorite: !s.isFavorite } : s)))
  }, [])

  const toggleRecording = useCallback(
    (streamId: string) => {
      const stream = streams.find((s) => s.id === streamId)
      if (!stream) return

      const action = stream.isRecording ? "stop_recording" : "start_recording"
      stream.websocket?.send(JSON.stringify({ action }))

      setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isRecording: !s.isRecording } : s)))

      toast({
        title: stream.isRecording ? "Recording Stopped" : "Recording Started",
        description: `${stream.name} recording ${stream.isRecording ? "stopped" : "started"}`,
      })
    },
    [streams, toast],
  )

  const updateStreamVolume = useCallback((streamId: string, volume: number) => {
    setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, volume } : s)))

    const videoElement = videoRefs.current[streamId]
    if (videoElement) {
      videoElement.volume = volume / 100
    }
  }, [])

  const toggleMute = useCallback((streamId: string) => {
    setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isMuted: !s.isMuted } : s)))

    const videoElement = videoRefs.current[streamId]
    if (videoElement) {
      videoElement.muted = !videoElement.muted
    }
  }, [])

  const enterFullscreen = useCallback((streamId: string) => {
    const videoElement = videoRefs.current[streamId]
    if (videoElement) {
      videoElement.requestFullscreen()
      setStreams((prev) => prev.map((s) => (s.id === streamId ? { ...s, isFullscreen: true } : s)))
    }
  }, [])

  const getGridClass = () => {
    if (viewMode === "theater") return "grid-cols-1"
    if (viewMode === "pip") return "grid-cols-4"

    const count = filteredStreams.length
    if (count === 1) return "grid-cols-1"
    if (gridSize === 1) return "grid-cols-1"
    if (gridSize === 2) return "grid-cols-2"
    if (gridSize === 3) return "grid-cols-3"
    return "grid-cols-4"
  }

  const getStatusColor = (status: Stream["status"]) => {
    switch (status) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      case "paused":
        return "bg-gray-500"
      case "recording":
        return "bg-red-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatBandwidth = (bandwidth: number) => {
    if (bandwidth < 1024) return `${bandwidth} KB/s`
    return `${(bandwidth / 1024).toFixed(1)} MB/s`
  }

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "n":
            e.preventDefault()
            setIsAddingStream(true)
            break
          case "f":
            e.preventDefault()
            setSelectedCategory(selectedCategory === "all" ? "favorites" : "all")
            break
          case "d":
            e.preventDefault()
            setIsDarkMode(!isDarkMode)
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isDarkMode, selectedCategory])

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RTSP Stream Viewer Pro</h1>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                v2.0
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button variant="ghost" size="sm" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* Stats Toggle */}
              <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)} className="hidden md:flex">
                <Activity className="w-4 h-4 mr-2" />
                Stats
              </Button>

              {/* Add Stream Button */}
              <Button onClick={() => setIsAddingStream(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Stream
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {showStats && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStreams}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Streams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeStreams}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatBandwidth(stats.totalBandwidth)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Bandwidth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.averageFps.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg FPS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatUptime(stats.uptime)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search streams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "theater" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("theater")}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Grid Size */}
            {viewMode === "grid" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Grid:</span>
                <Slider
                  value={[gridSize]}
                  onValueChange={(value) => setGridSize(value[0])}
                  max={4}
                  min={1}
                  step={1}
                  className="w-20"
                />
              </div>
            )}

            {/* Auto Reconnect */}
            <div className="flex items-center gap-2">
              <Switch checked={autoReconnect} onCheckedChange={setAutoReconnect} />
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto Reconnect</span>
            </div>
          </div>
        </div>

        {/* Add Stream Dialog */}
        <Dialog open={isAddingStream} onOpenChange={setIsAddingStream}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New RTSP Stream</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Stream Name</label>
                <Input
                  placeholder="Enter stream name"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">RTSP URL</label>
                <Textarea
                  placeholder="rtsp://admin:admin123@49.248.155.178:555/cam/realmonitor?channel=1&subtype=0"
                  value={newStreamUrl}
                  onChange={(e) => setNewStreamUrl(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="default"
                  value={newStreamCategory}
                  onChange={(e) => setNewStreamCategory(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addStream} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stream
                </Button>
                <Button variant="outline" onClick={() => setIsAddingStream(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Streams Grid */}
        {filteredStreams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No streams found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {streams.length === 0
                  ? "Add your first RTSP stream to get started"
                  : "No streams match your current filters"}
              </p>
              <Button onClick={() => setIsAddingStream(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Stream
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid ${getGridClass()} gap-6`}>
            {filteredStreams.map((stream) => (
              <Card key={stream.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-black relative">
                  <video
                    ref={(el) => (videoRefs.current[stream.id] = el)}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted={stream.isMuted}
                    playsInline
                    onVolumeChange={(e) => {
                      const video = e.target as HTMLVideoElement
                      updateStreamVolume(stream.id, video.volume * 100)
                    }}
                  />

                  {/* Status Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(stream.status)} animate-pulse`} />
                    <Badge variant="secondary" className="text-xs">
                      {stream.status}
                    </Badge>
                    {stream.isRecording && (
                      <Badge variant="destructive" className="text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        REC
                      </Badge>
                    )}
                  </div>

                  {/* Stream Info Overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded space-y-1">
                      <div>{stream.resolution}</div>
                      <div>{stream.fps} FPS</div>
                      <div>{formatBandwidth(stream.bandwidth)}</div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {stream.status === "connecting" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <div>Connecting...</div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {stream.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-red-400 text-center">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <div>Connection Error</div>
                        {stream.lastError && <div className="text-xs mt-1">{stream.lastError}</div>}
                        {autoReconnect && <div className="text-xs mt-2 text-yellow-400">Auto-reconnecting...</div>}
                      </div>
                    </div>
                  )}

                  {/* Paused State */}
                  {stream.status === "paused" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <Pause className="w-8 h-8 mx-auto mb-2" />
                        <div>Paused</div>
                      </div>
                    </div>
                  )}

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black bg-opacity-75 rounded p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleStream(stream.id)}
                          disabled={stream.status === "connecting" || stream.status === "error"}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {stream.status === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleMute(stream.id)}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          {stream.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>

                        <div className="w-16">
                          <Slider
                            value={[stream.volume]}
                            onValueChange={(value) => updateStreamVolume(stream.id, value[0])}
                            max={100}
                            min={0}
                            step={1}
                            className="text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRecording(stream.id)}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => enterFullscreen(stream.id)}
                          className="text-white hover:bg-white hover:bg-opacity-20"
                        >
                          <Expand className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{stream.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{stream.url}</p>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleFavorite(stream.id)} className="p-1">
                        {stream.isFavorite ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="p-1">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {}}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => removeStream(stream.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <Badge variant="outline" className="text-xs">
                      {stream.category}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {stream.uptime > 0 && <span>↑ {formatUptime(stream.uptime)}</span>}
                      {stream.status === "connected" && (
                        <div className="flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-green-500" />
                          <span>Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
