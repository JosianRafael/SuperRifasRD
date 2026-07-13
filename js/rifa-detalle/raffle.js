async function loadRaffle() {
    if (!raffleId) {
        Swal.fire('Error', 'No se especificó la rifa', 'error').then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    
    try {
        // 1. Obtener datos de la rifa
        const { data, error } = await supabaseClient
            .from('raffles')
            .select('*')
            .eq('id', raffleId)
            .single();
        
        if (error) throw error;
        
        currentRaffle = data;
        
        // 2. Obtener el conteo REAL de confirmados (SIN LÍMITE)
        const { count: realSoldCount, error: countError } = await supabaseClient
            .from('tickets')
            .select('id', { count: 'exact', head: true })
            .eq('raffle_id', raffleId)
            .eq('status', 'confirmed')
            .limit(99999);  // 👈 Usar .limit() en lugar de .range()
        
        console.log(`📊 Conteo real de confirmados: ${realSoldCount || 0}`);
        console.log(`📊 sold_tickets en DB: ${currentRaffle.sold_tickets}`);
        
        if (!countError && realSoldCount !== null) {
            // Si hay diferencia, actualizar la tabla raffles
            if (realSoldCount !== currentRaffle.sold_tickets) {
                console.log(`🔄 Sincronizando: ${currentRaffle.sold_tickets} -> ${realSoldCount}`);
                
                await supabaseClient
                    .from('raffles')
                    .update({ 
                        sold_tickets: realSoldCount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', raffleId);
                
                currentRaffle.sold_tickets = realSoldCount;
            }
        }
        
        // 3. Configurar límites por persona
        maxPerPerson = currentRaffle.max_per_person || 100;
        minPerPerson = currentRaffle.min_per_person || 1;
        
        document.getElementById('maxPerPersonValue').textContent = maxPerPerson;
        document.getElementById('minPerPersonValue').textContent = minPerPerson;
        
        // 4. Configurar el contador con el valor mínimo
        currentQuantity = minPerPerson;
        document.getElementById('ticketQty').value = currentQuantity;
        
        // 5. Mostrar información de la rifa
        document.getElementById('raffleName').textContent = currentRaffle.name;
        document.getElementById('adminRaffleName').textContent = currentRaffle.name;
        document.getElementById('rafflePriceValue').textContent = currentRaffle.price || 0;
        document.getElementById('raffleImage').src = currentRaffle.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
        
        // 6. Mostrar descripción con formato
        const descriptionText = currentRaffle.description || '¡Participa y gana increíbles premios!';
        const formattedDescription = descriptionText.replace(/\n/g, '<br>').replace(/\r/g, '');
        document.getElementById('raffleDescription').innerHTML = `<i class="fa fa-star"></i> ${formattedDescription}`;
        
        // 7. Calcular y mostrar el progreso con el valor REAL
        const percent = currentRaffle.total_tickets > 0 
            ? (currentRaffle.sold_tickets * 100 / currentRaffle.total_tickets).toFixed(1) 
            : 0;
        
        console.log(`📊 Porcentaje final: ${percent}% (${currentRaffle.sold_tickets}/${currentRaffle.total_tickets})`);
        
        const progressFill = document.getElementById('progressFill');
        const progressPercentDisplay = document.getElementById('progressPercentDisplay');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressPercentDisplay) progressPercentDisplay.textContent = percent + '%';
        if (progressPercentage) progressPercentage.textContent = percent + '%';
        
        // 8. Actualizar total a pagar
        updateLiveTotal();
        
        // 9. Verificar si la rifa está finalizada o cerrada
        const isFinishedOrClosed = (currentRaffle.status === 'finished' || currentRaffle.status === 'closed');
        
        if (isFinishedOrClosed || currentRaffle.sold_tickets >= currentRaffle.total_tickets) {
            document.getElementById('btnConfirm').disabled = true;
            if (currentRaffle.status === 'finished') {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-trophy"></i> RIFA FINALIZADA';
            } else if (currentRaffle.status === 'closed') {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA CERRADA';
            } else {
                document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA AGOTADA';
            }
        } else {
            document.getElementById('btnConfirm').disabled = false;
            document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-check-circle"></i> Confirmar Compra';
        }
        
        // 10. Actualizar el max del input de cantidad
        const maxAvailable = currentRaffle.total_tickets - currentRaffle.sold_tickets;
        const maxAllowed = Math.min(maxAvailable, maxPerPerson);
        document.getElementById('ticketQty').max = maxAllowed;
        
        // 11. Mostrar advertencia si el mínimo es mayor que el máximo disponible
        if (minPerPerson > maxAvailable) {
            Swal.fire('Aviso', 'No hay suficientes boletos disponibles para cumplir con el mínimo requerido', 'warning');
            document.getElementById('btnConfirm').disabled = true;
        }
        
        // 12. Cargar datos del admin si el usuario está logueado
        if (currentUser) {
            loadAdminData();
        }
        
        console.log(`✅ Rifa cargada correctamente: ${currentRaffle.name}`);
        console.log(`📊 Progreso: ${currentRaffle.sold_tickets}/${currentRaffle.total_tickets} (${percent}%)`);
        
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