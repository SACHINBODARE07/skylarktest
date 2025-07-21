import json
import asyncio
import subprocess
import base64
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings

logger = logging.getLogger(__name__)

class StreamConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.stream_id = None
        self.ffmpeg_process = None
        self.streaming_task = None
        self.is_streaming = False

    async def connect(self):
        self.stream_id = self.scope['url_route']['kwargs']['stream_id']
        await self.accept()
        logger.info(f"WebSocket connected for stream {self.stream_id}")

    async def disconnect(self, close_code):
        await self.stop_streaming()
        logger.info(f"WebSocket disconnected for stream {self.stream_id}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'start_stream':
                rtsp_url = data.get('rtsp_url')
                if rtsp_url:
                    await self.start_streaming(rtsp_url)
            elif action == 'pause_stream':
                await self.pause_streaming()
            elif action == 'resume_stream':
                await self.resume_streaming()
            elif action == 'stop_stream':
                await self.stop_streaming()

        except json.JSONDecodeError:
            await self.send_error("Invalid JSON data")
        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send_error(f"Error processing request: {str(e)}")

    async def start_streaming(self, rtsp_url):
        try:
            await self.send_status("connecting")
            
            # FFmpeg command to convert RTSP to HLS segments
            ffmpeg_cmd = [
                settings.FFMPEG_PATH,
                '-i', rtsp_url,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-tune', 'zerolatency',
                '-c:a', 'aac',
                '-f', 'mp4',
                '-movflags', 'frag_keyframe+empty_moov',
                '-'
            ]

            self.ffmpeg_process = subprocess.Popen(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0
            )

            self.is_streaming = True
            self.streaming_task = asyncio.create_task(self.stream_video())
            await self.send_status("connected")

        except Exception as e:
            logger.error(f"Error starting stream: {str(e)}")
            await self.send_error(f"Failed to start stream: {str(e)}")

    async def stream_video(self):
        try:
            while self.is_streaming and self.ffmpeg_process:
                chunk = self.ffmpeg_process.stdout.read(8192)
                if not chunk:
                    break
                
                # Encode chunk as base64 for WebSocket transmission
                encoded_chunk = base64.b64encode(chunk).decode('utf-8')
                await self.send(text_data=json.dumps({
                    'type': 'stream_chunk',
                    'chunk': encoded_chunk
                }))
                
                await asyncio.sleep(0.01)  # Small delay to prevent overwhelming

        except Exception as e:
            logger.error(f"Error in streaming: {str(e)}")
            await self.send_error(f"Streaming error: {str(e)}")
        finally:
            await self.stop_streaming()

    async def pause_streaming(self):
        self.is_streaming = False
        await self.send_status("paused")

    async def resume_streaming(self):
        if self.ffmpeg_process and self.ffmpeg_process.poll() is None:
            self.is_streaming = True
            if not self.streaming_task or self.streaming_task.done():
                self.streaming_task = asyncio.create_task(self.stream_video())
            await self.send_status("connected")

    async def stop_streaming(self):
        self.is_streaming = False
        
        if self.streaming_task:
            self.streaming_task.cancel()
            try:
                await self.streaming_task
            except asyncio.CancelledError:
                pass

        if self.ffmpeg_process:
            try:
                self.ffmpeg_process.terminate()
                self.ffmpeg_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.ffmpeg_process.kill()
            except Exception as e:
                logger.error(f"Error stopping FFmpeg process: {str(e)}")
            finally:
                self.ffmpeg_process = None

    async def send_status(self, status):
        await self.send(text_data=json.dumps({
            'type': 'status',
            'status': status
        }))

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))
