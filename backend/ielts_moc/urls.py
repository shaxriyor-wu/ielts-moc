"""
URL configuration for ielts_moc project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from .views import root_view, react_app_view

urlpatterns = [
    path('api/', root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('exams.urls')),
    path('api/', include('student_portal.urls')),
    path('api/', include('grading.urls')),
]

# Serve media files in development
# In production, media files should be served via a CDN or separate storage
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # In production, serve media files (WhiteNoise handles static files automatically)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve React app for all non-API routes (SPA routing)
# This must be last to catch all routes not matched above
# Exclude: api, admin, static, media, and assets (React build assets)
urlpatterns += [
    re_path(r'^(?!api|admin|static|media|assets).*$', react_app_view, name='react-app'),
]

