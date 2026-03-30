// ==================== FUNCIONES DE UTILIDAD ====================
function showButtonLoading(buttonId, loadingText = 'Procesando...') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const originalText = btn.innerHTML;
    btn.dataset.originalText = originalText;
    btn.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
    btn.disabled = true;
    btn.classList.add('btn-loading');
}

function hideButtonLoading(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
    btn.classList.remove('btn-loading');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    Swal.fire({
        icon: 'success',
        title: '¡Copiado!',
        text: 'La información ha sido copiada al portapapeles',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

// Función para cerrar el panel de admin antes de mostrar modales
function closeAdminPanelForAction() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel.classList.contains('show')) {
        adminPanel.classList.remove('show');
    }
}