"""
URL configuration for drf project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('academic.urls')),
]

# Manejador global para cualquier error 404
handler404 = 'academic.views.redirect_to_home'