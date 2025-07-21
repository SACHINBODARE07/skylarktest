"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Plus,
  Settings,
  Monitor,
  Activity,
  Wifi,
  WifiOff,
  Star,
  StarOff,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react"

interface Stream {
  id: number
  name: string
  url: string
  status: "active" | "offline" | "error"
  category: string
  location: string
  resolution: string
  fps: number
  bitrate: string
  uptime: string
  last_seen: string
  is_favorite: boolean
  created_at: string
}

interface StreamData {
  stream_id: number
  bandwidth_usage: string
  packet_loss: string
  latency: string
  viewers: number
  quality_score: number
  last_updated: string
}

export default function StreamViewerPro() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [streamData, setStreamData] = useState<StreamData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<"connected" | "demo" | "error">("demo")
  const [newStream, setNewStream] = useState({
    name: "",
    url: "",
    category: "Security",
    location: "",
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("streams")

  const API_BASE = process.env.NODE_ENV === "production" ? "https://your-vercel-app.vercel.app/api" : "/api"

  useEffect(() => {
    fetchStreams()
    checkApiHealth()
  }, [])

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`)
      if (response.ok) {
        setApiStatus("connected")
      } else {
        setApiStatus("demo")
      }
    } catch (error) {
      setApiStatus("demo")
    }
  }

  const fetchStreams = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/streams`)
      if (response.ok) {
        const data = await response.json()
        setStreams(data.streams || [])
        setApiStatus("connected")
      } else {
        throw new Error("API not available")
      }
    } catch (error) {
      setApiStatus("demo")
      // Demo data fallback
      setStreams([
        {
          id: 1,
          name: "Main Entrance Security",
          url: "rtsp://demo.server.com:554/main_entrance",
          status: "active",
          category: "Security",
          location: "Building A - Main Entrance",
          resolution: "1920x1080",
          fps: 30,
          bitrate: "2.5 Mbps",
          uptime: "99.8%",
          last_seen: new Date().toISOString(),
          is_favorite: true,
          created_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          name: "Conference Room Alpha",
          url: "rtsp://demo.server.com:554/conference_alpha",
          status: "active",
          category: "Meeting",
          location: "Floor 3 - Conference Room A",
          resolution: "1920x1080",
          fps: 30,
          bitrate: "3.2 Mbps",
          uptime: "99.2%",
          last_seen: new Date().toISOString(),
          is_favorite: true,
          created_at: "2024-01-18T09:15:00Z",
        },
      ])
    }
    setIsLoading(false)
  }

  const fetchStreamData = async (streamId: number) => {
    try {
      const response = await fetch(`${API_BASE}/streams/stream_data?id=${streamId}`)
      if (response.ok) {
        const data = await response.json()
        setStreamData(data)
      }
    } catch (error) {
      // Demo data fallback
      setStreamData({
        stream_id: streamId,
        bandwidth_usage: "2.3 Mbps",
        packet_loss: "0.12%",
        latency: "85ms",
        viewers: 7,
        quality_score: 94,
        last_updated: new Date().toISOString(),
      })
    }
  }

  const addStream = async () => {
    try {
      const response = await fetch(`${API_BASE}/streams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStream),
      })

      if (response.ok) {
        fetchStreams()
        setNewStream({ name: "", url: "", category: "Security", location: "" })
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding stream:", error)
    }
  }

  const toggleFavorite = (streamId: number) => {
    setStreams(
      streams.map((stream) => (stream.id === streamId ? { ...stream, is_favorite: !stream.is_favorite } : stream)),
    )
  }

  const selectStream = (stream: Stream) => {
    setSelectedStream(stream)
    fetchStreamData(stream.id)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      case "error":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "offline":
        return <WifiOff className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RTSP Stream Manager</h1>
            <p className="text-slate-600 mt-1">Professional streaming platform for enterprise monitoring</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={apiStatus === "connected" ? "default" : "secondary"} className="px-3 py-1">
              {apiStatus === "connected" ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  API Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Demo Mode Active
                </>
              )}
            </Badge>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stream
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New RTSP Stream</DialogTitle>
                  <DialogDescription>Configure a new RTSP stream for monitoring</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Stream Name</Label>
                    <Input
                      id="name"
                      value={newStream.name}
                      onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                      placeholder="e.g., Main Entrance Camera"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">RTSP URL</Label>
                    <Input
                      id="url"
                      value={newStream.url}
                      onChange={(e) => setNewStream({ ...newStream, url: e.target.value })}
                      placeholder="rtsp://username:password@ip:port/path"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newStream.category}
                      onValueChange={(value) => setNewStream({ ...newStream, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newStream.location}
                      onChange={(e) => setNewStream({ ...newStream, location: e.target.value })}
                      placeholder="e.g., Building A - Floor 1"
                    />
                  </div>
                  <Button onClick={addStream} className="w-full">
                    Add Stream
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Streams</p>
                  <p className="text-2xl font-bold">{streams.length}</p>
                </div>
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Active Streams</p>
                  <p className="text-2xl font-bold text-green-600">
                    {streams.filter((s) => s.status === "active").length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Offline Streams</p>
                  <p className="text-2xl font-bold text-red-600">
                    {streams.filter((s) => s.status === "offline").length}
                  </p>
                </div>
                <WifiOff className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Favorites</p>
                  <p className="text-2xl font-bold text-yellow-600">{streams.filter((s) => s.is_favorite).length}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stream List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Stream Management
                </CardTitle>
                <CardDescription>Manage and monitor your RTSP streams</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading streams...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {streams.map((stream) => (
                      <div
                        key={stream.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedStream?.id === stream.id ? "border-blue-500 bg-blue-50" : "border-slate-200"
                        }`}
                        onClick={() => selectStream(stream)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(stream.status)}`} />
                            <div>
                              <h3 className="font-semibold text-slate-900">{stream.name}</h3>
                              <p className="text-sm text-slate-600">{stream.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{stream.category}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(stream.id)
                              }}
                            >
                              {stream.is_favorite ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(stream.status)}
                            {stream.status}
                          </span>
                          <span>{stream.resolution}</span>
                          <span>{stream.fps} FPS</span>
                          <span>{stream.bitrate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stream Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Stream Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStream ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedStream.name}</h3>
                      <p className="text-sm text-slate-600">{selectedStream.location}</p>
                    </div>

                    {streamData && (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Quality Score</span>
                          <span className="font-semibold">{streamData.quality_score}%</span>
                        </div>
                        <Progress value={streamData.quality_score} className="h-2" />

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-600">Bandwidth</p>
                            <p className="font-semibold">{streamData.bandwidth_usage}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Latency</p>
                            <p className="font-semibold">{streamData.latency}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Packet Loss</p>
                            <p className="font-semibold">{streamData.packet_loss}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Viewers</p>
                            <p className="font-semibold">{streamData.viewers}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Uptime</span>
                          <span className="font-semibold">{selectedStream.uptime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Resolution</span>
                          <span className="font-semibold">{selectedStream.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Frame Rate</span>
                          <span className="font-semibold">{selectedStream.fps} FPS</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a stream to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Status Alert */}
        {apiStatus === "demo" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode Active</strong> - Backend API is unavailable. You can still test the interface with demo
              data and add streams locally.
              <br />
              <span className="text-sm text-slate-600">API URL: {API_BASE}</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
