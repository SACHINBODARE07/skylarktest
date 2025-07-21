from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        # Parse URL
        parsed_url = urllib.parse.urlparse(self.path)
        
        if parsed_url.path == '/api' or parsed_url.path == '/api/':
            response = {
                "message": "RTSP Stream Viewer API",
                "version": "1.0.0",
                "status": "active",
                "endpoints": [
                    "/api/health",
                    "/api/streams",
                    "/api/streams/validate_stream",
                    "/api/streams/stream_data"
                ]
            }
        else:
            response = {"error": "Endpoint not found"}
            
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
