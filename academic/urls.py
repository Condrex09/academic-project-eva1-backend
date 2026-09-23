from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter

from . import views

# ==============================================================================
# ENRUTADOR AUTOMÁTICO DE LA API (DefaultRouter)
# ==============================================================================
# DefaultRouter inspecciona los ModelViewSet y genera automáticamente todas las URLs:
#   - /api/teachers/        y /api/teachers/<id>/
#   - /api/courses/         y /api/courses/<id>/
#   - /api/students/        y /api/students/<id>/
#   - /api/student-courses/ y /api/student-courses/<id>/
# Además, proporciona la interfaz navegable interactiva de DRF en '/api/'.
# ==============================================================================
router = DefaultRouter()
router.register(r'teachers', views.TeacherViewSet, basename='teacher')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'student-courses', views.StudentCourseViewSet, basename='studentcourse')

urlpatterns = [
    # Rutas Web de la Interfaz de Usuario
    path('', views.home_view, name='home'),
    path('home/', views.home_view, name='home_alt'),
    path('courses/', views.courses_view, name='courses'),
    path('students/', views.students_view, name='students'),
    path('teachers/', views.teachers_view, name='teachers'),

    # Endpoints REST de la API (prefijo /api/)
    path('api/', include(router.urls)),

    # --------------------------------------------------------------------------
    # Fallback para eliminar el error 404:
    # Se coloca obligatoriamente AL FINAL de urlpatterns.
    # Cualquier ruta no coincidente con las anteriores es capturada por la regex '^.*$'
    # y redirigida a 'home_view' mediante 'redirect_to_home'.
    # --------------------------------------------------------------------------
    re_path(r'^.*$', views.redirect_to_home, name='fallback_home'),
]