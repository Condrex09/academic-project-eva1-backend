from django.shortcuts import render
from rest_framework import viewsets

from .models import Teacher, Course, Student, StudentCourse
from .serializers import (
    TeacherSerializer,
    CourseSerializer,
    StudentSerializer,
    StudentCourseSerializer,
)


# --- Endpoints DRF (/api/...) ---

class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.select_related('teacher').all()
    serializer_class = CourseSerializer


class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class StudentCourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StudentCourse.objects.select_related('student', 'course').all()
    serializer_class = StudentCourseSerializer


# --- Vistas HTML (enmascaran la API) ---

def index(request):
    return render(request, 'academic/index.html')


def courses_view(request):
    return render(request, 'academic/courses.html')


def students_view(request):
    return render(request, 'academic/students.html')