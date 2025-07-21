from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'streams', views.StreamViewSet, basename='stream')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
]
