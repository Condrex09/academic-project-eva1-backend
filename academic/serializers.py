from rest_framework import serializers
from .models import Teacher, Course, Student, StudentCourse


class TeacherSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Teacher (Docentes).
    Convierte las instancias de Teacher en JSON (para GET) y valida datos al crear/editar (POST/PUT).
    Campos expuestos: id, first_name (nombre) y last_name (apellido).
    """
    class Meta:
        model = Teacher
        fields = ['id', 'first_name', 'last_name']


class CourseSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Course (Cursos/Asignaturas).
    Maneja una relación foránea con Teacher de manera dual:
    
    1. LECTURA (GET):
       'teacher' utiliza TeacherSerializer(read_only=True) para devolver el objeto 
       completo del profesor con su id, nombre y apellido en las respuestas JSON.
       
    2. ESCRITURA (POST, PUT, PATCH):
       'teacher_id' utiliza PrimaryKeyRelatedField con source='teacher'.
       Esto permite que el frontend envíe simplemente el ID del profesor:
       ejemplo: { "name": "Programación Web", "teacher_id": 1 }
       DRF busca el profesor con ese ID en la base de datos y lo asigna al campo 'teacher' del modelo.
    """
    teacher = TeacherSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(),
        source='teacher',
        required=False
    )

    class Meta:
        model = Course
        fields = ['id', 'name', 'teacher', 'teacher_id']

    def to_internal_value(self, data):
        """
        Intercepta los datos recibidos antes de la validación.
        Permite máxima flexibilidad: si un cliente envía 'teacher': 1 en vez de 
        'teacher_id': 1, lo normaliza automáticamente para evitar errores 400.
        """
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'teacher' in data and not isinstance(data['teacher'], dict) and 'teacher_id' not in data:
            data['teacher_id'] = data['teacher']
        return super().to_internal_value(data)


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Student (Estudiantes).
    Maneja el ciclo CRUD completo de los alumnos (GET, POST, PUT, PATCH, DELETE).
    Valida que 'first_name' y 'last_name' sean textos válidos respetando max_length=100.
    """
    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name']


class StudentCourseSerializer(serializers.ModelSerializer):
    """
    Serializador para la relación muchos a muchos intermedia StudentCourse (Inscripciones).
    
    1. En LECTURA (GET):
       Muestra la información detallada tanto del estudiante como del curso.
       
    2. En ESCRITURA (POST / PUT):
       Permite inscribir a un alumno en un curso enviando sus IDs numéricos:
       ejemplo: { "student_id": 1, "course_id": 2 }
       DRF valida automáticamente que ambos existan y respeta la restricción
       unique_together definida en el modelo (un alumno no puede inscribirse dos veces al mismo curso).
    """
    student = StudentSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        required=False
    )
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        source='course',
        required=False
    )

    class Meta:
        model = StudentCourse
        fields = ['id', 'student', 'course', 'student_id', 'course_id']