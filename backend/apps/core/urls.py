from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, FacilityViewSet, NormalizedRecordViewSet, IngestionAPIView, LedgerSummaryAPIView, RawIngestionLogViewSet

router = DefaultRouter()
router.register('tenants', TenantViewSet, basename='tenant')
router.register('facilities', FacilityViewSet, basename='facility')
router.register('records', NormalizedRecordViewSet, basename='record')
router.register('files', RawIngestionLogViewSet, basename='file')

urlpatterns = [
    path('', include(router.urls)),
    path('ingest/', IngestionAPIView.as_view(), name='ingest'),
    path('ledger/summary/', LedgerSummaryAPIView.as_view(), name='ledger-summary'),
]
