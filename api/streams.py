from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime
import urllib.parse
import uuid
import re
import random
import time

# Professional mock database with realistic data
STREAMS_DATABASE = [
    {
        "id": 1,
        "url": "rtsp://admin:admin123@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0",
        "name": "Main Entrance Security Camera",
        "category": "security",
        "is_active": True,
        "is_favorite": True,
        "quality": "high",
        "created_at": "2024-01-15T08:30:00Z",
        "updated_at": "2024-01-21T14:22:00Z",
        "metadata": {
            "location": "Building A - Main Entrance",
            "resolution": "1920x1080",
            "fps": 30,
            "codec": "H.264",
            "bitrate": "2048 kbps"
        }
    },
    {
        "id": 2,
        "url": "rtsp://admin:password@192.168.1.101:554/stream1",
        "name": "Parking Lot Surveillance",
        "category": "security",
        "is_active": True,
        "is_favorite": False,
        "quality": "medium",
        "created_at": "2024-01-15T09:15:00Z",
        "updated_at": "2024-01-21T14:22:00Z",
        "metadata": {
            "location": "Parking Area - North Side",
            "resolution": "1280x720",
            "fps": 25,
            "codec": "H.264",
            "bitrate": "1024 kbps"
        }
    },
    {
        "id": 3,
        "url": "rtsp://user:pass123@192.168.1.102:554/live/ch1",
        "name": "Conference Room Camera",
        "category": "meeting",
        "is_active": False,
        "is_favorite": True,
        "quality": "high",
        "created_at": "2024-01-16T10:00:00Z",
        "updated_at": "2024-01-21T14:22:00Z",
        "metadata": {
            "location": "Conference Room B",
            "resolution": "1920x1080",
            "fps": 30,
            "codec": "H.265",
            "bitrate": "3072 kbps"
        }
    },
    {
        "id": 4,
        "url": "rtsp://demo:demo@wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4",
        "name": "Demo Test Stream",
        "category": "test",
        "is_active": True,
        "is_favorite": False,
        "quality": "auto",
        "created_at": "2024-01-20T16:45:00Z",
        "updated_at": "2024-01-21T14:22:00Z",
        "metadata": {
            "location": "Test Environment",
            "resolution": "854x480",
            "fps": 24,
            "codec": "H.264",
            "bitrate": "512 kbps"
        }
    }
]

# Professional demo data
DEMO_STREAMS = [
    {
        "id": 1,
        "name": "Main Entrance Security",
        "url": "rtsp://demo.server.com:554/main_entrance",
        "status": "active",
        "category": "Security",
        "location": "Building A - Main Entrance",
        "resolution": "1920x1080",
        "fps": 30,
        "bitrate": "2.5 Mbps",
        "uptime": "99.8%",
        "last_seen": "2024-01-21T15:30:00Z",
        "is_favorite": True,
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": 2,
        "name": "Parking Lot Surveillance",
        "url": "rtsp://demo.server.com:554/parking_lot",
        "status": "active",
        "category": "Security",
        "location": "Parking Area - North Side",
        "resolution": "1280x720",
        "fps": 25,
        "bitrate": "1.8 Mbps",
        "uptime": "98.5%",
        "last_seen": "2024-01-21T15:29:45Z",
        "is_favorite": False,
        "created_at": "2024-01-16T14:30:00Z"
    },
    {
        "id": 3,
        "name": "Conference Room Alpha",
        "url": "rtsp://demo.server.com:554/conference_alpha",
        "status": "active",
        "category": "Meeting",
        "location": "Floor 3 - Conference Room A",
        "resolution": "1920x1080",
        "fps": 30,
        "bitrate": "3.2 Mbps",
        "uptime": "99.2%",
        "last_seen": "2024-01-21T15:30:15Z",
        "is_favorite": True,
        "created_at": "2024-01-18T09:15:00Z"
    },
    {
        "id": 4,
        "name": "Production Floor Monitor",
        "url": "rtsp://demo.server.com:554/production_floor",
        "status": "offline",
        "category": "Industrial",
        "location": "Manufacturing - Floor 1",
        "resolution": "1280x720",
        "fps": 20,
        "bitrate": "1.5 Mbps",
        "uptime": "95.3%",
        "last_seen": "2024-01-21T14:45:30Z",
        "is_favorite": False,
        "created_at": "2024-01-20T11:00:00Z"
    }
]

def validate_rtsp_url(url):
    """Validate RTSP URL format and extract metadata"""
    rtsp_pattern = r'^rtsp://(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\d+))?(/.*)?$'
    match = re.match(rtsp_pattern, url)
    
    if not match:
        return False, "Invalid RTSP URL format"
    
    username, password, host, port, path = match.groups()
    
    # Basic validation
    if not host:
        return False, "Host is required"
    
    if port and (int(port) < 1 or int(port) > 65535):
        return False, "Invalid port number"
    
    return True, {
        "host": host,
        "port": port or "554",
        "path": path or "/",
        "has_auth": bool(username and password),
        "estimated_quality": "1920x1080" if "high" in url.lower() else "1280x720"
    }

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse URL and query parameters
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path.rstrip('/')
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        try:
            if path == '/api/streams':
                # Return all streams with professional formatting
                response = {
                    "success": True,
                    "data": STREAMS_DATABASE,
                    "total": len(STREAMS_DATABASE),
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
            elif path == '/api/streams/active':
                # Return active streams only
                active_streams = [stream for stream in STREAMS_DATABASE if stream['is_active']]
                response = {
                    "success": True,
                    "data": active_streams,
                    "total": len(active_streams),
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
            elif path == '/api/streams/favorites':
                # Return favorite streams only
                favorite_streams = [stream for stream in STREAMS_DATABASE if stream['is_favorite']]
                response = {
                    "success": True,
                    "data": favorite_streams,
                    "total": len(favorite_streams),
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
            elif path == '/api/streams/stream_data':
                # Return realistic stream performance data
                stream_id = query_params.get('stream_id', ['1'])[0]
                
                # Find stream in database
                stream = next((s for s in STREAMS_DATABASE if str(s['id']) == str(stream_id)), None)
                
                if stream:
                    # Generate realistic performance metrics
                    base_bandwidth = 2048 if stream['quality'] == 'high' else 1024
                    bandwidth_variation = random.randint(-200, 200)
                    
                    response = {
                        "success": True,
                        "data": {
                            'stream_id': stream_id,
                            'status': 'connected' if stream['is_active'] else 'paused',
                            'bandwidth': max(512, base_bandwidth + bandwidth_variation),
                            'fps': stream['metadata'].get('fps', 30),
                            'resolution': stream['metadata'].get('resolution', '1920x1080'),
                            'uptime': random.randint(1800, 7200),  # 30min to 2hrs
                            'packet_loss': round(random.uniform(0, 0.5), 2),
                            'latency': random.randint(50, 200),
                            'codec': stream['metadata'].get('codec', 'H.264'),
                            'bitrate': stream['metadata'].get('bitrate', '2048 kbps')
                        },
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    response = {
                        "success": False,
                        "error": "Stream not found",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                    
            elif path.startswith('/api/streams/') and path.split('/')[-1].isdigit():
                # Get specific stream by ID
                stream_id = int(path.split('/')[-1])
                stream = next((s for s in STREAMS_DATABASE if s['id'] == stream_id), None)
                
                if stream:
                    response = {
                        "success": True,
                        "data": stream,
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    self.send_response(404)
                    response = {
                        "success": False,
                        "error": "Stream not found",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                    
            else:
                self.send_response(404)
                response = {
                    "success": False,
                    "error": "Endpoint not found",
                    "available_endpoints": [
                        "/api/streams",
                        "/api/streams/active", 
                        "/api/streams/favorites",
                        "/api/streams/stream_data?stream_id=<id>"
                    ],
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
        except Exception as e:
            self.send_response(500)
            response = {
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
            
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
            
            parsed_url = urllib.parse.urlparse(self.path)
            path = parsed_url.path.rstrip('/')
            
            if path == '/api/streams':
                # Create new stream with validation
                url = data.get('url', '').strip()
                name = data.get('name', '').strip()
                category = data.get('category', 'default').strip()
                
                if not url:
                    self.send_response(400)
                    response = {
                        "success": False,
                        "error": "URL is required",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                elif not name:
                    self.send_response(400)
                    response = {
                        "success": False,
                        "error": "Stream name is required",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    # Validate URL
                    is_valid, validation_result = validate_rtsp_url(url)
                    
                    if not is_valid:
                        self.send_response(400)
                        response = {
                            "success": False,
                            "error": "Invalid RTSP URL",
                            "details": validation_result,
                            "timestamp": datetime.utcnow().isoformat() + 'Z'
                        }
                    else:
                        # Create new stream
                        new_stream = {
                            "id": max([s['id'] for s in STREAMS_DATABASE], default=0) + 1,
                            "url": url,
                            "name": name,
                            "category": category,
                            "is_active": data.get('is_active', True),
                            "is_favorite": data.get('is_favorite', False),
                            "quality": data.get('quality', 'auto'),
                            "created_at": datetime.utcnow().isoformat() + 'Z',
                            "updated_at": datetime.utcnow().isoformat() + 'Z',
                            "metadata": {
                                "location": data.get('location', 'Unknown'),
                                "resolution": validation_result.get('estimated_quality', '1280x720'),
                                "fps": 30,
                                "codec": "H.264",
                                "bitrate": "2048 kbps",
                                **data.get('metadata', {})
                            }
                        }
                        
                        STREAMS_DATABASE.append(new_stream)
                        
                        response = {
                            "success": True,
                            "message": "Stream created successfully",
                            "data": new_stream,
                            "timestamp": datetime.utcnow().isoformat() + 'Z'
                        }
                
            elif path == '/api/streams/validate_stream':
                # Validate stream URL
                url = data.get('url', '').strip()
                
                if not url:
                    self.send_response(400)
                    response = {
                        "success": False,
                        "error": "URL is required for validation",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    is_valid, result = validate_rtsp_url(url)
                    
                    if is_valid:
                        response = {
                            "success": True,
                            "valid": True,
                            "message": "RTSP URL is valid",
                            "metadata": {
                                "host": result['host'],
                                "port": result['port'],
                                "path": result['path'],
                                "has_authentication": result['has_auth'],
                                "estimated_resolution": result['estimated_quality'],
                                "estimated_fps": 30,
                                "estimated_codec": "H.264"
                            },
                            "timestamp": datetime.utcnow().isoformat() + 'Z'
                        }
                    else:
                        self.send_response(400)
                        response = {
                            "success": False,
                            "valid": False,
                            "error": result,
                            "timestamp": datetime.utcnow().isoformat() + 'Z'
                        }
                        
            elif path.startswith('/api/streams/') and '/toggle_favorite' in path:
                # Toggle favorite status
                stream_id = int(path.split('/')[-2])
                stream = next((s for s in STREAMS_DATABASE if s['id'] == stream_id), None)
                
                if stream:
                    stream['is_favorite'] = not stream['is_favorite']
                    stream['updated_at'] = datetime.utcnow().isoformat() + 'Z'
                    
                    response = {
                        "success": True,
                        "message": f"Stream {'added to' if stream['is_favorite'] else 'removed from'} favorites",
                        "data": {
                            "id": stream['id'],
                            "is_favorite": stream['is_favorite']
                        },
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    self.send_response(404)
                    response = {
                        "success": False,
                        "error": "Stream not found",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                    
            elif path.startswith('/api/streams/') and '/update_status' in path:
                # Update stream status
                stream_id = int(path.split('/')[-2])
                stream = next((s for s in STREAMS_DATABASE if s['id'] == stream_id), None)
                
                if stream:
                    new_status = data.get('status', 'active')
                    stream['is_active'] = new_status == 'active'
                    stream['updated_at'] = datetime.utcnow().isoformat() + 'Z'
                    
                    response = {
                        "success": True,
                        "message": f"Stream status updated to {new_status}",
                        "data": {
                            "id": stream['id'],
                            "is_active": stream['is_active'],
                            "status": new_status
                        },
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    self.send_response(404)
                    response = {
                        "success": False,
                        "error": "Stream not found",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                    
            else:
                self.send_response(404)
                response = {
                    "success": False,
                    "error": "Endpoint not found",
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
        except json.JSONDecodeError:
            self.send_response(400)
            response = {
                "success": False,
                "error": "Invalid JSON in request body",
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
        except Exception as e:
            self.send_response(500)
            response = {
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
            
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_DELETE(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        try:
            # Extract stream ID from path
            path_parts = self.path.strip('/').split('/')
            
            if len(path_parts) >= 3 and path_parts[1] == 'streams' and path_parts[2].isdigit():
                stream_id = int(path_parts[2])
                
                # Find and remove stream
                stream_to_remove = next((s for s in STREAMS_DATABASE if s['id'] == stream_id), None)
                
                if stream_to_remove:
                    STREAMS_DATABASE.remove(stream_to_remove)
                    response = {
                        "success": True,
                        "message": f"Stream '{stream_to_remove['name']}' deleted successfully",
                        "deleted_stream": {
                            "id": stream_to_remove['id'],
                            "name": stream_to_remove['name']
                        },
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
                else:
                    self.send_response(404)
                    response = {
                        "success": False,
                        "error": "Stream not found",
                        "timestamp": datetime.utcnow().isoformat() + 'Z'
                    }
            else:
                self.send_response(400)
                response = {
                    "success": False,
                    "error": "Invalid stream ID in URL",
                    "timestamp": datetime.utcnow().isoformat() + 'Z'
                }
                
        except Exception as e:
            self.send_response(500)
            response = {
                "success": False,
                "error": "Internal server error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat() + 'Z'
            }
            
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
