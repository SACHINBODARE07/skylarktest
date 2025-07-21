from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import time
from .models import Stream
from .serializers import StreamSerializer

# Initialize database on first import
def init_db():
    try:
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'migrate', '--run-syncdb'])
    except:
        pass

init_db()

@method_decorator(csrf_exempt, name='dispatch')
class StreamViewSet(viewsets.ModelViewSet):
    serializer_class = StreamSerializer
    
    def get_queryset(self):
        return Stream.objects.all()

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_streams = Stream.objects.filter(is_active=True)
        serializer = self.get_serializer(active_streams, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def favorites(self, request):
        favorite_streams = Stream.objects.filter(is_favorite=True)
        serializer = self.get_serializer(favorite_streams, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        try:
            stream = self.get_object()
            stream.is_favorite = not stream.is_favorite
            stream.save()
            return Response({'is_favorite': stream.is_favorite})
        except Stream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=404)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        try:
            stream = self.get_object()
            status_data = request.data.get('status', 'active')
            stream.is_active = status_data == 'active'
            stream.save()
            return Response({'status': 'updated'})
        except Stream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=404)

    @action(detail=False, methods=['post'])
    def validate_stream(self, request):
        """Validate RTSP stream URL without full processing"""
        rtsp_url = request.data.get('url')
        if not rtsp_url:
            return Response({'valid': False, 'error': 'No URL provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Simple validation - check if URL format is correct
            if not rtsp_url.startswith('rtsp://'):
                return Response({'valid': False, 'error': 'Invalid RTSP URL format'})
            
            # For Vercel deployment, we'll simulate stream validation
            # In production, you'd use FFmpeg to probe the stream
            return Response({
                'valid': True,
                'metadata': {
                    'resolution': '1920x1080',
                    'fps': 30,
                    'codec': 'H.264'
                }
            })
        except Exception as e:
            return Response({'valid': False, 'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stream_data(self, request):
        """Simulate stream data for demo purposes"""
        stream_id = request.GET.get('stream_id')
        if not stream_id:
            return Response({'error': 'Stream ID required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Simulate stream data
        mock_data = {
            'stream_id': stream_id,
            'status': 'connected',
            'bandwidth': 2048,  # KB/s
            'fps': 30,
            'resolution': '1920x1080',
            'uptime': 3600,  # seconds
            'timestamp': time.time()
        }
        
        return Response(mock_data)
