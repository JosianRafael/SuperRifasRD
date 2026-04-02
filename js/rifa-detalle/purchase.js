// ==================== FUNCIONES DE BOLETERÍA ====================
function updateLiveTotal() {
    const total = currentQuantity * (currentRaffle?.price || 0);
    document.getElementById('liveTotalPrice').textContent = `RD$ ${total.toLocaleString('es-DO')}`;
}

function updateQuantity(delta) {
    let nv = currentQuantity + delta;
    const maxTickets = currentRaffle ? currentRaffle.total_tickets - currentRaffle.sold_tickets : 100;
    const maxAllowed = Math.min(maxTickets, maxPerPerson);
    
    // Validar el mínimo
    if (nv < minPerPerson) {
        // No permitir bajar del mínimo
        Swal.fire('Mínimo requerido', `Debes comprar al menos ${minPerPerson} boleto(s) en esta rifa`, 'info');
        return;
    }
    
    if (nv >= minPerPerson && nv <= maxAllowed) {
        currentQuantity = nv;
        document.getElementById('ticketQty').value = currentQuantity;
        updateLiveTotal();
        document.getElementById('maxPerPersonWarning').style.display = 'none';
    } else if (nv > maxAllowed) {
        document.getElementById('maxPerPersonWarning').style.display = 'block';
        Swal.fire('Límite alcanzado', `Máximo ${maxAllowed} boletos por persona en esta rifa`, 'warning');
    }
}
async function getRandomAvailableTickets(quantity) {
    if (!currentRaffle) return null;
    
    // Obtener TODOS los boletos que NO están disponibles (confirmed, pending, cancelled)
    const { data: occupiedTickets, error } = await supabaseClient
        .from('tickets')
        .select('ticket_number')
        .eq('raffle_id', currentRaffle.id)
        .in('status', ['confirmed', 'pending']);  // ← Incluir pending también
    
    if (error) {
        console.error('Error getting occupied tickets:', error);
        return null;
    }
    
    const occupiedNumbers = new Set(occupiedTickets.map(t => t.ticket_number));
    const available = [];
    
    for (let i = 1; i <= currentRaffle.total_tickets; i++) {
        if (!occupiedNumbers.has(i)) {
            available.push(i);
        }
    }
    
    if (available.length < quantity) return null;
    
    // Algoritmo Fisher-Yates para mezclar
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    
    // Devolver como strings con padding de 4 dígitos
    return available.slice(0, quantity).map(num => num.toString().padStart(4, '0'));
}

async function uploadVoucher(ticketNumbers, userId) {
    if (!selectedVoucherFile) return null;
    
    const fileExt = selectedVoucherFile.name.split('.').pop();
    const fileName = `${currentRaffle.id}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `vouchers/${fileName}`;
    
    try {
        const { data, error } = await supabaseClient.storage
            .from('vouchers')
            .upload(filePath, selectedVoucherFile);
        
        if (error) throw error;
        
        const { data: urlData } = supabaseClient.storage
            .from('vouchers')
            .getPublicUrl(filePath);
        
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('Error uploading voucher:', error);
        return null;
    }
}

function handleVoucherFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        selectedVoucherFile = file;
        const uploadArea = document.querySelector('.file-upload-modern');
        const reader = new FileReader();
        reader.onload = function(ev) {
            uploadArea.innerHTML = `
                <div style="position: relative;">
                    <img src="${ev.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 12px; margin-bottom: 10px;">
                    <p><strong>✓ Comprobante seleccionado</strong></p>
                    <small class="text-muted">${file.name} (${(file.size / 1024).toFixed(2)} KB)</small>
                    <button type="button" onclick="clearVoucher()" style="background: #dc3545; color: white; border: none; border-radius: 20px; padding: 5px 12px; margin-top: 8px; cursor: pointer; font-size: 12px;">
                        <i class="fa fa-trash"></i> Eliminar
                    </button>
                </div>
                <input type="file" id="voucherFile" accept="image/*" style="display: none;">
            `;
            const newInput = uploadArea.querySelector('#voucherFile');
            if (newInput) {
                newInput.files = e.target.files;
                newInput.addEventListener('change', handleVoucherFileSelect);
            }
        };
        reader.readAsDataURL(file);
    }
}

function clearVoucher() {
    selectedVoucherFile = null;
    const uploadArea = document.querySelector('.file-upload-modern');
    uploadArea.innerHTML = `
        <i class="fa fa-cloud-upload upload-icon"></i>
        <p><strong>Subir Comprobante de Pago</strong></p>
        <small class="text-muted">Foto o captura de pantalla (JPG, PNG) - Obligatorio</small>
        <input type="file" id="voucherFile" accept="image/*" required>
    `;
    const newFileInput = uploadArea.querySelector('#voucherFile');
    if (newFileInput) {
        newFileInput.addEventListener('change', handleVoucherFileSelect);
    }
}
function toggleTermsCheckbox() {
    const checkbox = document.getElementById('termsCheckbox');
    // Alternar el estado del checkbox directamente
    checkbox.checked = !checkbox.checked;
    termsAccepted = checkbox.checked;
    
    // Si se desmarca el checkbox, también actualizar la variable termsAccepted
    if (!checkbox.checked) {
        termsAccepted = false;
    }
}

function openTermsModal(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('termsModal');
    modal.classList.add('show');
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.classList.remove('show');
}

function acceptTerms() {
    const checkbox = document.getElementById('termsCheckbox');
    checkbox.checked = true;
    termsAccepted = true;
    closeTermsModal();
    Swal.fire({
        icon: 'success',
        title: 'Términos aceptados',
        text: 'Has aceptado los términos y condiciones',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

async function confirmPurchase() {
    // Verificar que los términos hayan sido aceptados (checkbox marcado)
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (!termsCheckbox.checked) {
        Swal.fire('Aceptación requerida', 'Debes aceptar los Términos y Condiciones para continuar con la compra', 'error');
        return;
    }
    
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const countryCode = document.getElementById('countryCode').value;
    const fullPhone = countryCode + telefono;
    const voucherFile = document.getElementById('voucherFile').files[0];
    
    if (!nombre || nombre.split(' ').length < 2) {
        Swal.fire('Nombre incompleto', 'Por favor, ingresa tu NOMBRE COMPLETO (nombre y apellido)', 'error');
        return;
    }
    
    if (!telefono || telefono.length < 7) {
        Swal.fire('Teléfono inválido', 'Por favor, ingresa un TELÉFONO válido (mínimo 7 dígitos)', 'error');
        return;
    }
    
    if (!currentPaymentMethod) {
        Swal.fire('Método de pago', 'Por favor, selecciona un MÉTODO DE PAGO', 'error');
        return;
    }
    
    if (!voucherFile) {
        Swal.fire('Comprobante requerido', 'Por favor, sube el COMPROBANTE DE PAGO (foto o captura)', 'error');
        return;
    }
    
    if (!voucherFile.type.startsWith('image/')) {
        Swal.fire('Archivo no válido', 'El comprobante debe ser una imagen (JPG, PNG, etc.)', 'error');
        return;
    }
    
    // Validar que la cantidad sea al menos el mínimo requerido
    if (currentQuantity < minPerPerson) {
        Swal.fire('Cantidad insuficiente', `Debes comprar al menos ${minPerPerson} boleto(s) en esta rifa`, 'error');
        return;
    }
    
    // Validar cantidad máxima por persona
    const userPurchased = await getUserPurchasedTickets(fullPhone);
    const remainingAllowed = maxPerPerson - userPurchased;
    
    if (currentQuantity > remainingAllowed) {
        Swal.fire('Límite excedido', `Ya has comprado ${userPurchased} boletos. Solo puedes comprar ${remainingAllowed} más en esta rifa.`, 'error');
        return;
    }
    
    const randomNumbers = await getRandomAvailableTickets(currentQuantity);
    if (!randomNumbers) {
        Swal.fire('Sin boletos disponibles', 'No hay suficientes boletos disponibles en este momento', 'error');
        return;
    }
    
    showButtonLoading('btnConfirm', 'Procesando...');
    
    try {
        const voucherUrl = await uploadVoucher(randomNumbers, fullPhone);
        if (!voucherUrl) throw new Error('No se pudo subir el comprobante');
        
        const ticketsData = randomNumbers.map(ticketNumber => ({
            raffle_id: currentRaffle.id,
            ticket_number: parseInt(ticketNumber),
            user_name: nombre,
            user_phone: fullPhone,
            payment_method: currentPaymentMethod.bank_name,
            voucher_url: voucherUrl,
            price: currentRaffle.price,
            status: 'pending',
            purchase_date: new Date(),
            created_at: new Date()
        }));
        
        const { error: ticketsError } = await supabaseClient
            .from('tickets')
            .insert(ticketsData);
        
        if (ticketsError) throw ticketsError;
        
        const newSoldTickets = currentRaffle.sold_tickets + currentQuantity;
        await supabaseClient
            .from('raffles')
            .update({ 
                sold_tickets: newSoldTickets,
                updated_at: new Date(),
                status: newSoldTickets >= currentRaffle.total_tickets ? 'soldout' : currentRaffle.status
            })
            .eq('id', currentRaffle.id);
        
        currentRaffle.sold_tickets = newSoldTickets;
        const percent = (newSoldTickets * 100 / currentRaffle.total_tickets).toFixed(1);
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressPercentDisplay').textContent = percent + '%';
        document.getElementById('progressPercentage').textContent = percent + '%';
        
        Swal.fire({
            icon: 'success',
            title: '¡Compra Registrada!',
            html: `<strong>✅ ¡Gracias ${nombre}!</strong><br><br>🎫 <strong>Boletos:</strong> ${randomNumbers.join(', ')}<br><br>📱 Tu compra está pendiente de verificación.`,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#1c8200'
        });
        
        document.getElementById('nombre').value = '';
        document.getElementById('telefono').value = '';
        document.getElementById('voucherFile').value = '';
        // No resetear el checkbox de términos para que el usuario pueda seguir comprando sin re-aceptar
        // document.getElementById('termsCheckbox').checked = false;
        selectedVoucherFile = null;
        
        const uploadArea = document.querySelector('.file-upload-modern');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fa fa-cloud-upload upload-icon"></i>
                <p><strong>Subir Comprobante de Pago</strong></p>
                <small class="text-muted">Foto o captura de pantalla (JPG, PNG) - Obligatorio</small>
                <input type="file" id="voucherFile" accept="image/*" required>
            `;
            const newFileInput = uploadArea.querySelector('#voucherFile');
            if (newFileInput) newFileInput.addEventListener('change', handleVoucherFileSelect);
        }
        
        if (currentUser) await loadAdminData();
        
    } catch (error) {
        console.error('Error saving purchase:', error);
        Swal.fire('Error', 'No se pudo procesar la compra', 'error');
    } finally {
        hideButtonLoading('btnConfirm');
    }
}