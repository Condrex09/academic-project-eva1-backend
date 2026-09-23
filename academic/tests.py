from django.test import TestCase, Client
from rest_framework import status
from rest_framework.test import APIClient
from .models import Teacher, Course, Student, StudentCourse


class AcademicCRUDTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.api_client = APIClient()

        # Docentes iniciales de prueba
        self.teacher = Teacher.objects.create(
            first_name='Marcelo',
            last_name='Alvarado'
        )
        self.teacher_2 = Teacher.objects.create(
            first_name='Claudia',
            last_name='Soto'
        )

        # Estudiantes iniciales de prueba
        self.student = Student.objects.create(
            first_name='Benjamin',
            last_name='Gomez'
        )
        self.student_2 = Student.objects.create(
            first_name='Camila',
            last_name='Rojas'
        )

        # Cursos iniciales de prueba
        self.course = Course.objects.create(
            name='Desarrollo Backend',
            teacher=self.teacher
        )
        self.course_2 = Course.objects.create(
            name='Bases de Datos',
            teacher=self.teacher_2
        )

        # Inscripción inicial
        self.student_course = StudentCourse.objects.create(
            student=self.student,
            course=self.course
        )

    # -------------------------------------------------------------
    # 1. CRUD PROFESORES / DOCENTES (Teacher)
    # -------------------------------------------------------------
    def test_teacher_list(self):
        response = self.api_client.get('/api/teachers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_teacher_create(self):
        payload = {'first_name': 'Roberto', 'last_name': 'Perez'}
        response = self.api_client.post('/api/teachers/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], 'Roberto')
        self.assertTrue(Teacher.objects.filter(first_name='Roberto', last_name='Perez').exists())

    def test_teacher_retrieve(self):
        response = self.api_client.get(f'/api/teachers/{self.teacher.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Marcelo')

    def test_teacher_update_put(self):
        payload = {'first_name': 'Marcelo Antonio', 'last_name': 'Alvarado Diaz'}
        response = self.api_client.put(f'/api/teachers/{self.teacher.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.first_name, 'Marcelo Antonio')

    def test_teacher_patch(self):
        payload = {'first_name': 'Marcelo Actualizado'}
        response = self.api_client.patch(f'/api/teachers/{self.teacher.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher.refresh_from_db()
        self.assertEqual(self.teacher.first_name, 'Marcelo Actualizado')

    def test_teacher_delete(self):
        teacher_to_delete = Teacher.objects.create(first_name='Temporal', last_name='Docente')
        response = self.api_client.delete(f'/api/teachers/{teacher_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Teacher.objects.filter(id=teacher_to_delete.id).exists())

    # -------------------------------------------------------------
    # 2. CRUD ESTUDIANTES (Student)
    # -------------------------------------------------------------
    def test_student_list(self):
        response = self.api_client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_student_create(self):
        payload = {'first_name': 'Ana', 'last_name': 'Torres'}
        response = self.api_client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], 'Ana')
        self.assertTrue(Student.objects.filter(first_name='Ana', last_name='Torres').exists())

    def test_student_retrieve(self):
        response = self.api_client.get(f'/api/students/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Benjamin')

    def test_student_update_put(self):
        payload = {'first_name': 'Benjamin Modificado', 'last_name': 'Gomez Actualizado'}
        response = self.api_client.put(f'/api/students/{self.student.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Benjamin Modificado')

    def test_student_delete(self):
        student_to_delete = Student.objects.create(first_name='Temp', last_name='Alumno')
        response = self.api_client.delete(f'/api/students/{student_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(id=student_to_delete.id).exists())

    # -------------------------------------------------------------
    # 3. CRUD CURSOS (Course)
    # -------------------------------------------------------------
    def test_course_list(self):
        response = self.api_client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_course_create(self):
        payload = {'name': 'Inteligencia Artificial', 'teacher_id': self.teacher.id}
        response = self.api_client.post('/api/courses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Inteligencia Artificial')
        self.assertTrue(Course.objects.filter(name='Inteligencia Artificial').exists())

    def test_course_retrieve(self):
        response = self.api_client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Desarrollo Backend')
        self.assertIn('teacher', response.data)

    def test_course_update_put(self):
        payload = {'name': 'Desarrollo Backend Avanzado', 'teacher_id': self.teacher_2.id}
        response = self.api_client.put(f'/api/courses/{self.course.id}/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, 'Desarrollo Backend Avanzado')
        self.assertEqual(self.course.teacher.id, self.teacher_2.id)

    def test_course_delete(self):
        course_to_delete = Course.objects.create(name='Curso Temp', teacher=self.teacher)
        response = self.api_client.delete(f'/api/courses/{course_to_delete.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Course.objects.filter(id=course_to_delete.id).exists())

    # -------------------------------------------------------------
    # 4. CRUD INSCRIPCIONES (StudentCourse)
    # -------------------------------------------------------------
    def test_student_course_list(self):
        response = self.api_client.get('/api/student-courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_student_course_create(self):
        payload = {'student_id': self.student_2.id, 'course_id': self.course_2.id}
        response = self.api_client.post('/api/student-courses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(StudentCourse.objects.filter(student=self.student_2, course=self.course_2).exists())

    def test_student_course_delete(self):
        sc_id = self.student_course.id
        response = self.api_client.delete(f'/api/student-courses/{sc_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StudentCourse.objects.filter(id=sc_id).exists())

    # -------------------------------------------------------------
    # 5. VISTAS WEB Y FALLBACK 404
    # -------------------------------------------------------------
    def test_home_view(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'academic/home.html')

    def test_students_view(self):
        response = self.client.get('/students/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'academic/students.html')

    def test_courses_view(self):
        response = self.client.get('/courses/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'academic/courses.html')

    def test_teachers_view(self):
        response = self.client.get('/teachers/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'academic/teachers.html')

    def test_fallback_redirects_to_home(self):
        response = self.client.get('/ruta-inexistente-12345/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/')
