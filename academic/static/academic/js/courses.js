// courses.js
// Consume de forma asíncrona el endpoint DRF /api/courses/
// y renderiza dinámicamente la tabla de la vista courses.html.

document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('courses-loading');
    const table = document.getElementById('courses-table');
    const tbody = document.getElementById('courses-tbody');
    const errorBox = document.getElementById('courses-error');

    fetch('/api/courses/')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            tbody.innerHTML = '';

            data.forEach((course) => {
                const teacherName = course.teacher
                    ? `${course.teacher.first_name} ${course.teacher.last_name}`
                    : 'Sin asignar';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${course.id}</td>
                    <td>${course.name}</td>
                    <td>${teacherName}</td>
                `;
                tbody.appendChild(row);
            });

            loading.classList.add('d-none');
            table.classList.remove('d-none');
        })
        .catch((err) => {
            console.error('Error al cargar cursos:', err);
            loading.classList.add('d-none');
            errorBox.classList.remove('d-none');
        });
});