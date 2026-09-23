// ==============================================================================
// teachers.js - GESTIÓN ASÍNCRONA DE PROFESORES (CRUD CON FETCH API & DRF)
// ==============================================================================
// Administra las altas, bajas y modificaciones del cuerpo docente.
// Se comunica con el endpoint '/api/teachers/' de Django REST Framework.
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Referencias a elementos del DOM
    // --------------------------------------------------------------------------
    const loading = document.getElementById('teachers-loading');
    const table = document.getElementById('teachers-table');
    const tbody = document.getElementById('teachers-tbody');
    const errorBox = document.getElementById('teachers-error');
    const emptyBox = document.getElementById('teachers-empty');
    const counterBadge = document.getElementById('teachers-counter');

    // Modales y Formularios de Bootstrap
    const teacherModalEl = document.getElementById('teacherModal');
    const teacherModal = bootstrap.Modal.getOrCreateInstance(teacherModalEl);
    const teacherForm = document.getElementById('teacher-form');
    const teacherModalLabel = document.getElementById('teacherModalLabel');
    const inputId = document.getElementById('teacher-id');
    const inputFirstName = document.getElementById('teacher-first-name');
    const inputLastName = document.getElementById('teacher-last-name');
    const btnSaveTeacher = document.getElementById('btn-save-teacher');
    const saveSpinner = document.getElementById('teacher-save-spinner');
    const saveBtnText = document.getElementById('teacher-save-btn-text');
    const modalErrorAlert = document.getElementById('teacher-modal-error-alert');
    const modalErrorMessage = document.getElementById('teacher-modal-error-message');

    // Modal de Eliminación (DELETE)
    const deleteModalEl = document.getElementById('deleteTeacherConfirmModal');
    const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
    const deleteTeacherName = document.getElementById('delete-teacher-name');
    const deleteTeacherId = document.getElementById('delete-teacher-id');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-teacher');
    const deleteSpinner = document.getElementById('teacher-delete-spinner');

    // Botones para crear un nuevo profesor
    const btnNewTeacher = document.getElementById('btn-new-teacher');
    const btnEmptyNewTeacher = document.getElementById('btn-empty-new-teacher');

    // Memoria local sincronizada con la API
    let cachedTeachers = [];

    // ==========================================================================
    // 1. OBTENER Y LISTAR PROFESORES (GET /api/teachers/)
    // ==========================================================================
    async function loadTeachers() {
        loading.classList.remove('d-none');
        table.classList.add('d-none');
        emptyBox.classList.add('d-none');
        errorBox.classList.add('d-none');

        try {
            const response = await fetch('/api/teachers/');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            cachedTeachers = Array.isArray(data) ? data : [];
            tbody.innerHTML = '';

            // Actualizar contador
            if (counterBadge) {
                counterBadge.innerHTML = `<i class="bi bi-person-workspace me-1"></i> Total: ${cachedTeachers.length} ${cachedTeachers.length === 1 ? 'profesor' : 'profesores'}`;
            }

            if (cachedTeachers.length === 0) {
                loading.classList.add('d-none');
                emptyBox.classList.remove('d-none');
                return;
            }

            // Construir filas de la tabla
            cachedTeachers.forEach((teacher) => {
                const row = document.createElement('tr');
                row.id = `teacher-row-${teacher.id}`;
                row.innerHTML = `
                    <td class="text-center fw-bold text-muted">${teacher.id}</td>
                    <td class="fw-semibold text-dark">${escapeHtml(teacher.first_name)}</td>
                    <td class="text-dark">${escapeHtml(teacher.last_name)}</td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary btn-edit"
                                data-id="${teacher.id}"
                                title="Editar profesor">
                                <i class="bi bi-pencil-square me-1"></i> Editar
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-delete"
                                data-id="${teacher.id}"
                                title="Eliminar profesor">
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
            console.error('Error al obtener lista de profesores:', err);
            loading.classList.add('d-none');
            errorBox.classList.remove('d-none');
        }
    }

    // ==========================================================================
    // 2. PREPARAR MODAL PARA CREACIÓN (POST)
    // ==========================================================================
    function openCreateModal() {
        teacherForm.reset();
        teacherForm.classList.remove('was-validated');
        modalErrorAlert.classList.add('d-none');

        inputId.value = '';
        teacherModalLabel.innerHTML = '<i class="bi bi-person-plus text-primary me-2"></i>Nuevo Profesor';
        saveBtnText.textContent = 'Guardar Profesor';

        teacherModal.show();
        setTimeout(() => inputFirstName.focus(), 300);
    }

    if (btnNewTeacher) btnNewTeacher.addEventListener('click', openCreateModal);
    if (btnEmptyNewTeacher) btnEmptyNewTeacher.addEventListener('click', openCreateModal);

    // ==========================================================================
    // 3. DELEGACIÓN DE EVENTOS: EDITAR (PUT) Y ELIMINAR (DELETE)
    // ==========================================================================
    tbody.addEventListener('click', (e) => {
        // --- CASO: BOTÓN EDITAR ---
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const teacher = cachedTeachers.find(t => String(t.id) === String(id));

            teacherForm.reset();
            teacherForm.classList.remove('was-validated');
            modalErrorAlert.classList.add('d-none');

            // Cargar datos en el formulario
            inputId.value = id;
            inputFirstName.value = teacher ? teacher.first_name : '';
            inputLastName.value = teacher ? teacher.last_name : '';

            teacherModalLabel.innerHTML = `<i class="bi bi-pencil-square text-primary me-2"></i>Editar Profesor #${id}`;
            saveBtnText.textContent = 'Actualizar Profesor';

            teacherModal.show();
            setTimeout(() => inputFirstName.focus(), 300);
            return;
        }

        // --- CASO: BOTÓN ELIMINAR ---
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const teacher = cachedTeachers.find(t => String(t.id) === String(id));
            const name = teacher ? `${teacher.first_name} ${teacher.last_name}` : `Profesor #${id}`;

            deleteTeacherId.value = id;
            deleteTeacherName.textContent = `${name} (ID: ${id})`;
            deleteModal.show();
        }
    });

    // ==========================================================================
    // 4. ENVÍO DEL FORMULARIO: CREAR (POST) O ACTUALIZAR (PUT)
    // ==========================================================================
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!teacherForm.checkValidity()) {
            teacherForm.classList.add('was-validated');
            return;
        }

        const id = inputId.value.trim();
        const firstName = inputFirstName.value.trim();
        const lastName = inputLastName.value.trim();

        const isEditing = Boolean(id);
        const url = isEditing ? `/api/teachers/${id}/` : '/api/teachers/';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            first_name: firstName,
            last_name: lastName
        };

        btnSaveTeacher.disabled = true;
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
            teacherModal.hide();

            // Mensajes Toast exactos requeridos
            const successMsg = isEditing
                ? 'Profesor actualizado correctamente'
                : 'Profesor creado correctamente';

            showNotification(successMsg, 'success');

            // Volver a consultar la API para actualizar la información mostrada
            await loadTeachers();
        } catch (err) {
            console.error('Error al guardar profesor:', err);
            modalErrorMessage.textContent = err.message || 'Error al guardar los datos del profesor.';
            modalErrorAlert.classList.remove('d-none');
        } finally {
            btnSaveTeacher.disabled = false;
            saveSpinner.classList.add('d-none');
        }
    });

    // ==========================================================================
    // 5. CONFIRMAR Y EJECUTAR ELIMINACIÓN (DELETE /api/teachers/<id>/)
    // ==========================================================================
    btnConfirmDelete.addEventListener('click', async () => {
        const id = deleteTeacherId.value;
        if (!id) return;

        btnConfirmDelete.disabled = true;
        deleteSpinner.classList.remove('d-none');

        try {
            const response = await fetch(`/api/teachers/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => ({}));
                const msg = formatApiErrors(errorData) || `No se pudo eliminar el profesor (Código HTTP ${response.status})`;
                throw new Error(msg);
            }

            deleteModal.hide();
            // Notificación Toast de éxito
            showNotification('Profesor eliminado correctamente', 'success');

            // Volver a consultar la API para actualizar la tabla
            await loadTeachers();
        } catch (err) {
            console.error('Error al eliminar profesor:', err);
            deleteModal.hide();
            showNotification(err.message || 'Ocurrió un error al intentar eliminar el profesor.', 'danger');
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

    // Inicializar la carga de datos al abrir la página
    loadTeachers();
});
