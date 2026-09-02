from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'teachers', views.TeacherViewSet, basename='teacher')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'student-courses', views.StudentCourseViewSet, basename='studentcourse')

urlpatterns = [
    path('', views.index, name='index'),
    path('courses/', views.courses_view, name='courses'),
    path('students/', views.students_view, name='students'),
    path('api/', include(router.urls)),
]