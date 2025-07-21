from django.db import models
import json

class Stream(models.Model):
    url = models.URLField(max_length=500)
    name = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=100, default='default')
    is_active = models.BooleanField(default=True)
    is_favorite = models.BooleanField(default=False)
    quality = models.CharField(max_length=20, default='auto')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store stream metadata as JSON
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name or self.url

    class Meta:
        ordering = ['-created_at']

    def get_metadata(self):
        return self.metadata or {}

    def set_metadata(self, key, value):
        if not self.metadata:
            self.metadata = {}
        self.metadata[key] = value
        self.save()
