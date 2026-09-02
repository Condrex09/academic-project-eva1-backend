// students.js
// Consume de forma asíncrona el endpoint DRF /api/students/
// y renderiza dinámicamente la tabla de la vista students.html.

document.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('students-loading');
    const table = document.getElementById('students-table');
    const tbody = document.getElementById('students-tbody');
    const errorBox = document.getElementById('students-error');

    fetch('/api/students/')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            tbody.innerHTML = '';

            data.forEach((student) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.id}</td>
                    <td>${student.first_name}</td>
                    <td>${student.last_name}</td>
                `;
                tbody.appendChild(row);
            });

            loading.classList.add('d-none');
            table.classList.remove('d-none');
        })
        .catch((err) => {
            console.error('Error al cargar estudiantes:', err);
            loading.classList.add('d-none');
            errorBox.classList.remove('d-none');
        });
});