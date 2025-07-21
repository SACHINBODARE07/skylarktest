from rest_framework import serializers
from .models import Stream

class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = [
            'id', 'url', 'name', 'category', 'is_active', 
            'is_favorite', 'quality', 'metadata', 
            'created_at', 'updated_at'
        ]
        
    def create(self, validated_data):
        # Set default name if not provided
        if not validated_data.get('name'):
            validated_data['name'] = f"Stream {Stream.objects.count() + 1}"
        return super().create(validated_data)
