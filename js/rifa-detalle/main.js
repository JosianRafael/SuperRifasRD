// ==================== BUSCADOR PÚBLICO ====================
async function searchTickets() {
    const searchValue = document.getElementById('searchInput').value.trim();
    const searchResultInfo = document.getElementById('searchResultInfo');
    const container = document.getElementById('selectedNumbersList');
    
    if (!searchValue) {
        searchResultInfo.style.display = 'none';
        container.innerHTML = `<div class="assigned-placeholder"><i class="fa fa-magic"></i><p>Busca un boleto o teléfono para ver los boletos asignados</p></div>`;
        return;
    }
    
    showButtonLoading('btnSearch', 'Buscando...');
    
    try {
        let query = supabaseClient
            .from('tickets')
            .select('*')
            .eq('raffle_id', currentRaffle.id);
        
        if (searchValue.match(/^\d+$/)) {
            if (searchValue.length > 7) {
                query = query.eq('user_phone', searchValue);
            } else {
                query = query.eq('ticket_number', parseInt(searchValue));
            }
        } else {
            query = query.eq('user_phone', searchValue);
        }
        
        const { data: tickets, error } = await query;
        
        if (error) throw error;
        
        if (tickets && tickets.length > 0) {
            const userInfo = tickets[0];
            const statusColors = { 'pending': '#ff9800', 'confirmed': '#1c8200', 'cancelled': '#dc3545' };
            
            searchResultInfo.style.display = 'block';
            searchResultInfo.innerHTML = `
                <p><strong><i class="fa fa-user"></i> ${escapeHtml(userInfo.user_name)}</strong></p>
                <p><i class="fa fa-phone"></i> ${escapeHtml(userInfo.user_phone)}</p>
                <p><i class="fa fa-calendar"></i> Fecha: ${new Date(userInfo.purchase_date).toLocaleDateString()}</p>
                <p><i class="fa fa-tag"></i> Estado: <span style="color: ${statusColors[userInfo.status]}">${userInfo.status === 'pending' ? 'Pendiente' : userInfo.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></p>
                <p><i class="fa fa-ticket"></i> ${tickets.length} boleto(s)</p>
            `;
            
            let html = '<div class="tickets-badges-grid">';
            tickets.forEach(ticket => {
                html += `
                    <div class="ticket-item-wrapper">
                        <div class="ticket-badge-modern">🎫 ${ticket.ticket_number.toString().padStart(4, '0')}</div>
                        <div style="display: flex; gap: 6px;">
                            <button class="btn-print-ticket" onclick="printTicketModal('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')"><i class="fa fa-print"></i> Imprimir</button>
                            <button class="btn-download-ticket" onclick="downloadTicketAsPNG('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')"><i class="fa fa-download"></i> PNG</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            searchResultInfo.style.display = 'block';
            searchResultInfo.innerHTML = `<p><i class="fa fa-exclamation-circle"></i> <strong>No se encontraron resultados</strong></p>`;
            container.innerHTML = `<div class="assigned-placeholder"><i class="fa fa-search"></i><p>No se encontraron boletos para "${searchValue}"</p></div>`;
        }
    } catch (error) {
        console.error('Error searching tickets:', error);
        Swal.fire('Error', 'No se pudieron buscar los boletos', 'error');
    } finally {
        hideButtonLoading('btnSearch');
    }
}

// ==================== CONFIGURACIÓN ====================
async function saveConfig(event) {
    event.preventDefault();
    if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
    showButtonLoading('saveConfigBtn', 'Guardando...');
    const id = document.getElementById('configId').value;
    const site_name = document.getElementById('configSiteName').value;
    const location = document.getElementById('configLocation').value;
    const description = document.getElementById('configDescription').value;
    const ceo = document.getElementById('configCeo').value;
    const whatsapp = document.getElementById('configWhatsapp').value;
    const instagram_url = document.getElementById('configInstagram').value;
    const logoFile = document.getElementById('logoImageFile').files[0];
    let logo_url = document.getElementById('logoImagePreview').src;
    try {
        if (logoFile && logoFile.size > 0) {
            const fileExt = logoFile.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const { data, error } = await supabaseClient.storage.from('site-assets').upload(fileName, logoFile);
            if (!error) { const { data: urlData } = supabaseClient.storage.from('site-assets').getPublicUrl(fileName); logo_url = urlData.publicUrl; }
        }
        const configData = { site_name, location, description, ceo, whatsapp, instagram_url, logo_url, updated_at: new Date() };
        let error;
        if (id) { const { error: updateError } = await supabaseClient.from('site_config').update(configData).eq('id', id); error = updateError; }
        else { configData.created_at = new Date(); const { error: insertError } = await supabaseClient.from('site_config').insert([configData]); error = insertError; }
        if (error) throw error;
        Swal.fire('Guardado', 'Configuración guardada correctamente', 'success');
        closeConfigModal();
        loadConfig();
    } catch (error) { console.error('Error saving config:', error); Swal.fire('Error', 'No se pudo guardar la configuración', 'error'); }
    finally { hideButtonLoading('saveConfigBtn'); }
}

function openConfigModal() {
    if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
    const modal = document.getElementById('configModal');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
}

function closeConfigModal() {
    const modal = document.getElementById('configModal');
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.opacity = '0';
}

function closeModal() { const modal = document.getElementById('successModal'); modal.classList.remove('show'); }

// ==================== EVENT LISTENERS ====================
document.getElementById('btnMinus')?.addEventListener('click', () => updateQuantity(-1));
document.getElementById('btnPlus')?.addEventListener('click', () => updateQuantity(1));
document.getElementById('btnSearch')?.addEventListener('click', searchTickets);
document.getElementById('btnConfirm')?.addEventListener('click', confirmPurchase);
document.getElementById('searchInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchTickets(); });
document.getElementById('voucherFile')?.addEventListener('change', handleVoucherFileSelect);
document.getElementById('configForm')?.addEventListener('submit', saveConfig);
document.getElementById('userIcon')?.addEventListener('click', () => {
    if (currentUser) {
        handleLogout();
    } else {
        openLoginModal();
    }
});
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    handleLogin(email, password);
});

document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
});

$(window).scroll(function() { if ($(this).scrollTop() > 20) $('#navbar').addClass('header-scrolled'); else $('#navbar').removeClass('header-scrolled'); });
$("#navbarNav").on("click", "a", function() { $(".navbar-toggler").click(); });
$(".nav-item").on("click", "a", function() { $("#navbarNav").removeClass('show'); });

async function init() {
    await loadConfig();
    await loadPaymentMethods();
    await loadRaffle();
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            currentUser = session.user;
            document.getElementById('statsButton').style.display = 'flex';
            document.getElementById('settingsButton').style.display = 'flex';
            document.getElementById('userIcon').style.color = '#dc3545';
            loadAdminData();
        } else {
            document.getElementById('statsButton').style.display = 'none';
            document.getElementById('settingsButton').style.display = 'none';
        }
    });
}
init();