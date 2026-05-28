import os
from django.utils.deprecation import MiddlewareMixin
from .models import Tenant

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that identifies the active tenant from custom request headers
    (e.g., 'X-Tenant-Slug') and attaches it to request.tenant,
    guaranteeing strict multi-tenancy isolation.
    """
    def process_request(self, request):
        tenant_slug = request.headers.get('X-Tenant-Slug')
        
        if tenant_slug:
            try:
                request.tenant = Tenant.objects.get(slug=tenant_slug)
            except Tenant.DoesNotExist:
                request.tenant = None
        else:
            # Strict isolation: Do not fallback to a default tenant
            request.tenant = None
            
        return None
