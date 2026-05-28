from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urlkeys if hasattr(admin.site, 'urlkeys') else admin.site.urls),
    
    # Mount local modular apps
    path('api/auth/', include('apps.authentication.urls')),
    path('api/core/', include('apps.core.urls')),
]
