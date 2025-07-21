import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vercel_app.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
