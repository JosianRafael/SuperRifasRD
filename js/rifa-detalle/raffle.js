// ==================== CARGA DE RIFA ====================
async function loadRaffle() {
    if (!raffleId) {
        Swal.fire('Error', 'No se especificó la rifa', 'error').then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('raffles')
            .select('*')
            .eq('id', raffleId)
            .single();
        
        if (error) throw error;
        
        currentRaffle = data;
        maxPerPerson = currentRaffle.max_per_person || 100;
        minPerPerson = currentRaffle.min_per_person || 1;
        
        document.getElementById('maxPerPersonValue').textContent = maxPerPerson;
        document.getElementById('minPerPersonValue').textContent = minPerPerson;
        
        // Configurar el contador con el valor mínimo
        currentQuantity = minPerPerson;
        document.getElementById('ticketQty').value = currentQuantity;
        
        // Ya no redirigimos si está finalizada o cerrada, solo mostramos la información
        const isFinishedOrClosed = (currentRaffle.status === 'finished' || currentRaffle.status === 'closed');
        
        document.getElementById('raffleName').textContent = currentRaffle.name;
        document.getElementById('adminRaffleName').textContent = currentRaffle.name;
        document.getElementById('rafflePriceValue').textContent = currentRaffle.price || 0;
        document.getElementById('raffleImage').src = currentRaffle.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
        
        // MODIFICACIÓN: Mostrar la descripción con formato que respeta los saltos de línea
        const descriptionText = currentRaffle.description || '¡Participa y gana increíbles premios!';
        // Convertir saltos de línea a <br> para mostrar en HTML
        const formattedDescription = descriptionText.replace(/\n/g, '<br>').replace(/\r/g, '');
        document.getElementById('raffleDescription').innerHTML = `<i class="fa fa-star"></i> ${formattedDescription}`;
        
        const percent = currentRaffle.total_tickets > 0 ? (currentRaffle.sold_tickets * 100 / currentRaffle.total_tickets).toFixed(1) : 0;
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressPercentDisplay').textContent = percent + '%';
        document.getElementById('progressPercentage').textContent = percent + '%';
        
        updateLiveTotal();
        
        // Si la rifa está finalizada o cerrada, deshabilitar el botón de compra
        if (isFinishedOrClosed || currentRaffle.sold_tickets >= currentRaffle.total_tickets) {
            document.getElementById('btnConfirm').disabled = true;
            if (currentRaffle.status === 'finished') {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-trophy"></i> RIFA FINALIZADA';
            } else if (currentRaffle.status === 'closed') {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA CERRADA';
            } else {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA AGOTADA';
            }
        }
        
        // Actualizar el max del input de cantidad
        const maxAvailable = currentRaffle.total_tickets - currentRaffle.sold_tickets;
        const maxAllowed = Math.min(maxAvailable, maxPerPerson);
        document.getElementById('ticketQty').max = maxAllowed;
        
        // Mostrar advertencia si el mínimo es mayor que el máximo disponible
        if (minPerPerson > maxAvailable) {
            Swal.fire('Aviso', 'No hay suficientes boletos disponibles para cumplir con el mínimo requerido', 'warning');
            document.getElementById('btnConfirm').disabled = true;
        }
        
        if (currentUser) {
            loadAdminData();
        }
        
    } catch (error) {
        console.error('Error loading raffle:', error);
        Swal.fire('Error', 'No se pudo cargar la rifa', 'error').then(() => {
            window.location.href = 'index.html';
        });
    }
}

// Función para obtener la cantidad máxima por persona de la rifa
async function getUserPurchasedTickets(phone) {
    if (!phone) return 0;
    const { data, error } = await supabaseClient
        .from('tickets')
        .select('ticket_number')
        .eq('raffle_id', currentRaffle.id)
        .eq('user_phone', phone)
        .eq('status', 'confirmed');
    if (error) return 0;
    return data.length;
}

// ==================== CONFIGURACIÓN GENERAL ====================
window.loadConfig = async function () {
    try {
        const { data, error } = await supabaseClient
            .from('site_config')
            .select('*')
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            if (data.logo_url) {
                document.getElementById('navbarLogo').src = data.logo_url;
                document.getElementById('footerLogo').src = data.logo_url;
            }
            document.getElementById('footerSiteName').textContent = data.site_name || 'Super Rifas RD';
            document.getElementById('footerCeo').textContent = data.ceo || 'CEO: @Super_Rifas_RD';
            document.getElementById('footerLocation').textContent = data.location || 'Samaná, Francisco del Rosario Sánchez, detrás del mercado';
            
            if (data.whatsapp) {
                const whatsappNumber = data.whatsapp.replace(/\D/g, '');
                const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hola%21%20Me%20interesa%20participar%20en%20las%20rifas%20de%20${encodeURIComponent(data.site_name || 'Super Rifas RD')}`;
                document.getElementById('whatsappFloat').href = whatsappLink;
                document.getElementById('footerPhone').textContent = `+${whatsappNumber}`;
            }
            if (data.instagram_url) {
                document.getElementById('instagramLink').href = data.instagram_url;
            }
            
            document.getElementById('configId').value = data.id;
            document.getElementById('configSiteName').value = data.site_name || '';
            document.getElementById('configLocation').value = data.location || '';
            document.getElementById('configDescription').value = data.description || '';
            document.getElementById('configCeo').value = data.ceo || '';
            document.getElementById('configWhatsapp').value = data.whatsapp || '';
            document.getElementById('configInstagram').value = data.instagram_url || '';
            
            if (data.logo_url) {
                document.getElementById('logoImagePreview').src = data.logo_url;
                document.getElementById('logoImagePreview').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}