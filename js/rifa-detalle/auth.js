// ==================== LOGIN ====================
async function handleLogin(email, password) {
    showButtonLoading('loginBtn', 'Ingresando...');
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        Swal.fire('¡Bienvenido!', 'Has iniciado sesión como administrador', 'success');
        closeLoginModal();
        document.getElementById('statsButton').style.display = 'flex';
        document.getElementById('settingsButton').style.display = 'flex';
        document.getElementById('userIcon').style.color = '#dc3545';
        if (currentRaffle) loadAdminData();
    } catch (error) { console.error('Login error:', error); Swal.fire('Error', 'Credenciales incorrectas', 'error'); }
    finally { hideButtonLoading('loginBtn'); }
}

async function handleLogout() {
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        Swal.fire('Sesión cerrada', 'Has cerrado sesión correctamente', 'success');
        document.getElementById('statsButton').style.display = 'none';
        document.getElementById('settingsButton').style.display = 'none';
        document.getElementById('userIcon').style.color = '#1c8200';
        closeAdminPanel();
        if (currentRaffle) loadRaffle();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function openLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
}