// ==================== PANEL DE ADMINISTRACIÓN ====================
async function loadAdminData() {
    if (!currentUser) return;
    
    try {
        const { data: tickets, error } = await supabaseClient
            .from('tickets')
            .select('*')
            .eq('raffle_id', currentRaffle.id)
            .order('purchase_date', { ascending: false });
        
        if (error) throw error;
        
        allTickets = tickets;
        
        const confirmedTickets = tickets.filter(t => t.status === 'confirmed');
        const pendingVouchers = tickets.filter(t => t.status === 'pending');
        const totalCollected = confirmedTickets.reduce((sum, t) => sum + (t.price || 0), 0);
        const percent = currentRaffle.total_tickets > 0 ? (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1) : 0;
        
        document.getElementById('statTotalCollected').textContent = `RD$ ${totalCollected.toLocaleString('es-DO')}`;
        document.getElementById('statTicketsSold').textContent = confirmedTickets.length;
        document.getElementById('statPercentage').textContent = percent + '%';
        document.getElementById('statPendingVouchers').textContent = pendingVouchers.length;
        
        const recentTickets = tickets.slice(0, 10);
        renderRecentTickets(recentTickets);
        renderPendingVouchers(pendingVouchers);
        renderAdminTickets(tickets);
        
        const usersMap = new Map();
        tickets.forEach(t => {
            if (!usersMap.has(t.user_phone)) {
                usersMap.set(t.user_phone, {
                    user_name: t.user_name,
                    user_phone: t.user_phone,
                    tickets: [],
                    total_paid: 0
                });
            }
            const user = usersMap.get(t.user_phone);
            user.tickets.push(t);
            if (t.status === 'confirmed') user.total_paid += (t.price || 0);
        });
        allUsers = Array.from(usersMap.values());
        renderUsersTable(allUsers);
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

function renderRecentTickets(tickets) {
    const container = document.getElementById('recentTicketsTable');
    if (!container) return;
    if (tickets.length === 0) { container.innerHTML = '<p>No hay boletos registrados</p>'; return; }
    container.innerHTML = `<table class="admin-table"><thead><tr><th>Boleto</th><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${tickets.map(t => `<tr><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${new Date(t.purchase_date).toLocaleDateString()}</td><td><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></td></tr>`).join('')}</tbody></table>`;
}

function renderPendingVouchers(vouchers) {
    const container = document.getElementById('pendingVouchersTable');
    if (!container) return;
    if (vouchers.length === 0) { container.innerHTML = '<p>No hay comprobantes pendientes</p>'; return; }
    container.innerHTML = `<table class="admin-table"><thead><tr><th>Comprobante</th><th>Cliente</th><th>Teléfono</th><th>Boletos</th><th>Total</th><th>Acciones</th></tr></thead><tbody>${vouchers.map(t => `<tr><td><img src="${t.voucher_url}" class="voucher-preview" onclick="window.open('${t.voucher_url}', '_blank')" style="cursor:pointer;"></td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>RD$ ${(t.price || 0).toLocaleString('es-DO')}</td><td class="action-buttons"><button class="action-btn approve" onclick="approveTicket('${t.id}')">Aprobar</button><button class="action-btn reject" onclick="rejectTicket('${t.id}')">Rechazar</button><button class="action-btn delete" onclick="deleteTicket('${t.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
}

function renderAdminTickets(tickets) {
    const container = document.getElementById('adminTicketsTable');
    if (!container) return;
    if (tickets.length === 0) { container.innerHTML = '<p>No hay boletos registrados</p>'; return; }
    container.innerHTML = `<table class="admin-table"><thead><tr><th>Boleto</th><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${tickets.map(t => `<tr><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${new Date(t.purchase_date).toLocaleDateString()}</td><td><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></td> <td class="action-buttons">${t.status === 'pending' ? `<button class="action-btn approve" onclick="approveTicket('${t.id}')">Aprobar</button><button class="action-btn reject" onclick="rejectTicket('${t.id}')">Rechazar</button>` : ''}<button class="action-btn reassign" onclick="reassignTicket('${t.id}')">Reasignar</button><button class="action-btn delete" onclick="deleteTicket('${t.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
}

function renderUsersTable(users) {
    const container = document.getElementById('usersTable');
    if (!container) return;
    if (users.length === 0) { container.innerHTML = '<p>No hay participantes</p>'; return; }
    container.innerHTML = `<table class="admin-table"><thead><tr><th>Nombre</th><th>Teléfono</th><th>Boletos</th><th>Total Pagado</th><th>Acciones</th></tr></thead><tbody>${users.map(user => `<tr><td>${escapeHtml(user.user_name)}</td><td>${escapeHtml(user.user_phone)}</td><td>${user.tickets.filter(t => t.status === 'confirmed').length} / ${user.tickets.length}</td><td>RD$ ${user.total_paid.toLocaleString('es-DO')}</td><td><button class="action-btn" onclick="viewUserTickets('${user.user_phone}')">Ver boletos</button></td></tr>`).join('')}</tbody></table>`;
}

function adminSearchTickets() {
    const searchValue = document.getElementById('adminSearchInput').value.trim();
    if (!searchValue) { renderAdminTickets(allTickets); return; }
    const filtered = allTickets.filter(t => t.user_phone.includes(searchValue) || t.ticket_number.toString().includes(searchValue) || t.user_name.toLowerCase().includes(searchValue.toLowerCase()));
    renderAdminTickets(filtered);
}

function searchUsers() {
    const searchValue = document.getElementById('userSearchInput').value.trim();
    if (!searchValue) { renderUsersTable(allUsers); return; }
    const filtered = allUsers.filter(u => u.user_phone.includes(searchValue) || u.user_name.toLowerCase().includes(searchValue.toLowerCase()));
    renderUsersTable(filtered);
}

function loadAllTickets() { renderAdminTickets(allTickets); document.getElementById('adminSearchInput').value = ''; }
function loadAllUsers() { renderUsersTable(allUsers); document.getElementById('userSearchInput').value = ''; }

async function getAvailableNumbers() {
    const { data: soldTickets, error } = await supabaseClient
        .from('tickets')
        .select('ticket_number')
        .eq('raffle_id', currentRaffle.id)
        .eq('status', 'confirmed');
    if (error) return [];
    const soldNumbers = new Set(soldTickets.map(t => t.ticket_number));
    const available = [];
    for (let i = 1; i <= currentRaffle.total_tickets; i++) if (!soldNumbers.has(i)) available.push(i);
    return available;
}

// Funciones de acción que cierran el panel antes de mostrar la modal
async function reassignTicket(ticketId) {
    closeAdminPanelForAction();
    const result = await Swal.fire({
        title: '¿Reasignar boleto?',
        text: 'Se le asignará un nuevo número de boleto automáticamente de los disponibles',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reasignar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        try {
            const availableNumbers = await getAvailableNumbers();
            if (availableNumbers.length === 0) { Swal.fire('Error', 'No hay números de boleto disponibles', 'error'); return; }
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            const newNumber = availableNumbers[randomIndex];
            const { error } = await supabaseClient
                .from('tickets')
                .update({ ticket_number: newNumber, updated_at: new Date() })
                .eq('id', ticketId);
            if (error) throw error;
            Swal.fire('Reasignado', `Boleto reasignado a ${newNumber.toString().padStart(4, '0')}`, 'success');
            await loadAdminData();
            await loadRaffle();
        } catch (error) {
            console.error('Error reassigning ticket:', error);
            Swal.fire('Error', 'No se pudo reasignar el boleto', 'error');
        }
    }
}

async function approveTicket(ticketId) {
    closeAdminPanelForAction();
    const result = await Swal.fire({
        title: '¿Aprobar compra?',
        text: 'Esta acción confirmará la compra y asignará los boletos',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        try {
            const { error } = await supabaseClient
                .from('tickets')
                .update({ status: 'confirmed', updated_at: new Date() })
                .eq('id', ticketId);
            if (error) throw error;
            const { data: confirmedTickets, error: countError } = await supabaseClient
                .from('tickets')
                .select('id')
                .eq('raffle_id', currentRaffle.id)
                .eq('status', 'confirmed');
            if (!countError) {
                await supabaseClient
                    .from('raffles')
                    .update({ sold_tickets: confirmedTickets.length })
                    .eq('id', currentRaffle.id);
                currentRaffle.sold_tickets = confirmedTickets.length;
                const percent = (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1);
                document.getElementById('progressFill').style.width = percent + '%';
                document.getElementById('progressPercentDisplay').textContent = percent + '%';
                document.getElementById('progressPercentage').textContent = percent + '%';
            }
            Swal.fire('Aprobado', 'La compra ha sido aprobada', 'success');
            await loadAdminData();
            await loadRaffle();
        } catch (error) {
            console.error('Error approving ticket:', error);
            Swal.fire('Error', 'No se pudo aprobar la compra', 'error');
        }
    }
}

async function rejectTicket(ticketId) {
    closeAdminPanelForAction();
    const result = await Swal.fire({
        title: '¿Rechazar compra?',
        text: 'Esta acción marcará la compra como rechazada',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, rechazar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        try {
            const { error } = await supabaseClient
                .from('tickets')
                .update({ status: 'cancelled', updated_at: new Date() })
                .eq('id', ticketId);
            if (error) throw error;
            Swal.fire('Rechazado', 'La compra ha sido rechazada', 'success');
            await loadAdminData();
            await loadRaffle();
        } catch (error) {
            console.error('Error rejecting ticket:', error);
            Swal.fire('Error', 'No se pudo rechazar la compra', 'error');
        }
    }
}

async function deleteTicket(ticketId) {
    closeAdminPanelForAction();
    const result = await Swal.fire({
        title: '¿Eliminar boleto?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
        try {
            const { error } = await supabaseClient
                .from('tickets')
                .delete()
                .eq('id', ticketId);
            if (error) throw error;
            const { data: confirmedTickets, error: countError } = await supabaseClient
                .from('tickets')
                .select('id')
                .eq('raffle_id', currentRaffle.id)
                .eq('status', 'confirmed');
            if (!countError) {
                await supabaseClient
                    .from('raffles')
                    .update({ sold_tickets: confirmedTickets.length })
                    .eq('id', currentRaffle.id);
                currentRaffle.sold_tickets = confirmedTickets.length;
                const percent = (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1);
                document.getElementById('progressFill').style.width = percent + '%';
                document.getElementById('progressPercentDisplay').textContent = percent + '%';
                document.getElementById('progressPercentage').textContent = percent + '%';
            }
            Swal.fire('Eliminado', 'El boleto ha sido eliminado', 'success');
            await loadAdminData();
            await loadRaffle();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            Swal.fire('Error', 'No se pudo eliminar el boleto', 'error');
        }
    }
}

function viewUserTickets(phone) {
    closeAdminPanelForAction();
    const userTickets = allTickets.filter(t => t.user_phone === phone);
    const user = allUsers.find(u => u.user_phone === phone);
    let html = `<h4>Boletos de ${escapeHtml(user?.user_name)} (${phone})</h4><div class="tickets-badges-grid">`;
    userTickets.forEach(t => { html += `<div class="ticket-item-wrapper"><div class="ticket-badge-modern">🎫 ${t.ticket_number.toString().padStart(4, '0')}</div><div><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></div></div>`; });
    html += '</div>';
    Swal.fire({ title: 'Boletos del usuario', html: html, confirmButtonText: 'Cerrar', confirmButtonColor: '#1c8200' });
}

function openAdminPanel() {
    if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
    document.getElementById('adminPanel').classList.add('show');
    loadAdminData();
}

function closeAdminPanel() { document.getElementById('adminPanel').classList.remove('show'); }