// ==============================================================================
// courses.js - GESTIÓN ASÍNCRONA DE CURSOS (CRUD CON FETCH API & DRF)
// ==============================================================================
// Este script administra el catálogo de asignaturas vinculándolas a docentes.
// Realiza solicitudes asíncronas hacia '/api/courses/' y '/api/teachers/'.
// Los cambios se persisten directamente en la base de datos 'db.sqlite3'.
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Referencias a elementos del DOM
    // --------------------------------------------------------------------------
    const loading = document.getElementById('courses-loading');
    const table = document.getElementById('courses-table');
    const tbody = document.getElementById('courses-tbody');
    const errorBox = document.getElementById('courses-error');
    const emptyBox = document.getElementById('courses-empty');
    const counterBadge = document.getElementById('courses-counter');

    // Modales y Formularios de Bootstrap
    const courseModalEl = document.getElementById('courseModal');
    const courseModal = bootstrap.Modal.getOrCreateInstance(courseModalEl);
    const courseForm = document.getElementById('course-form');
    const courseModalLabel = document.getElementById('courseModalLabel');
    const inputId = document.getElementById('course-id');
    const inputName = document.getElementById('course-name');
    const selectTeacher = document.getElementById('course-teacher');
    const btnSaveCourse = document.getElementById('btn-save-course');
    const saveSpinner = document.getElementById('course-save-spinner');
    const saveBtnText = document.getElementById('course-save-btn-text');
    const modalErrorAlert = document.getElementById('course-modal-error-alert');
    const modalErrorMessage = document.getElementById('course-modal-error-message');

    // Modal para confirmación de eliminación (DELETE)
    const deleteModalEl = document.getElementById('deleteCourseConfirmModal');
    const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
    const deleteCourseName = document.getElementById('delete-course-name');
    const deleteCourseId = document.getElementById('delete-course-id');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-course');
    const deleteSpinner = document.getElementById('course-delete-spinner');

    // Botones para crear un nuevo curso
    const btnNewCourse = document.getElementById('btn-new-course');
    const btnEmptyNewCourse = document.getElementById('btn-empty-new-course');

    // Cachés locales sincronizadas para agilizar el llenado de modales
    let cachedTeachers = [];
    let cachedCourses = [];

    // ==========================================================================
    // 1. CARGA DEL CATÁLOGO DE DOCENTES (GET /api/teachers/)
    // ==========================================================================
    // Permite poblar dinámicamente las opciones del <select> de profesores
    async function loadTeachers() {
        try {
            const res = await fetch('/api/teachers/');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            cachedTeachers = await res.json();
            populateTeacherSelect();
        } catch (err) {
            console.error('Error al cargar catálogo de profesores:', err);
        }
    }

    function populateTeacherSelect(selectedId = '') {
        selectTeacher.innerHTML = '<option value="">-- Seleccionar Docente --</option>';
        cachedTeachers.forEach((teacher) => {
            const opt = document.createElement('option');
            opt.value = teacher.id;
            opt.textContent = `${teacher.first_name} ${teacher.last_name}`;
            if (String(teacher.id) === String(selectedId)) {
                opt.selected = true;
            }
            selectTeacher.appendChild(opt);
        });
        if (selectedId) {
            selectTeacher.value = String(selectedId);
        }
    }

    // ==========================================================================
    // 2. OBTENER Y LISTAR CURSOS (GET /api/courses/)
    // ==========================================================================
    async function loadCourses() {
        loading.classList.remove('d-none');
        table.classList.add('d-none');
        emptyBox.classList.add('d-none');
        errorBox.classList.add('d-none');

        try {
            const response = await fetch('/api/courses/');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            cachedCourses = Array.isArray(data) ? data : [];
            tbody.innerHTML = '';

            // Actualizar el contador superior
            if (counterBadge) {
                counterBadge.innerHTML = `<i class="bi bi-book-fill me-1"></i> Total: ${cachedCourses.length} ${cachedCourses.length === 1 ? 'curso' : 'cursos'}`;
            }

            if (cachedCourses.length === 0) {
                loading.classList.add('d-none');
                emptyBox.classList.remove('d-none');
                return;
            }

            // Construir las filas con el nombre de la materia y su docente
            cachedCourses.forEach((course) => {
                const teacherName = course.teacher
                    ? `${course.teacher.first_name} ${course.teacher.last_name}`
                    : 'Sin asignar';

                const row = document.createElement('tr');
                row.id = `course-row-${course.id}`;
                row.innerHTML = `
                    <td class="text-center fw-bold text-muted">${course.id}</td>
                    <td class="fw-semibold text-dark">${escapeHtml(course.name)}</td>
                    <td>
                        <span class="badge bg-light text-dark border px-2 py-1">
                            <i class="bi bi-person-badge text-primary me-1"></i>
                            ${escapeHtml(teacherName)}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary btn-edit"
                                data-id="${course.id}"
                                title="Editar curso">
                                <i class="bi bi-pencil-square me-1"></i> Editar
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-delete"
                                data-id="${course.id}"
                                title="Eliminar curso">
                                <i class="bi bi-trash3 me-1"></i> Eliminar
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            loading.classList.add('d-none');
            table.classList.remove('d-none');
        } catch (err) {
            console.error('Error al cargar cursos desde la API:', err);
            loading.classList.add('d-none');
            errorBox.classList.remove('d-none');
        }
    }

    // ==========================================================================
    // 3. PREPARAR MODAL PARA CREACIÓN (POST)
    // ==========================================================================
    function openCreateModal() {
        courseForm.reset();
        courseForm.classList.remove('was-validated');
        modalErrorAlert.classList.add('d-none');

        inputId.value = '';
        populateTeacherSelect('');
        courseModalLabel.innerHTML = '<i class="bi bi-journal-plus text-success me-2"></i>Nuevo Curso';
        saveBtnText.textContent = 'Guardar Curso';

        courseModal.show();
        setTimeout(() => inputName.focus(), 300);
    }

    if (btnNewCourse) btnNewCourse.addEventListener('click', openCreateModal);
    if (btnEmptyNewCourse) btnEmptyNewCourse.addEventListener('click', openCreateModal);

    // ==========================================================================
    // 4. DELEGACIÓN DE EVENTOS: EDITAR (PUT) Y ELIMINAR (DELETE)
    // ==========================================================================
    tbody.addEventListener('click', (e) => {
        // --- CASO: BOTÓN EDITAR ---
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const course = cachedCourses.find(c => String(c.id) === String(id));

            courseForm.reset();
            courseForm.classList.remove('was-validated');
            modalErrorAlert.classList.add('d-none');

            // Cargar el ID y nombre del curso
            inputId.value = id;
            inputName.value = course ? course.name : '';

            // Obtener el ID del profesor actual y seleccionarlo en el <select>
            const teacherId = course ? (course.teacher_id || (course.teacher ? course.teacher.id : '')) : '';
            populateTeacherSelect(teacherId);

            courseModalLabel.innerHTML = `<i class="bi bi-pencil-square text-success me-2"></i>Editar Curso #${id}`;
            saveBtnText.textContent = 'Actualizar Curso';

            courseModal.show();
            setTimeout(() => inputName.focus(), 300);
            return;
        }

        // --- CASO: BOTÓN ELIMINAR ---
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const course = cachedCourses.find(c => String(c.id) === String(id));
            const name = course ? course.name : `Curso #${id}`;

            deleteCourseId.value = id;
            deleteCourseName.textContent = `"${name}" (ID: ${id})`;
            deleteModal.show();
        }
    });

    // ==========================================================================
    // 5. ENVÍO DEL FORMULARIO: CREAR (POST) O ACTUALIZAR (PUT)
    // ==========================================================================
    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!courseForm.checkValidity()) {
            courseForm.classList.add('was-validated');
            return;
        }

        const id = inputId.value.trim();
        const name = inputName.value.trim();
        const teacherId = selectTeacher.value;

        // Si existe un ID es edición (PUT), si no es creación (POST)
        const isEditing = Boolean(id);
        const url = isEditing ? `/api/courses/${id}/` : '/api/courses/';
        const method = isEditing ? 'PUT' : 'POST';

        // Enviamos 'teacher_id' como entero que CourseSerializer asocia a la clave foránea
        const payload = {
            name: name,
            teacher_id: parseInt(teacherId, 10)
        };

        btnSaveCourse.disabled = true;
        saveSpinner.classList.remove('d-none');
        modalErrorAlert.classList.add('d-none');

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = formatApiErrors(errorData) || `Error en la solicitud (Código HTTP ${response.status})`;
                throw new Error(msg);
            }

            const data = await response.json();
            courseModal.hide();

            // Mensajes Toast exactos requeridos
            const successMsg = isEditing
                ? 'Curso actualizado correctamente'
                : 'Curso creado correctamente';

            showNotification(successMsg, 'success');

            // Volver a consultar la API para actualizar la información mostrada
            await loadCourses();
        } catch (err) {
            console.error('Error al guardar curso:', err);
            modalErrorMessage.textContent = err.message || 'Error al guardar los datos del curso.';
            modalErrorAlert.classList.remove('d-none');
        } finally {
            btnSaveCourse.disabled = false;
            saveSpinner.classList.add('d-none');
        }
    });

    // ==========================================================================
    // 6. CONFIRMAR Y EJECUTAR ELIMINACIÓN (DELETE /api/courses/<id>/)
    // ==========================================================================
    btnConfirmDelete.addEventListener('click', async () => {
        const id = deleteCourseId.value;
        if (!id) return;

        btnConfirmDelete.disabled = true;
        deleteSpinner.classList.remove('d-none');

        try {
            const response = await fetch(`/api/courses/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => ({}));
                const msg = formatApiErrors(errorData) || `No se pudo eliminar el curso (Código HTTP ${response.status})`;
                throw new Error(msg);
            }

            deleteModal.hide();
            // Notificación Toast de éxito
            showNotification('Curso eliminado correctamente', 'success');

            // Volver a consultar la API para actualizar la tabla
            await loadCourses();
        } catch (err) {
            console.error('Error al eliminar curso:', err);
            deleteModal.hide();
            showNotification(err.message || 'Ocurrió un error al intentar eliminar el curso.', 'danger');
        } finally {
            btnConfirmDelete.disabled = false;
            deleteSpinner.classList.add('d-none');
        }
    });

    // Helpers utilitarios
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    function formatApiErrors(data) {
        if (!data || typeof data !== 'object') return '';
        const messages = [];
        for (const [key, val] of Object.entries(data)) {
            const fieldText = key === 'non_field_errors' || key === 'detail' ? '' : `${key}: `;
            if (Array.isArray(val)) {
                messages.push(`${fieldText}${val.join(', ')}`);
            } else if (typeof val === 'string') {
                messages.push(`${fieldText}${val}`);
            }
        }
        return messages.join(' | ');
    }

    // Inicialización: primero carga profesores para tener el desplegable listo, luego lista cursos
    loadTeachers().then(() => {
        loadCourses();
    });
});