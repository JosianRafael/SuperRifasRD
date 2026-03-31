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
        
        let foundTickets = [];
        let userInfoData = null;
        
        // Determinar si es número de boleto o teléfono
        if (searchValue.match(/^\d+$/)) {
            // Si es solo números y tiene menos de 8 dígitos, es probable que sea un número de boleto
            if (searchValue.length <= 7) {
                query = query.eq('ticket_number', parseInt(searchValue));
                const { data: tickets, error } = await query;
                if (error) throw error;
                foundTickets = tickets;
                if (foundTickets.length > 0) userInfoData = foundTickets[0];
            } else {
                // Si tiene más de 7 dígitos, buscar por teléfono sin importar el código de país
                const { data: ticketsByPhone, error: phoneError } = await supabaseClient
                    .from('tickets')
                    .select('*')
                    .eq('raffle_id', currentRaffle.id);
                
                if (phoneError) throw phoneError;
                
                // Filtrar los tickets donde el user_phone termine con el número buscado
                const filteredTickets = ticketsByPhone.filter(ticket => {
                    const phone = ticket.user_phone;
                    const cleanPhone = phone.replace(/^\+/, '').replace(/^\d+\s?/, '');
                    return phone.endsWith(searchValue) || cleanPhone === searchValue;
                });
                
                foundTickets = filteredTickets;
                if (foundTickets.length > 0) userInfoData = foundTickets[0];
            }
        } else {
            // Si no son solo números, buscar por teléfono
            query = query.eq('user_phone', searchValue);
            const { data: tickets, error } = await query;
            if (error) throw error;
            foundTickets = tickets;
            if (foundTickets.length > 0) userInfoData = foundTickets[0];
        }
        
        if (foundTickets && foundTickets.length > 0) {
            const statusColors = { 'pending': '#ff9800', 'confirmed': '#1c8200', 'cancelled': '#dc3545' };
            
            searchResultInfo.style.display = 'block';
            searchResultInfo.innerHTML = `
                <p><strong><i class="fa fa-user"></i> ${escapeHtml(userInfoData.user_name)}</strong></p>
                <p><i class="fa fa-phone"></i> ${escapeHtml(userInfoData.user_phone)}</p>
                <p><i class="fa fa-calendar"></i> Fecha: ${new Date(userInfoData.purchase_date).toLocaleDateString()}</p>
                <p><i class="fa fa-tag"></i> Estado: <span style="color: ${statusColors[userInfoData.status]}">${userInfoData.status === 'pending' ? 'Pendiente' : userInfoData.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></p>
                <p><i class="fa fa-ticket"></i> ${foundTickets.length} boleto(s)</p>
                <div class="print-all-container">
                    <button class="btn-print-all" onclick="printAllTickets(${JSON.stringify(foundTickets).replace(/"/g, '&quot;')}, '${escapeHtml(currentRaffle.name)}', '${currentRaffle.image_url || ''}')">
                        <i class="fa fa-print"></i> Imprimir Todos (${foundTickets.length} boletos)
                    </button>
                </div>
            `;
            
            // Generar cards con imagen de la rifa de fondo
            let html = '<div class="tickets-cards-grid">';
            foundTickets.forEach(ticket => {
                const statusText = ticket.status === 'pending' ? 'Pendiente' : ticket.status === 'confirmed' ? 'Verificado' : 'Anulado';
                const statusClass = ticket.status === 'pending' ? 'status-pending' : ticket.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
                const purchaseDate = new Date(ticket.purchase_date).toLocaleString();
                
                html += `
                    <div class="ticket-card" style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${currentRaffle.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}'); background-size: cover; background-position: center;">
                        <div class="ticket-card-header">
                            <span class="ticket-card-badge ${statusClass}">${statusText}</span>
                            <span class="ticket-card-date"><i class="fa fa-calendar"></i> ${purchaseDate}</span>
                        </div>
                        <div class="ticket-card-number">
                            <span class="ticket-number-label">NÚMERO DE BOLETO</span>
                            <span class="ticket-number-value">${ticket.ticket_number.toString().padStart(4, '0')}</span>
                        </div>
                        <div class="ticket-card-user">
                            <div class="user-info-row">
                                <i class="fa fa-user-circle"></i>
                                <span>${escapeHtml(ticket.user_name)}</span>
                            </div>
                            <div class="user-info-row">
                                <i class="fa fa-phone"></i>
                                <span>${escapeHtml(ticket.user_phone)}</span>
                            </div>
                        </div>
                        <div class="ticket-card-footer">
                            <div class="raffle-name">${escapeHtml(currentRaffle.name)}</div>
                            <div class="ticket-card-actions">
                                <button class="btn-print-ticket-card" onclick="printTicketModal('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')">
                                    <i class="fa fa-print"></i> Imprimir
                                </button>
                                <button class="btn-download-ticket-card" onclick="downloadTicketAsPNG('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')">
                                    <i class="fa fa-download"></i> PNG
                                </button>
                            </div>
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

// ==================== IMPRIMIR TODOS LOS BOLETOS EN UN SOLO TICKET ====================
function printAllTickets(tickets, raffleName, raffleImageUrl) {
    if (!tickets || tickets.length === 0) {
        Swal.fire('Sin boletos', 'No hay boletos para imprimir', 'warning');
        return;
    }
    
    // Ordenar los boletos por número
    const sortedTickets = [...tickets].sort((a, b) => a.ticket_number - b.ticket_number);
    
    // Crear la lista de números de boletos - sin scroll, mostrar todos
    let ticketNumbersList = '';
    sortedTickets.forEach((ticket) => {
        const ticketNumber = ticket.ticket_number.toString().padStart(4, '0');
        ticketNumbersList += `
            <div class="ticket-number-item">
                <span class="ticket-number-badge">🎫 ${ticketNumber}</span>
            </div>
        `;
    });
    
    const statusText = tickets[0].status === 'pending' ? 'PENDIENTE' : tickets[0].status === 'confirmed' ? 'VERIFICADO' : 'ANULADO';
    const statusClass = tickets[0].status === 'pending' ? 'status-pending' : tickets[0].status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
    const purchaseDate = new Date(tickets[0].purchase_date).toLocaleString();
    const totalAmount = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
    
    const allTicketsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Boletos - ${raffleName}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Courier New', monospace;
                    background: white;
                    padding: 20px;
                }
                
                .ticket-print {
                    width: 100%;
                    max-width: 800px;
                    background: white;
                    border: 2px solid #000;
                    padding: 20px;
                    margin: 0 auto;
                    position: relative;
                }
                
                .ticket-print.has-bg {
                    background-size: cover;
                    background-position: center;
                }
                
                .ticket-print.has-bg .ticket-content {
                    background: rgba(0,0,0,0.75);
                    padding: 15px;
                    border-radius: 8px;
                    color: white;
                }
                
                .ticket-print.has-bg .ticket-number-item {
                    border-color: rgba(255,255,255,0.3);
                    background: rgba(255,255,255,0.15);
                }
                
                .center {
                    text-align: center;
                }
                
                .bold {
                    font-weight: bold;
                }
                
                .separator {
                    border-top: 1px dashed #000;
                    margin: 12px 0;
                }
                
                .ticket-print.has-bg .separator {
                    border-top-color: rgba(255,255,255,0.3);
                }
                
                .ticket-numbers-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin: 15px 0;
                }
                
                .ticket-number-item {
                    background: #f5f5f5;
                    padding: 6px 10px;
                    border-radius: 6px;
                    text-align: center;
                    border: 1px solid #ddd;
                }
                
                .ticket-print.has-bg .ticket-number-item {
                    background: rgba(255,255,255,0.2);
                    border-color: rgba(255,255,255,0.3);
                }
                
                .ticket-number-badge {
                    font-size: 12px;
                    font-weight: bold;
                    font-family: monospace;
                    letter-spacing: 1px;
                }
                
                .logo-img {
                    max-width: 80px;
                    margin: 0 auto 10px;
                    display: block;
                    border-radius: 50%;
                }
                
                .small {
                    font-size: 10px;
                }
                
                .info-line {
                    display: flex;
                    justify-content: space-between;
                    margin: 8px 0;
                    flex-wrap: wrap;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .status-pending {
                    background: #ff9800;
                    color: #fff;
                }
                
                .status-confirmed {
                    background: #1c8200;
                    color: #fff;
                }
                
                .status-cancelled {
                    background: #dc3545;
                    color: #fff;
                }
                
                .total-tickets {
                    background: #000;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    margin: 12px 0;
                    font-size: 18px;
                    font-weight: bold;
                }
                
                .ticket-print.has-bg .total-tickets {
                    background: rgba(0,0,0,0.9);
                }
                
                @media print {
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    .no-print {
                        display: none;
                    }
                    .ticket-print {
                        margin: 0;
                        page-break-after: avoid;
                        page-break-inside: avoid;
                    }
                    .ticket-numbers-grid {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
                
                @media (max-width: 600px) {
                    .ticket-numbers-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: center; margin-bottom: 20px; padding: 10px; background: #f0f0f0; border-radius: 8px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #1c8200; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 10px;">
                    <i class="fa fa-print"></i> Imprimir Ticket
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fa fa-times"></i> Cerrar
                </button>
                <p style="margin-top: 10px;"><strong>Total de boletos: ${tickets.length}</strong> | Total pagado: RD$ ${totalAmount.toLocaleString('es-DO')}</p>
            </div>
            <div class="ticket-print ${raffleImageUrl ? 'has-bg' : ''}" ${raffleImageUrl ? `style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${raffleImageUrl}');"` : ''}>
                <div class="ticket-content">
                    <div class="center">
                        <img src="${document.getElementById('navbarLogo').src}" class="logo-img" onerror="this.style.display='none'">
                        <div class="bold" style="font-size:18px;">Super Rifas RD</div>
                    </div>
                    <div class="separator"></div>
                    <div class="center bold">${escapeHtml(raffleName)}</div>
                    <div class="separator"></div>
                    
                    <div class="info-line">
                        <span>PARTICIPANTE:</span>
                        <span class="bold">${escapeHtml(tickets[0].user_name).toUpperCase()}</span>
                    </div>
                    <div class="info-line">
                        <span>TELÉFONO:</span>
                        <span class="bold">${escapeHtml(tickets[0].user_phone)}</span>
                    </div>
                    <div class="info-line">
                        <span>FECHA:</span>
                        <span class="bold">${purchaseDate}</span>
                    </div>
                    <div class="info-line">
                        <span>ESTADO:</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="info-line">
                        <span>TOTAL BOLETOS:</span>
                        <span class="bold">${tickets.length}</span>
                    </div>
                    <div class="info-line">
                        <span>TOTAL PAGADO:</span>
                        <span class="bold">RD$ ${totalAmount.toLocaleString('es-DO')}</span>
                    </div>
                    
                    <div class="separator"></div>
                    <div class="center bold">LISTA DE BOLETOS (${tickets.length} boletos)</div>
                    
                    <div class="ticket-numbers-grid">
                        ${ticketNumbersList}
                    </div>
                    
                    <div class="total-tickets">
                        TOTAL: ${tickets.length} BOLETO(S)
                    </div>
                    
                    <div class="separator"></div>
                    <div class="center bold">SORTEO AL COMPLETAR EL 100%</div>
                    <div class="center small">¡ESTOS BOLETOS TE HACEN PARTICIPANTE!</div>
                    <div class="separator"></div>
                    <div class="center small">📱 WHATSAPP: +1 8295026484</div>
                    <div class="center small">📷 INSTAGRAM: Super Rifas RD</div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    // Abrir una nueva ventana con el ticket único
    const printWindow = window.open('', '_blank');
    printWindow.document.write(allTicketsHTML);
    printWindow.document.close();
    
    // Esperar a que cargue todo y mostrar diálogo de impresión
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
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