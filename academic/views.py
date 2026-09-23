from django.shortcuts import render, redirect
from rest_framework import viewsets

from .models import Teacher, Course, Student, StudentCourse
from .serializers import (
    TeacherSerializer,
    CourseSerializer,
    StudentSerializer,
    StudentCourseSerializer,
)


# ==============================================================================
# ENDPOINTS API REST (Django REST Framework)
# ==============================================================================
# Al heredar de 'viewsets.ModelViewSet', DRF implementa automáticamente:
#   - list()           -> GET    /api/{recurso}/        (Listado general)
#   - create()         -> POST   /api/{recurso}/        (Crear nuevo registro)
#   - retrieve()       -> GET    /api/{recurso}/{id}/   (Obtener un registro por ID)
#   - update()         -> PUT    /api/{recurso}/{id}/   (Actualizar registro completo)
#   - partial_update() -> PATCH  /api/{recurso}/{id}/   (Actualizar campos parciales)
#   - destroy()        -> DELETE /api/{recurso}/{id}/   (Eliminar de la base de datos)
# ==============================================================================

class TeacherViewSet(viewsets.ModelViewSet):
    """
    Controlador API para el recurso Profesores (/api/teachers/).
    Permite operaciones CRUD directas y sirve para alimentar el selector
    de docentes en los formularios de creación y edición de cursos.
    """
    queryset = Teacher.objects.all().order_by('id')
    serializer_class = TeacherSerializer


class CourseViewSet(viewsets.ModelViewSet):
    """
    Controlador API para el recurso Cursos (/api/courses/).
    'select_related('teacher')' realiza una consulta SQL optimizada tipo JOIN,
    evitando el problema de N+1 consultas al serializar el docente a cargo.
    """
    queryset = Course.objects.select_related('teacher').all().order_by('id')
    serializer_class = CourseSerializer


class StudentViewSet(viewsets.ModelViewSet):
    """
    Controlador API para el recurso Estudiantes (/api/students/).
    Gestiona altas, bajas y modificaciones de alumnos sobre la base de datos SQLite.
    """
    queryset = Student.objects.all().order_by('id')
    serializer_class = StudentSerializer


class StudentCourseViewSet(viewsets.ModelViewSet):
    """
    Controlador API para Inscripciones (/api/student-courses/).
    Gestiona la asociación entre estudiantes y cursos.
    'select_related('student', 'course')' optimiza la carga de ambos objetos relacionados.
    """
    queryset = StudentCourse.objects.select_related('student', 'course').all().order_by('id')
    serializer_class = StudentCourseSerializer


# ==============================================================================
# VISTAS WEB (Renderizan plantillas HTML)
# ==============================================================================
# Cada vista carga la estructura HTML base y delega la interactividad
# a los archivos JavaScript estáticos que consumen la API REST mediante fetch().
# ==============================================================================

def home_view(request):
    """
    Vista principal (raíz '/'):
    Carga home.html con el mensaje de bienvenida y accesos directos a los módulos.
    """
    return render(request, 'academic/home.html')


def courses_view(request):
    """
    Vista de Cursos ('/courses/'):
    Carga courses.html y ejecuta courses.js para poblar la tabla y modales.
    """
    return render(request, 'academic/courses.html')


def students_view(request):
    """
    Vista de Estudiantes ('/students/'):
    Carga students.html y ejecuta students.js para gestionar a los alumnos.
    """
    return render(request, 'academic/students.html')


def teachers_view(request):
    """
    Vista de Profesores ('/teachers/'):
    Carga teachers.html y ejecuta teachers.js para administrar al cuerpo docente.
    """
    return render(request, 'academic/teachers.html')


def redirect_to_home(request, exception=None, *args, **kwargs):
    """
    Mecanismo de Fallback para eliminación del error 404:
    Cualquier ruta inválida o no registrada es interceptada y redirigida
    automáticamente con código HTTP 302 a la vista 'home'.
    """
    return redirect('home')


# Alias para mantener retrocompatibilidad con referencias anteriores
index = home_view