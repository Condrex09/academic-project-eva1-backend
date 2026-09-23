// ==============================================================================
// students.js - GESTIÓN ASÍNCRONA DE ESTUDIANTES (CRUD CON FETCH API & DRF)
// ==============================================================================
// Este script se comunica asíncronamente con el endpoint '/api/students/'
// mediante solicitudes HTTP (GET, POST, PUT, DELETE).
// Todas las operaciones modifican directamente 'db.sqlite3' a través de Django.
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // Referencias a elementos del DOM (Document Object Model)
    // --------------------------------------------------------------------------
    const loading = document.getElementById('students-loading');
    const table = document.getElementById('students-table');
    const tbody = document.getElementById('students-tbody');
    const errorBox = document.getElementById('students-error');
    const emptyBox = document.getElementById('students-empty');
    const counterBadge = document.getElementById('students-counter');

    // Modales de Bootstrap e instancias interactivas
    const studentModalEl = document.getElementById('studentModal');
    const studentModal = bootstrap.Modal.getOrCreateInstance(studentModalEl);
    const studentForm = document.getElementById('student-form');
    const studentModalLabel = document.getElementById('studentModalLabel');
    const inputId = document.getElementById('student-id');
    const inputFirstName = document.getElementById('student-first-name');
    const inputLastName = document.getElementById('student-last-name');
    const btnSaveStudent = document.getElementById('btn-save-student');
    const saveSpinner = document.getElementById('save-spinner');
    const saveBtnText = document.getElementById('save-btn-text');
    const modalErrorAlert = document.getElementById('modal-error-alert');
    const modalErrorMessage = document.getElementById('modal-error-message');

    // Modal para confirmación de eliminación (DELETE)
    const deleteModalEl = document.getElementById('deleteConfirmModal');
    const deleteModal = bootstrap.Modal.getOrCreateInstance(deleteModalEl);
    const deleteStudentName = document.getElementById('delete-student-name');
    const deleteStudentId = document.getElementById('delete-student-id');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const deleteSpinner = document.getElementById('delete-spinner');

    // Botones para abrir el modal de nuevo estudiante
    const btnNewStudent = document.getElementById('btn-new-student');
    const btnEmptyNewStudent = document.getElementById('btn-empty-new-student');

    // Array en memoria que almacena la lista actual obtenida desde la API
    // Facilita la edición sin depender de atributos HTML escapados
    let cachedStudents = [];

    // ==========================================================================
    // 1. OBTENER Y LISTAR ESTUDIANTES (GET /api/students/)
    // ==========================================================================
    async function loadStudents() {
        // Mostrar spinner de carga y ocultar la tabla
        loading.classList.remove('d-none');
        table.classList.add('d-none');
        emptyBox.classList.add('d-none');
        errorBox.classList.add('d-none');

        try {
            // Petición GET a la API REST de Django
            const response = await fetch('/api/students/');
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            cachedStudents = Array.isArray(data) ? data : [];
            tbody.innerHTML = '';

            // Actualizar el contador superior
            if (counterBadge) {
                counterBadge.innerHTML = `<i class="bi bi-people-fill me-1"></i> Total: ${cachedStudents.length} ${cachedStudents.length === 1 ? 'estudiante' : 'estudiantes'}`;
            }

            // Si no hay registros, mostrar mensaje de estado vacío
            if (cachedStudents.length === 0) {
                loading.classList.add('d-none');
                emptyBox.classList.remove('d-none');
                return;
            }

            // Construir dinámicamente cada fila de la tabla
            cachedStudents.forEach((student) => {
                const row = document.createElement('tr');
                row.id = `student-row-${student.id}`;
                row.innerHTML = `
                    <td class="text-center fw-bold text-muted">${student.id}</td>
                    <td class="fw-semibold text-dark">${escapeHtml(student.first_name)}</td>
                    <td class="text-dark">${escapeHtml(student.last_name)}</td>
                    <td class="text-center">
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary btn-edit"
                                data-id="${student.id}"
                                title="Editar estudiante">
                                <i class="bi bi-pencil-square me-1"></i> Editar
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger btn-delete"
                                data-id="${student.id}"
                                title="Eliminar estudiante">
                                <i class="bi bi-trash3 me-1"></i> Eliminar
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Mostrar la tabla con los datos renderizados
            loading.classList.add('d-none');
            table.classList.remove('d-none');
        } catch (err) {
            console.error('Error al obtener lista de estudiantes:', err);
            loading.classList.add('d-none');
            errorBox.classList.remove('d-none');
        }
    }

    // ==========================================================================
    // 2. PREPARAR MODAL PARA CREACIÓN (POST)
    // ==========================================================================
    function openCreateModal() {
        // Limpiar el formulario y remover validaciones visuales previas
        studentForm.reset();
        studentForm.classList.remove('was-validated');
        modalErrorAlert.classList.add('d-none');

        // Un inputId vacío indica que la operación será CREAR (POST)
        inputId.value = '';
        studentModalLabel.innerHTML = '<i class="bi bi-person-plus text-primary me-2"></i>Nuevo Estudiante';
        saveBtnText.textContent = 'Guardar Estudiante';

        studentModal.show();
        setTimeout(() => inputFirstName.focus(), 300);
    }

    if (btnNewStudent) btnNewStudent.addEventListener('click', openCreateModal);
    if (btnEmptyNewStudent) btnEmptyNewStudent.addEventListener('click', openCreateModal);

    // ==========================================================================
    // 3. DELEGACIÓN DE EVENTOS: EDITAR (PUT) Y ELIMINAR (DELETE)
    // ==========================================================================
    tbody.addEventListener('click', (e) => {
        // --- CASO: BOTÓN EDITAR ---
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            // Buscar el objeto real en la memoria sincronizada con la base de datos
            const student = cachedStudents.find(s => String(s.id) === String(id));

            studentForm.reset();
            studentForm.classList.remove('was-validated');
            modalErrorAlert.classList.add('d-none');

            // Cargar los valores en los inputs del modal
            inputId.value = id;
            inputFirstName.value = student ? student.first_name : '';
            inputLastName.value = student ? student.last_name : '';

            studentModalLabel.innerHTML = `<i class="bi bi-pencil-square text-primary me-2"></i>Editar Estudiante #${id}`;
            saveBtnText.textContent = 'Actualizar Estudiante';

            studentModal.show();
            setTimeout(() => inputFirstName.focus(), 300);
            return;
        }

        // --- CASO: BOTÓN ELIMINAR ---
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const student = cachedStudents.find(s => String(s.id) === String(id));
            const name = student ? `${student.first_name} ${student.last_name}` : `Estudiante #${id}`;

            // Cargar datos en el modal de confirmación
            deleteStudentId.value = id;
            deleteStudentName.textContent = `${name} (ID: ${id})`;
            deleteModal.show();
        }
    });

    // ==========================================================================
    // 4. ENVÍO DEL FORMULARIO: CREAR (POST) O ACTUALIZAR (PUT)
    // ==========================================================================
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar que los campos obligatorios estén completos
        if (!studentForm.checkValidity()) {
            studentForm.classList.add('was-validated');
            return;
        }

        const id = inputId.value.trim();
        const firstName = inputFirstName.value.trim();
        const lastName = inputLastName.value.trim();

        // Si existe un ID, se realiza PUT a /api/students/<id>/; si no, POST a /api/students/
        const isEditing = Boolean(id);
        const url = isEditing ? `/api/students/${id}/` : '/api/students/';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            first_name: firstName,
            last_name: lastName
        };

        // Bloquear botón y mostrar spinner mientras la petición viaja al backend
        btnSaveStudent.disabled = true;
        saveSpinner.classList.remove('d-none');
        modalErrorAlert.classList.add('d-none');

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken() // Protección CSRF requerida por Django
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = formatApiErrors(errorData) || `Error en la solicitud (Código HTTP ${response.status})`;
                throw new Error(msg);
            }

            const data = await response.json();
            studentModal.hide();

            // Mensajes Toast exactos requeridos
            const successMsg = isEditing
                ? 'Estudiante actualizado correctamente'
                : 'Estudiante creado correctamente';

            showNotification(successMsg, 'success');

            // Re-consultar la API para sincronizar la tabla con la base de datos real
            await loadStudents();
        } catch (err) {
            console.error('Error al guardar estudiante:', err);
            modalErrorMessage.textContent = err.message || 'Error al guardar los datos del estudiante.';
            modalErrorAlert.classList.remove('d-none');
        } finally {
            btnSaveStudent.disabled = false;
            saveSpinner.classList.add('d-none');
        }
    });

    // ==========================================================================
    // 5. CONFIRMAR Y EJECUTAR ELIMINACIÓN (DELETE /api/students/<id>/)
    // ==========================================================================
    btnConfirmDelete.addEventListener('click', async () => {
        const id = deleteStudentId.value;
        if (!id) return;

        btnConfirmDelete.disabled = true;
        deleteSpinner.classList.remove('d-none');

        try {
            // Petición DELETE enviando el encabezado X-CSRFToken
            const response = await fetch(`/api/students/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            // DRF responde HTTP 204 No Content cuando la eliminación es exitosa
            if (!response.ok && response.status !== 204) {
                const errorData = await response.json().catch(() => ({}));
                const msg = formatApiErrors(errorData) || `No se pudo eliminar el estudiante (Código HTTP ${response.status})`;
                throw new Error(msg);
            }

            deleteModal.hide();
            // Notificación Toast de éxito
            showNotification('Estudiante eliminado correctamente', 'success');

            // Volver a consultar la API para reflejar la eliminación de inmediato
            await loadStudents();
        } catch (err) {
            console.error('Error al eliminar estudiante:', err);
            deleteModal.hide();
            showNotification(err.message || 'Ocurrió un error al intentar eliminar el estudiante.', 'danger');
        } finally {
            btnConfirmDelete.disabled = false;
            deleteSpinner.classList.add('d-none');
        }
    });

    // ==========================================================================
    // Funciones de Apoyo (Escape XSS y formateo de errores DRF)
    // ==========================================================================
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
    loadStudents();
});