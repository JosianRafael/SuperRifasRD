
// // Configuración de Supabase
// const SUPABASE_URL = 'https://hogbufyfyvntczhfibcw.supabase.co';
// const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZ2J1ZnlmeXZudGN6aGZpYmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjM2NzcsImV4cCI6MjA5MDEzOTY3N30.YnPuE8yvGDDtT48X35Jb9qz9P2nE92KczOvz1ghyPN8';
// const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// let currentUser = null;
// let currentRaffle = null;
// let currentQuantity = 1;
// let currentPaymentMethod = null;
// let selectedVoucherFile = null;
// let paymentMethods = [];
// let allTickets = [];
// let allUsers = [];
// let maxPerPerson = 100;
// let minPerPerson = 1;  // Nueva variable para el mínimo de boletos por persona

// // Obtener ID de la rifa de la URL
// const urlParams = new URLSearchParams(window.location.search);
// const raffleId = urlParams.get('id');

// // ==================== FUNCIONES DE UTILIDAD ====================
// function showButtonLoading(buttonId, loadingText = 'Procesando...') {
//     const btn = document.getElementById(buttonId);
//     if (!btn) return;
//     const originalText = btn.innerHTML;
//     btn.dataset.originalText = originalText;
//     btn.innerHTML = `<span class="loading-spinner"></span> ${loadingText}`;
//     btn.disabled = true;
//     btn.classList.add('btn-loading');
// }

// function hideButtonLoading(buttonId) {
//     const btn = document.getElementById(buttonId);
//     if (!btn) return;
//     btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
//     btn.disabled = false;
//     btn.classList.remove('btn-loading');
// }

// function escapeHtml(text) {
//     if (!text) return '';
//     const div = document.createElement('div');
//     div.textContent = text;
//     return div.innerHTML;
// }

// function copyToClipboard(text) {
//     navigator.clipboard.writeText(text);
//     Swal.fire({
//         icon: 'success',
//         title: '¡Copiado!',
//         text: 'La información ha sido copiada al portapapeles',
//         timer: 2000,
//         showConfirmButton: false,
//         toast: true,
//         position: 'top-end'
//     });
// }

// // Función para cerrar el panel de admin antes de mostrar modales
// function closeAdminPanelForAction() {
//     const adminPanel = document.getElementById('adminPanel');
//     if (adminPanel.classList.contains('show')) {
//         adminPanel.classList.remove('show');
//     }
// }

// // Función para obtener la cantidad máxima por persona de la rifa
// async function getUserPurchasedTickets(phone) {
//     if (!phone) return 0;
//     const { data, error } = await supabaseClient
//         .from('tickets')
//         .select('ticket_number')
//         .eq('raffle_id', currentRaffle.id)
//         .eq('user_phone', phone)
//         .eq('status', 'confirmed');
//     if (error) return 0;
//     return data.length;
// }

// // ==================== CONFIGURACIÓN GENERAL ====================
// async function loadConfig() {
//     try {
//         const { data, error } = await supabaseClient
//             .from('site_config')
//             .select('*')
//             .limit(1)
//             .single();
        
//         if (error && error.code !== 'PGRST116') throw error;
        
//         if (data) {
//             if (data.logo_url) {
//                 document.getElementById('navbarLogo').src = data.logo_url;
//                 document.getElementById('footerLogo').src = data.logo_url;
//             }
//             document.getElementById('footerSiteName').textContent = data.site_name || 'Super Rifas RD';
//             document.getElementById('footerCeo').textContent = data.ceo || 'CEO: @Super_Rifas_RD';
//             document.getElementById('footerLocation').textContent = data.location || 'Samaná, Francisco del Rosario Sánchez, detrás del mercado';
            
//             if (data.whatsapp) {
//                 const whatsappNumber = data.whatsapp.replace(/\D/g, '');
//                 const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hola%21%20Me%20interesa%20participar%20en%20las%20rifas%20de%20${encodeURIComponent(data.site_name || 'Super Rifas RD')}`;
//                 document.getElementById('whatsappFloat').href = whatsappLink;
//                 document.getElementById('footerPhone').textContent = `+${whatsappNumber}`;
//             }
//             if (data.instagram_url) {
//                 document.getElementById('instagramLink').href = data.instagram_url;
//             }
            
//             document.getElementById('configId').value = data.id;
//             document.getElementById('configSiteName').value = data.site_name || '';
//             document.getElementById('configLocation').value = data.location || '';
//             document.getElementById('configDescription').value = data.description || '';
//             document.getElementById('configCeo').value = data.ceo || '';
//             document.getElementById('configWhatsapp').value = data.whatsapp || '';
//             document.getElementById('configInstagram').value = data.instagram_url || '';
            
//             if (data.logo_url) {
//                 document.getElementById('logoImagePreview').src = data.logo_url;
//                 document.getElementById('logoImagePreview').style.display = 'block';
//             }
//         }
//     } catch (error) {
//         console.error('Error loading config:', error);
//     }
// }

// // ==================== MÉTODOS DE PAGO ====================
// async function loadPaymentMethods() {
//     try {
//         const { data, error } = await supabaseClient
//             .from('payment_accounts')
//             .select('*')
//             .order('created_at', { ascending: true });
        
//         if (error) throw error;
        
//         paymentMethods = data;
//         renderPaymentMethods();
//     } catch (error) {
//         console.error('Error loading payment methods:', error);
//         paymentMethods = [
//             { id: 'efectivo', bank_name: 'EFECTIVO', logo_url: null, account_type: 'Pago en efectivo', account_number: null, holder_name: 'Super Rifas RD - Punto de Pago' }
//         ];
//         renderPaymentMethods();
//     }
// }

// function renderPaymentMethods() {
//     const container = document.getElementById('paymentMethods');
//     if (!container) return;
    
//     container.innerHTML = '';
//     paymentMethods.forEach((method, index) => {
//         const div = document.createElement('div');
//         div.className = 'payment-card' + (index === 0 ? ' selected' : '');
//         div.innerHTML = `
//             <img src="${method.logo_url || 'https://via.placeholder.com/50x50?text=Banco'}" alt="${method.bank_name}" style="height: 35px; object-fit: contain;">
//             <p>${method.bank_name}</p>
//         `;
//         div.onclick = () => selectPaymentMethod(method.id);
//         container.appendChild(div);
//     });
    
//     if (paymentMethods.length > 0) {
//         selectPaymentMethod(paymentMethods[0].id);
//     }
// }

// function selectPaymentMethod(methodId) {
//     currentPaymentMethod = paymentMethods.find(m => m.id === methodId);
    
//     document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
//     const idx = paymentMethods.findIndex(m => m.id === methodId);
//     if (document.querySelectorAll('.payment-card')[idx]) {
//         document.querySelectorAll('.payment-card')[idx].classList.add('selected');
//     }
    
//     const bankInfo = document.getElementById('bankInfo');
//     if (currentPaymentMethod.bank_name === 'EFECTIVO' || !currentPaymentMethod.account_number) {
//         bankInfo.innerHTML = `
//             <div class="bank-detail-row">
//                 <span class="bank-detail-label">Titular:</span>
//                 <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.holder_name || 'Super Rifas RD')}</span>
//             </div>
//         `;
//     } else {
//         bankInfo.innerHTML = `
//             <div class="bank-detail-row">
//                 <span class="bank-detail-label">${currentPaymentMethod.account_type || 'Cuenta'}:</span>
//                 <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.account_number)}</span>
//             </div>
//             <div class="bank-detail-row">
//                 <span class="bank-detail-label">Titular:</span>
//                 <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.holder_name)}</span>
//             </div>
//             <button class="copy-btn-modern" onclick="copyToClipboard('${escapeHtml(currentPaymentMethod.account_number)}')"><i class="fa fa-copy"></i> Copiar cuenta</button>
//         `;
//     }
// }

// // ==================== CARGA DE RIFA ====================
// async function loadRaffle() {
//     if (!raffleId) {
//         Swal.fire('Error', 'No se especificó la rifa', 'error').then(() => {
//             window.location.href = 'index.html';
//         });
//         return;
//     }
    
//     try {
//         const { data, error } = await supabaseClient
//             .from('raffles')
//             .select('*')
//             .eq('id', raffleId)
//             .single();
        
//         if (error) throw error;
        
//         currentRaffle = data;
//         maxPerPerson = currentRaffle.max_per_person || 100;
//         minPerPerson = currentRaffle.min_per_person || 1;
        
//         document.getElementById('maxPerPersonValue').textContent = maxPerPerson;
//         document.getElementById('minPerPersonValue').textContent = minPerPerson;
        
//         // Configurar el contador con el valor mínimo
//         currentQuantity = minPerPerson;
//         document.getElementById('ticketQty').value = currentQuantity;
        
//         // Ya no redirigimos si está finalizada o cerrada, solo mostramos la información
//         const isFinishedOrClosed = (currentRaffle.status === 'finished' || currentRaffle.status === 'closed');
        
//         document.getElementById('raffleName').textContent = currentRaffle.name;
//         document.getElementById('adminRaffleName').textContent = currentRaffle.name;
//         document.getElementById('rafflePriceValue').textContent = currentRaffle.price || 0;
//         document.getElementById('raffleImage').src = currentRaffle.image_url || 'https://via.placeholder.com/400x400?text=Sin+Imagen';
//         document.getElementById('raffleDescription').innerHTML = `<i class="fa fa-star"></i> ${escapeHtml(currentRaffle.description || '¡Participa y gana increíbles premios!')}`;
        
//         const percent = currentRaffle.total_tickets > 0 ? (currentRaffle.sold_tickets * 100 / currentRaffle.total_tickets).toFixed(1) : 0;
//         document.getElementById('progressFill').style.width = percent + '%';
//         document.getElementById('progressPercentDisplay').textContent = percent + '%';
//         document.getElementById('progressPercentage').textContent = percent + '%';
        
//         updateLiveTotal();
        
//         // Si la rifa está finalizada o cerrada, deshabilitar el botón de compra
//         if (isFinishedOrClosed || currentRaffle.sold_tickets >= currentRaffle.total_tickets) {
//             document.getElementById('btnConfirm').disabled = true;
//             if (currentRaffle.status === 'finished') {
//                 document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-trophy"></i> RIFA FINALIZADA';
//             } else if (currentRaffle.status === 'closed') {
//                 document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA CERRADA';
//             } else {
//                 document.getElementById('btnConfirm').innerHTML = '<i class="fa fa-ban"></i> RIFA AGOTADA';
//             }
//         }
        
//         // Actualizar el max del input de cantidad
//         const maxAvailable = currentRaffle.total_tickets - currentRaffle.sold_tickets;
//         const maxAllowed = Math.min(maxAvailable, maxPerPerson);
//         document.getElementById('ticketQty').max = maxAllowed;
        
//         // Mostrar advertencia si el mínimo es mayor que el máximo disponible
//         if (minPerPerson > maxAvailable) {
//             Swal.fire('Aviso', 'No hay suficientes boletos disponibles para cumplir con el mínimo requerido', 'warning');
//             document.getElementById('btnConfirm').disabled = true;
//         }
        
//         if (currentUser) {
//             loadAdminData();
//         }
        
//     } catch (error) {
//         console.error('Error loading raffle:', error);
//         Swal.fire('Error', 'No se pudo cargar la rifa', 'error').then(() => {
//             window.location.href = 'index.html';
//         });
//     }
// }

// // ==================== FUNCIONES DE BOLETERÍA ====================
// function updateLiveTotal() {
//     const total = currentQuantity * (currentRaffle?.price || 0);
//     document.getElementById('liveTotalPrice').textContent = `RD$ ${total.toLocaleString('es-DO')}`;
// }

// function updateQuantity(delta) {
//     let nv = currentQuantity + delta;
//     const maxTickets = currentRaffle ? currentRaffle.total_tickets - currentRaffle.sold_tickets : 100;
//     const maxAllowed = Math.min(maxTickets, maxPerPerson);
    
//     // Validar el mínimo
//     if (nv < minPerPerson) {
//         // No permitir bajar del mínimo
//         Swal.fire('Mínimo requerido', `Debes comprar al menos ${minPerPerson} boleto(s) en esta rifa`, 'info');
//         return;
//     }
    
//     if (nv >= minPerPerson && nv <= maxAllowed) {
//         currentQuantity = nv;
//         document.getElementById('ticketQty').value = currentQuantity;
//         updateLiveTotal();
//         document.getElementById('maxPerPersonWarning').style.display = 'none';
//     } else if (nv > maxAllowed) {
//         document.getElementById('maxPerPersonWarning').style.display = 'block';
//         Swal.fire('Límite alcanzado', `Máximo ${maxAllowed} boletos por persona en esta rifa`, 'warning');
//     }
// }

// async function getRandomAvailableTickets(quantity) {
//     if (!currentRaffle) return null;
    
//     const { data: soldTickets, error } = await supabaseClient
//         .from('tickets')
//         .select('ticket_number')
//         .eq('raffle_id', currentRaffle.id)
//         .eq('status', 'confirmed');
    
//     if (error) {
//         console.error('Error getting sold tickets:', error);
//         return null;
//     }
    
//     const soldNumbers = new Set(soldTickets.map(t => t.ticket_number));
//     const available = [];
    
//     for (let i = 1; i <= currentRaffle.total_tickets; i++) {
//         if (!soldNumbers.has(i)) {
//             available.push(i.toString().padStart(4, '0'));
//         }
//     }
    
//     if (available.length < quantity) return null;
    
//     for (let i = available.length - 1; i > 0; i--) {
//         const j = Math.floor(Math.random() * (i + 1));
//         [available[i], available[j]] = [available[j], available[i]];
//     }
    
//     return available.slice(0, quantity);
// }

// async function uploadVoucher(ticketNumbers, userId) {
//     if (!selectedVoucherFile) return null;
    
//     const fileExt = selectedVoucherFile.name.split('.').pop();
//     const fileName = `${currentRaffle.id}_${userId}_${Date.now()}.${fileExt}`;
//     const filePath = `vouchers/${fileName}`;
    
//     try {
//         const { data, error } = await supabaseClient.storage
//             .from('vouchers')
//             .upload(filePath, selectedVoucherFile);
        
//         if (error) throw error;
        
//         const { data: urlData } = supabaseClient.storage
//             .from('vouchers')
//             .getPublicUrl(filePath);
        
//         return urlData.publicUrl;
        
//     } catch (error) {
//         console.error('Error uploading voucher:', error);
//         return null;
//     }
// }

// function handleVoucherFileSelect(e) {
//     const file = e.target.files[0];
//     if (file) {
//         selectedVoucherFile = file;
//         const uploadArea = document.querySelector('.file-upload-modern');
//         const reader = new FileReader();
//         reader.onload = function(ev) {
//             uploadArea.innerHTML = `
//                 <div style="position: relative;">
//                     <img src="${ev.target.result}" style="max-width: 100%; max-height: 150px; border-radius: 12px; margin-bottom: 10px;">
//                     <p><strong>✓ Comprobante seleccionado</strong></p>
//                     <small class="text-muted">${file.name} (${(file.size / 1024).toFixed(2)} KB)</small>
//                     <button type="button" onclick="clearVoucher()" style="background: #dc3545; color: white; border: none; border-radius: 20px; padding: 5px 12px; margin-top: 8px; cursor: pointer; font-size: 12px;">
//                         <i class="fa fa-trash"></i> Eliminar
//                     </button>
//                 </div>
//                 <input type="file" id="voucherFile" accept="image/*" style="display: none;">
//             `;
//             const newInput = uploadArea.querySelector('#voucherFile');
//             if (newInput) {
//                 newInput.files = e.target.files;
//                 newInput.addEventListener('change', handleVoucherFileSelect);
//             }
//         };
//         reader.readAsDataURL(file);
//     }
// }

// function clearVoucher() {
//     selectedVoucherFile = null;
//     const uploadArea = document.querySelector('.file-upload-modern');
//     uploadArea.innerHTML = `
//         <i class="fa fa-cloud-upload upload-icon"></i>
//         <p><strong>Subir Comprobante de Pago</strong></p>
//         <small class="text-muted">Foto o captura de pantalla (JPG, PNG) - Obligatorio</small>
//         <input type="file" id="voucherFile" accept="image/*" required>
//     `;
//     const newFileInput = uploadArea.querySelector('#voucherFile');
//     if (newFileInput) {
//         newFileInput.addEventListener('change', handleVoucherFileSelect);
//     }
// }

// // Variables para control de términos aceptados
// let termsAccepted = false;

// function toggleTermsCheckbox() {
//     const checkbox = document.getElementById('termsCheckbox');
//     checkbox.checked = !checkbox.checked;
//     if (checkbox.checked) {
//         termsAccepted = true;
//     } else {
//         termsAccepted = false;
//     }
// }

// function openTermsModal(event) {
//     if (event) event.stopPropagation();
//     const modal = document.getElementById('termsModal');
//     modal.classList.add('show');
// }

// function closeTermsModal() {
//     const modal = document.getElementById('termsModal');
//     modal.classList.remove('show');
// }

// function acceptTerms() {
//     const checkbox = document.getElementById('termsCheckbox');
//     checkbox.checked = true;
//     termsAccepted = true;
//     closeTermsModal();
//     Swal.fire({
//         icon: 'success',
//         title: 'Términos aceptados',
//         text: 'Has aceptado los términos y condiciones',
//         timer: 2000,
//         showConfirmButton: false,
//         toast: true,
//         position: 'top-end'
//     });
// }

// async function confirmPurchase() {
//     // Verificar que los términos hayan sido aceptados
//     if (!termsAccepted && !document.getElementById('termsCheckbox').checked) {
//         Swal.fire('Aceptación requerida', 'Debes aceptar los Términos y Condiciones para continuar con la compra', 'error');
//         return;
//     }
    
//     const nombre = document.getElementById('nombre').value.trim();
//     const telefono = document.getElementById('telefono').value.trim();
//     const countryCode = document.getElementById('countryCode').value;
//     const fullPhone = countryCode + telefono;
//     const voucherFile = document.getElementById('voucherFile').files[0];
    
//     if (!nombre || nombre.split(' ').length < 2) {
//         Swal.fire('Nombre incompleto', 'Por favor, ingresa tu NOMBRE COMPLETO (nombre y apellido)', 'error');
//         return;
//     }
    
//     if (!telefono || telefono.length < 7) {
//         Swal.fire('Teléfono inválido', 'Por favor, ingresa un TELÉFONO válido (mínimo 7 dígitos)', 'error');
//         return;
//     }
    
//     if (!currentPaymentMethod) {
//         Swal.fire('Método de pago', 'Por favor, selecciona un MÉTODO DE PAGO', 'error');
//         return;
//     }
    
//     if (!voucherFile) {
//         Swal.fire('Comprobante requerido', 'Por favor, sube el COMPROBANTE DE PAGO (foto o captura)', 'error');
//         return;
//     }
    
//     if (!voucherFile.type.startsWith('image/')) {
//         Swal.fire('Archivo no válido', 'El comprobante debe ser una imagen (JPG, PNG, etc.)', 'error');
//         return;
//     }
    
//     // Validar que la cantidad sea al menos el mínimo requerido
//     if (currentQuantity < minPerPerson) {
//         Swal.fire('Cantidad insuficiente', `Debes comprar al menos ${minPerPerson} boleto(s) en esta rifa`, 'error');
//         return;
//     }
    
//     // Validar cantidad máxima por persona
//     const userPurchased = await getUserPurchasedTickets(fullPhone);
//     const remainingAllowed = maxPerPerson - userPurchased;
    
//     if (currentQuantity > remainingAllowed) {
//         Swal.fire('Límite excedido', `Ya has comprado ${userPurchased} boletos. Solo puedes comprar ${remainingAllowed} más en esta rifa.`, 'error');
//         return;
//     }
    
//     const randomNumbers = await getRandomAvailableTickets(currentQuantity);
//     if (!randomNumbers) {
//         Swal.fire('Sin boletos disponibles', 'No hay suficientes boletos disponibles en este momento', 'error');
//         return;
//     }
    
//     showButtonLoading('btnConfirm', 'Procesando...');
    
//     try {
//         const voucherUrl = await uploadVoucher(randomNumbers, fullPhone);
//         if (!voucherUrl) throw new Error('No se pudo subir el comprobante');
        
//         const ticketsData = randomNumbers.map(ticketNumber => ({
//             raffle_id: currentRaffle.id,
//             ticket_number: parseInt(ticketNumber),
//             user_name: nombre,
//             user_phone: fullPhone,
//             payment_method: currentPaymentMethod.bank_name,
//             voucher_url: voucherUrl,
//             price: currentRaffle.price,
//             status: 'pending',
//             purchase_date: new Date(),
//             created_at: new Date()
//         }));
        
//         const { error: ticketsError } = await supabaseClient
//             .from('tickets')
//             .insert(ticketsData);
        
//         if (ticketsError) throw ticketsError;
        
//         const newSoldTickets = currentRaffle.sold_tickets + currentQuantity;
//         await supabaseClient
//             .from('raffles')
//             .update({ 
//                 sold_tickets: newSoldTickets,
//                 updated_at: new Date(),
//                 status: newSoldTickets >= currentRaffle.total_tickets ? 'soldout' : currentRaffle.status
//             })
//             .eq('id', currentRaffle.id);
        
//         currentRaffle.sold_tickets = newSoldTickets;
//         const percent = (newSoldTickets * 100 / currentRaffle.total_tickets).toFixed(1);
//         document.getElementById('progressFill').style.width = percent + '%';
//         document.getElementById('progressPercentDisplay').textContent = percent + '%';
//         document.getElementById('progressPercentage').textContent = percent + '%';
        
//         Swal.fire({
//             icon: 'success',
//             title: '¡Compra Registrada!',
//             html: `<strong>✅ ¡Gracias ${nombre}!</strong><br><br>🎫 <strong>Boletos:</strong> ${randomNumbers.join(', ')}<br><br>📱 Tu compra está pendiente de verificación.`,
//             confirmButtonText: 'Aceptar',
//             confirmButtonColor: '#1c8200'
//         });
        
//         document.getElementById('nombre').value = '';
//         document.getElementById('telefono').value = '';
//         document.getElementById('voucherFile').value = '';
//         selectedVoucherFile = null;
        
//         const uploadArea = document.querySelector('.file-upload-modern');
//         if (uploadArea) {
//             uploadArea.innerHTML = `
//                 <i class="fa fa-cloud-upload upload-icon"></i>
//                 <p><strong>Subir Comprobante de Pago</strong></p>
//                 <small class="text-muted">Foto o captura de pantalla (JPG, PNG) - Obligatorio</small>
//                 <input type="file" id="voucherFile" accept="image/*" required>
//             `;
//             const newFileInput = uploadArea.querySelector('#voucherFile');
//             if (newFileInput) newFileInput.addEventListener('change', handleVoucherFileSelect);
//         }
        
//         if (currentUser) await loadAdminData();
        
//     } catch (error) {
//         console.error('Error saving purchase:', error);
//         Swal.fire('Error', 'No se pudo procesar la compra', 'error');
//     } finally {
//         hideButtonLoading('btnConfirm');
//     }
// }

// // ==================== BUSCADOR PÚBLICO ====================
// async function searchTickets() {
//     const searchValue = document.getElementById('searchInput').value.trim();
//     const searchResultInfo = document.getElementById('searchResultInfo');
//     const container = document.getElementById('selectedNumbersList');
    
//     if (!searchValue) {
//         searchResultInfo.style.display = 'none';
//         container.innerHTML = `<div class="assigned-placeholder"><i class="fa fa-magic"></i><p>Busca un boleto o teléfono para ver los boletos asignados</p></div>`;
//         return;
//     }
    
//     showButtonLoading('btnSearch', 'Buscando...');
    
//     try {
//         let query = supabaseClient
//             .from('tickets')
//             .select('*')
//             .eq('raffle_id', currentRaffle.id);
        
//         if (searchValue.match(/^\d+$/)) {
//             if (searchValue.length > 7) {
//                 query = query.eq('user_phone', searchValue);
//             } else {
//                 query = query.eq('ticket_number', parseInt(searchValue));
//             }
//         } else {
//             query = query.eq('user_phone', searchValue);
//         }
        
//         const { data: tickets, error } = await query;
        
//         if (error) throw error;
        
//         if (tickets && tickets.length > 0) {
//             const userInfo = tickets[0];
//             const statusColors = { 'pending': '#ff9800', 'confirmed': '#1c8200', 'cancelled': '#dc3545' };
            
//             searchResultInfo.style.display = 'block';
//             searchResultInfo.innerHTML = `
//                 <p><strong><i class="fa fa-user"></i> ${escapeHtml(userInfo.user_name)}</strong></p>
//                 <p><i class="fa fa-phone"></i> ${escapeHtml(userInfo.user_phone)}</p>
//                 <p><i class="fa fa-calendar"></i> Fecha: ${new Date(userInfo.purchase_date).toLocaleDateString()}</p>
//                 <p><i class="fa fa-tag"></i> Estado: <span style="color: ${statusColors[userInfo.status]}">${userInfo.status === 'pending' ? 'Pendiente' : userInfo.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></p>
//                 <p><i class="fa fa-ticket"></i> ${tickets.length} boleto(s)</p>
//             `;
            
//             let html = '<div class="tickets-badges-grid">';
//             tickets.forEach(ticket => {
//                 html += `
//                     <div class="ticket-item-wrapper">
//                         <div class="ticket-badge-modern">🎫 ${ticket.ticket_number.toString().padStart(4, '0')}</div>
//                         <div style="display: flex; gap: 6px;">
//                             <button class="btn-print-ticket" onclick="printTicketModal('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')"><i class="fa fa-print"></i> Imprimir</button>
//                             <button class="btn-download-ticket" onclick="downloadTicketAsPNG('${ticket.ticket_number.toString().padStart(4, '0')}', '${escapeHtml(ticket.user_name)}', '${escapeHtml(ticket.user_phone)}', '${new Date(ticket.purchase_date).toLocaleDateString()}', '${ticket.status}')"><i class="fa fa-download"></i> PNG</button>
//                         </div>
//                     </div>
//                 `;
//             });
//             html += '</div>';
//             container.innerHTML = html;
//         } else {
//             searchResultInfo.style.display = 'block';
//             searchResultInfo.innerHTML = `<p><i class="fa fa-exclamation-circle"></i> <strong>No se encontraron resultados</strong></p>`;
//             container.innerHTML = `<div class="assigned-placeholder"><i class="fa fa-search"></i><p>No se encontraron boletos para "${searchValue}"</p></div>`;
//         }
//     } catch (error) {
//         console.error('Error searching tickets:', error);
//         Swal.fire('Error', 'No se pudieron buscar los boletos', 'error');
//     } finally {
//         hideButtonLoading('btnSearch');
//     }
// }

// // ==================== FUNCIONES DE IMPRESIÓN ====================
// function printTicketModal(ticketNumber, userName, userPhone, purchaseDate, status) {
//     const ticketHTML = `
//         <!DOCTYPE html>
//         <html><head><meta charset="UTF-8"><title>Boleto</title><style>
//             *{margin:0;padding:0;box-sizing:border-box;}
//             body{font-family:'Courier New',monospace;background:white;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;}
//             .ticket{width:320px;background:white;border:2px solid #000;padding:20px;margin:0 auto;}
//             .center{text-align:center;}
//             .bold{font-weight:bold;}
//             .separator{border-top:1px dashed #000;margin:12px 0;}
//             .ticket-number{background:#000;color:white;padding:12px;text-align:center;margin:12px 0;font-size:28px;letter-spacing:3px;}
//             .info-line{display:flex;justify-content:space-between;margin:8px 0;}
//             .logo-img{max-width:80px;margin:0 auto 10px;display:block;border-radius:50%;}
//         </style></head>
//         <body><div class="ticket"><div class="center"><img src="${document.getElementById('navbarLogo').src}" class="logo-img"><div class="bold" style="font-size:18px;">Super Rifas RD</div></div>
//         <div class="separator"></div><div class="center bold">${currentRaffle.name}</div><div class="separator"></div>
//         <div class="ticket-number">${ticketNumber}</div>
//         <div class="info-line"><span>PARTICIPANTE:</span><span class="bold">${userName.toUpperCase()}</span></div>
//         <div class="info-line"><span>TELÉFONO:</span><span class="bold">${userPhone}</span></div>
//         <div class="info-line"><span>FECHA:</span><span class="bold">${purchaseDate}</span></div>
//         <div class="info-line"><span>ESTADO:</span><span class="bold">${status === 'pending' ? 'PENDIENTE' : status === 'confirmed' ? 'VERIFICADO' : 'ANULADO'}</span></div>
//         <div class="separator"></div><div class="center bold">SORTEO AL COMPLETAR EL 100%</div>
//         <div class="center small">¡ESTE BOLETO TE HACE PARTICIPANTE!</div>
//         <div class="separator"></div><div class="center small">📱 WHATSAPP: +1 8295026484</div>
//         <div class="center small">📷 INSTAGRAM: Super Rifas RD</div></div></body></html>
//     `;
//     const printWindow = window.open('', '_blank');
//     printWindow.document.write(ticketHTML);
//     printWindow.document.close();
//     printWindow.print();
// }

// async function downloadTicketAsPNG(ticketNumber, userName, userPhone, purchaseDate, status) {
//     const ticketHTML = `
//         <!DOCTYPE html>
//         <html><head><meta charset="UTF-8"><title>Boleto</title><style>
//             *{margin:0;padding:0;box-sizing:border-box;}
//             body{font-family:'Courier New',monospace;background:white;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;}
//             .ticket{width:320px;background:white;border:2px solid #000;padding:20px;}
//             .center{text-align:center;}
//             .bold{font-weight:bold;}
//             .separator{border-top:1px dashed #000;margin:12px 0;}
//             .ticket-number{background:#000;color:white;padding:12px;text-align:center;margin:12px 0;font-size:28px;letter-spacing:3px;}
//             .info-line{display:flex;justify-content:space-between;margin:8px 0;}
//             .logo-img{max-width:80px;margin:0 auto 10px;display:block;border-radius:50%;}
//         </style></head>
//         <body><div class="ticket"><div class="center"><img src="${document.getElementById('navbarLogo').src}" class="logo-img"><div class="bold" style="font-size:18px;">Super Rifas RD</div></div>
//         <div class="separator"></div><div class="center bold">${currentRaffle.name}</div><div class="separator"></div>
//         <div class="ticket-number">${ticketNumber}</div>
//         <div class="info-line"><span>PARTICIPANTE:</span><span class="bold">${userName.toUpperCase()}</span></div>
//         <div class="info-line"><span>TELÉFONO:</span><span class="bold">${userPhone}</span></div>
//         <div class="info-line"><span>FECHA:</span><span class="bold">${purchaseDate}</span></div>
//         <div class="info-line"><span>ESTADO:</span><span class="bold">${status === 'pending' ? 'PENDIENTE' : status === 'confirmed' ? 'VERIFICADO' : 'ANULADO'}</span></div>
//         <div class="separator"></div><div class="center bold">SORTEO AL COMPLETAR EL 100%</div>
//         <div class="center small">¡ESTE BOLETO TE HACE PARTICIPANTE!</div>
//         <div class="separator"></div><div class="center small">📱 WHATSAPP: +1 8295026484</div>
//         <div class="center small">📷 INSTAGRAM: @Super_Rifas_RD</div></div></body></html>
//     `;
    
//     const tempDiv = document.createElement('div');
//     tempDiv.style.position = 'absolute';
//     tempDiv.style.left = '-9999px';
//     tempDiv.style.top = '-9999px';
//     tempDiv.innerHTML = ticketHTML;
//     document.body.appendChild(tempDiv);
    
//     const ticketElement = tempDiv.querySelector('.ticket');
    
//     try {
//         const canvas = await html2canvas(ticketElement, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
//         const link = document.createElement('a');
//         link.download = `boleto_${ticketNumber}.png`;
//         link.href = canvas.toDataURL('image/png');
//         link.click();
//         Swal.fire({ icon: 'success', title: '¡Descarga completada!', timer: 2000, showConfirmButton: false, toast: true });
//     } catch (error) {
//         console.error('Error:', error);
//         Swal.fire('Error', 'No se pudo generar la imagen', 'error');
//     } finally {
//         document.body.removeChild(tempDiv);
//     }
// }

// // ==================== PANEL DE ADMINISTRACIÓN ====================
// async function loadAdminData() {
//     if (!currentUser) return;
    
//     try {
//         const { data: tickets, error } = await supabaseClient
//             .from('tickets')
//             .select('*')
//             .eq('raffle_id', currentRaffle.id)
//             .order('purchase_date', { ascending: false });
        
//         if (error) throw error;
        
//         allTickets = tickets;
        
//         const confirmedTickets = tickets.filter(t => t.status === 'confirmed');
//         const pendingVouchers = tickets.filter(t => t.status === 'pending');
//         const totalCollected = confirmedTickets.reduce((sum, t) => sum + (t.price || 0), 0);
//         const percent = currentRaffle.total_tickets > 0 ? (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1) : 0;
        
//         document.getElementById('statTotalCollected').textContent = `RD$ ${totalCollected.toLocaleString('es-DO')}`;
//         document.getElementById('statTicketsSold').textContent = confirmedTickets.length;
//         document.getElementById('statPercentage').textContent = percent + '%';
//         document.getElementById('statPendingVouchers').textContent = pendingVouchers.length;
        
//         const recentTickets = tickets.slice(0, 10);
//         renderRecentTickets(recentTickets);
//         renderPendingVouchers(pendingVouchers);
//         renderAdminTickets(tickets);
        
//         const usersMap = new Map();
//         tickets.forEach(t => {
//             if (!usersMap.has(t.user_phone)) {
//                 usersMap.set(t.user_phone, {
//                     user_name: t.user_name,
//                     user_phone: t.user_phone,
//                     tickets: [],
//                     total_paid: 0
//                 });
//             }
//             const user = usersMap.get(t.user_phone);
//             user.tickets.push(t);
//             if (t.status === 'confirmed') user.total_paid += (t.price || 0);
//         });
//         allUsers = Array.from(usersMap.values());
//         renderUsersTable(allUsers);
        
//     } catch (error) {
//         console.error('Error loading admin data:', error);
//     }
// }

// function renderRecentTickets(tickets) {
//     const container = document.getElementById('recentTicketsTable');
//     if (!container) return;
//     if (tickets.length === 0) { container.innerHTML = '<p>No hay boletos registrados</p>'; return; }
//     container.innerHTML = `<table><thead><tr><th>Boleto</th><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${tickets.map(t => `<tr><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${new Date(t.purchase_date).toLocaleDateString()}</td><td><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></td></tr>`).join('')}</tbody></table>`;
// }

// function renderPendingVouchers(vouchers) {
//     const container = document.getElementById('pendingVouchersTable');
//     if (!container) return;
//     if (vouchers.length === 0) { container.innerHTML = '<p>No hay comprobantes pendientes</p>'; return; }
//     container.innerHTML = `<table><thead><tr><th>Comprobante</th><th>Cliente</th><th>Teléfono</th><th>Boletos</th><th>Total</th><th>Acciones</th></tr></thead><tbody>${vouchers.map(t => `<tr><td><img src="${t.voucher_url}" class="voucher-preview" onclick="window.open('${t.voucher_url}', '_blank')" style="cursor:pointer;"></td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>RD$ ${(t.price || 0).toLocaleString('es-DO')}</td><td class="action-buttons"><button class="action-btn approve" onclick="approveTicket('${t.id}')">Aprobar</button><button class="action-btn reject" onclick="rejectTicket('${t.id}')">Rechazar</button><button class="action-btn delete" onclick="deleteTicket('${t.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
// }

// function renderAdminTickets(tickets) {
//     const container = document.getElementById('adminTicketsTable');
//     if (!container) return;
//     if (tickets.length === 0) { container.innerHTML = '<p>No hay boletos registrados</p>'; return; }
//     container.innerHTML = `<table><thead><tr><th>Boleto</th><th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${tickets.map(t => `<tr><td>${t.ticket_number.toString().padStart(4, '0')}</td><td>${escapeHtml(t.user_name)}</td><td>${escapeHtml(t.user_phone)}</td><td>${new Date(t.purchase_date).toLocaleDateString()}</td><td><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></td> <td class="action-buttons">${t.status === 'pending' ? `<button class="action-btn approve" onclick="approveTicket('${t.id}')">Aprobar</button><button class="action-btn reject" onclick="rejectTicket('${t.id}')">Rechazar</button>` : ''}<button class="action-btn reassign" onclick="reassignTicket('${t.id}')">Reasignar</button><button class="action-btn delete" onclick="deleteTicket('${t.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
// }

// function renderUsersTable(users) {
//     const container = document.getElementById('usersTable');
//     if (!container) return;
//     if (users.length === 0) { container.innerHTML = '<p>No hay participantes</p>'; return; }
//     container.innerHTML = `<table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Boletos</th><th>Total Pagado</th><th>Acciones</th></tr></thead><tbody>${users.map(user => `<tr><td>${escapeHtml(user.user_name)}</td><td>${escapeHtml(user.user_phone)}</td><td>${user.tickets.filter(t => t.status === 'confirmed').length} / ${user.tickets.length}</td><td>RD$ ${user.total_paid.toLocaleString('es-DO')}</td><td><button class="action-btn" onclick="viewUserTickets('${user.user_phone}')">Ver boletos</button></td></tr>`).join('')}</tbody></table>`;
// }

// function adminSearchTickets() {
//     const searchValue = document.getElementById('adminSearchInput').value.trim();
//     if (!searchValue) { renderAdminTickets(allTickets); return; }
//     const filtered = allTickets.filter(t => t.user_phone.includes(searchValue) || t.ticket_number.toString().includes(searchValue) || t.user_name.toLowerCase().includes(searchValue.toLowerCase()));
//     renderAdminTickets(filtered);
// }

// function searchUsers() {
//     const searchValue = document.getElementById('userSearchInput').value.trim();
//     if (!searchValue) { renderUsersTable(allUsers); return; }
//     const filtered = allUsers.filter(u => u.user_phone.includes(searchValue) || u.user_name.toLowerCase().includes(searchValue.toLowerCase()));
//     renderUsersTable(filtered);
// }

// function loadAllTickets() { renderAdminTickets(allTickets); document.getElementById('adminSearchInput').value = ''; }
// function loadAllUsers() { renderUsersTable(allUsers); document.getElementById('userSearchInput').value = ''; }

// async function getAvailableNumbers() {
//     const { data: soldTickets, error } = await supabaseClient
//         .from('tickets')
//         .select('ticket_number')
//         .eq('raffle_id', currentRaffle.id)
//         .eq('status', 'confirmed');
//     if (error) return [];
//     const soldNumbers = new Set(soldTickets.map(t => t.ticket_number));
//     const available = [];
//     for (let i = 1; i <= currentRaffle.total_tickets; i++) if (!soldNumbers.has(i)) available.push(i);
//     return available;
// }

// // Funciones de acción que cierran el panel antes de mostrar la modal
// async function reassignTicket(ticketId) {
//     closeAdminPanelForAction();
//     const result = await Swal.fire({
//         title: '¿Reasignar boleto?',
//         text: 'Se le asignará un nuevo número de boleto automáticamente de los disponibles',
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, reasignar',
//         cancelButtonText: 'Cancelar'
//     });
//     if (result.isConfirmed) {
//         try {
//             const availableNumbers = await getAvailableNumbers();
//             if (availableNumbers.length === 0) { Swal.fire('Error', 'No hay números de boleto disponibles', 'error'); return; }
//             const randomIndex = Math.floor(Math.random() * availableNumbers.length);
//             const newNumber = availableNumbers[randomIndex];
//             const { error } = await supabaseClient
//                 .from('tickets')
//                 .update({ ticket_number: newNumber, updated_at: new Date() })
//                 .eq('id', ticketId);
//             if (error) throw error;
//             Swal.fire('Reasignado', `Boleto reasignado a ${newNumber.toString().padStart(4, '0')}`, 'success');
//             await loadAdminData();
//             await loadRaffle();
//         } catch (error) {
//             console.error('Error reassigning ticket:', error);
//             Swal.fire('Error', 'No se pudo reasignar el boleto', 'error');
//         }
//     }
// }

// async function approveTicket(ticketId) {
//     closeAdminPanelForAction();
//     const result = await Swal.fire({
//         title: '¿Aprobar compra?',
//         text: 'Esta acción confirmará la compra y asignará los boletos',
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, aprobar',
//         cancelButtonText: 'Cancelar'
//     });
//     if (result.isConfirmed) {
//         try {
//             const { error } = await supabaseClient
//                 .from('tickets')
//                 .update({ status: 'confirmed', updated_at: new Date() })
//                 .eq('id', ticketId);
//             if (error) throw error;
//             const { data: confirmedTickets, error: countError } = await supabaseClient
//                 .from('tickets')
//                 .select('id')
//                 .eq('raffle_id', currentRaffle.id)
//                 .eq('status', 'confirmed');
//             if (!countError) {
//                 await supabaseClient
//                     .from('raffles')
//                     .update({ sold_tickets: confirmedTickets.length })
//                     .eq('id', currentRaffle.id);
//                 currentRaffle.sold_tickets = confirmedTickets.length;
//                 const percent = (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1);
//                 document.getElementById('progressFill').style.width = percent + '%';
//                 document.getElementById('progressPercentDisplay').textContent = percent + '%';
//                 document.getElementById('progressPercentage').textContent = percent + '%';
//             }
//             Swal.fire('Aprobado', 'La compra ha sido aprobada', 'success');
//             await loadAdminData();
//             await loadRaffle();
//         } catch (error) {
//             console.error('Error approving ticket:', error);
//             Swal.fire('Error', 'No se pudo aprobar la compra', 'error');
//         }
//     }
// }

// async function rejectTicket(ticketId) {
//     closeAdminPanelForAction();
//     const result = await Swal.fire({
//         title: '¿Rechazar compra?',
//         text: 'Esta acción marcará la compra como rechazada',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, rechazar',
//         cancelButtonText: 'Cancelar'
//     });
//     if (result.isConfirmed) {
//         try {
//             const { error } = await supabaseClient
//                 .from('tickets')
//                 .update({ status: 'cancelled', updated_at: new Date() })
//                 .eq('id', ticketId);
//             if (error) throw error;
//             Swal.fire('Rechazado', 'La compra ha sido rechazada', 'success');
//             await loadAdminData();
//             await loadRaffle();
//         } catch (error) {
//             console.error('Error rejecting ticket:', error);
//             Swal.fire('Error', 'No se pudo rechazar la compra', 'error');
//         }
//     }
// }

// async function deleteTicket(ticketId) {
//     closeAdminPanelForAction();
//     const result = await Swal.fire({
//         title: '¿Eliminar boleto?',
//         text: 'Esta acción no se puede deshacer',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, eliminar',
//         cancelButtonText: 'Cancelar'
//     });
//     if (result.isConfirmed) {
//         try {
//             const { error } = await supabaseClient
//                 .from('tickets')
//                 .delete()
//                 .eq('id', ticketId);
//             if (error) throw error;
//             const { data: confirmedTickets, error: countError } = await supabaseClient
//                 .from('tickets')
//                 .select('id')
//                 .eq('raffle_id', currentRaffle.id)
//                 .eq('status', 'confirmed');
//             if (!countError) {
//                 await supabaseClient
//                     .from('raffles')
//                     .update({ sold_tickets: confirmedTickets.length })
//                     .eq('id', currentRaffle.id);
//                 currentRaffle.sold_tickets = confirmedTickets.length;
//                 const percent = (confirmedTickets.length * 100 / currentRaffle.total_tickets).toFixed(1);
//                 document.getElementById('progressFill').style.width = percent + '%';
//                 document.getElementById('progressPercentDisplay').textContent = percent + '%';
//                 document.getElementById('progressPercentage').textContent = percent + '%';
//             }
//             Swal.fire('Eliminado', 'El boleto ha sido eliminado', 'success');
//             await loadAdminData();
//             await loadRaffle();
//         } catch (error) {
//             console.error('Error deleting ticket:', error);
//             Swal.fire('Error', 'No se pudo eliminar el boleto', 'error');
//         }
//     }
// }

// function viewUserTickets(phone) {
//     closeAdminPanelForAction();
//     const userTickets = allTickets.filter(t => t.user_phone === phone);
//     const user = allUsers.find(u => u.user_phone === phone);
//     let html = `<h4>Boletos de ${escapeHtml(user?.user_name)} (${phone})</h4><div class="tickets-badges-grid">`;
//     userTickets.forEach(t => { html += `<div class="ticket-item-wrapper"><div class="ticket-badge-modern">🎫 ${t.ticket_number.toString().padStart(4, '0')}</div><div><span class="status-badge status-${t.status}">${t.status === 'pending' ? 'Pendiente' : t.status === 'confirmed' ? 'Verificado' : 'Anulado'}</span></div></div>`; });
//     html += '</div>';
//     Swal.fire({ title: 'Boletos del usuario', html: html, confirmButtonText: 'Cerrar', confirmButtonColor: '#1c8200' });
// }

// function openAdminPanel() {
//     if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
//     document.getElementById('adminPanel').classList.add('show');
//     loadAdminData();
// }

// function closeAdminPanel() { document.getElementById('adminPanel').classList.remove('show'); }

// // ==================== CONFIGURACIÓN ====================
// async function saveConfig(event) {
//     event.preventDefault();
//     if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
//     showButtonLoading('saveConfigBtn', 'Guardando...');
//     const id = document.getElementById('configId').value;
//     const site_name = document.getElementById('configSiteName').value;
//     const location = document.getElementById('configLocation').value;
//     const description = document.getElementById('configDescription').value;
//     const ceo = document.getElementById('configCeo').value;
//     const whatsapp = document.getElementById('configWhatsapp').value;
//     const instagram_url = document.getElementById('configInstagram').value;
//     const logoFile = document.getElementById('logoImageFile').files[0];
//     let logo_url = document.getElementById('logoImagePreview').src;
//     try {
//         if (logoFile && logoFile.size > 0) {
//             const fileExt = logoFile.name.split('.').pop();
//             const fileName = `logo_${Date.now()}.${fileExt}`;
//             const { data, error } = await supabaseClient.storage.from('site-assets').upload(fileName, logoFile);
//             if (!error) { const { data: urlData } = supabaseClient.storage.from('site-assets').getPublicUrl(fileName); logo_url = urlData.publicUrl; }
//         }
//         const configData = { site_name, location, description, ceo, whatsapp, instagram_url, logo_url, updated_at: new Date() };
//         let error;
//         if (id) { const { error: updateError } = await supabaseClient.from('site_config').update(configData).eq('id', id); error = updateError; }
//         else { configData.created_at = new Date(); const { error: insertError } = await supabaseClient.from('site_config').insert([configData]); error = insertError; }
//         if (error) throw error;
//         Swal.fire('Guardado', 'Configuración guardada correctamente', 'success');
//         closeConfigModal();
//         loadConfig();
//     } catch (error) { console.error('Error saving config:', error); Swal.fire('Error', 'No se pudo guardar la configuración', 'error'); }
//     finally { hideButtonLoading('saveConfigBtn'); }
// }

// function openConfigModal() {
//     if (!currentUser) { Swal.fire('Acceso denegado', 'Debes iniciar sesión como administrador', 'warning'); return; }
//     const modal = document.getElementById('configModal');
//     modal.style.display = 'flex';
//     modal.style.visibility = 'visible';
//     modal.style.opacity = '1';
// }

// function closeConfigModal() {
//     const modal = document.getElementById('configModal');
//     modal.style.display = 'none';
//     modal.style.visibility = 'hidden';
//     modal.style.opacity = '0';
// }

// function closeModal() { const modal = document.getElementById('successModal'); modal.classList.remove('show'); }

// // ==================== LOGIN ====================
// async function handleLogin(email, password) {
//     showButtonLoading('loginBtn', 'Ingresando...');
//     try {
//         const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
//         if (error) throw error;
//         currentUser = data.user;
//         Swal.fire('¡Bienvenido!', 'Has iniciado sesión como administrador', 'success');
//         closeLoginModal();
//         document.getElementById('statsButton').style.display = 'flex';
//         document.getElementById('settingsButton').style.display = 'flex';
//         document.getElementById('userIcon').style.color = '#dc3545';
//         if (currentRaffle) loadAdminData();
//     } catch (error) { console.error('Login error:', error); Swal.fire('Error', 'Credenciales incorrectas', 'error'); }
//     finally { hideButtonLoading('loginBtn'); }
// }

// async function handleLogout() {
//     try {
//         await supabaseClient.auth.signOut();
//         currentUser = null;
//         Swal.fire('Sesión cerrada', 'Has cerrado sesión correctamente', 'success');
//         document.getElementById('statsButton').style.display = 'none';
//         document.getElementById('settingsButton').style.display = 'none';
//         document.getElementById('userIcon').style.color = '#1c8200';
//         closeAdminPanel();
//         if (currentRaffle) loadRaffle();
//     } catch (error) {
//         console.error('Logout error:', error);
//     }
// }

// function openLoginModal() {
//     document.getElementById('loginModal').classList.add('show');
// }

// function closeLoginModal() {
//     document.getElementById('loginModal').classList.remove('show');
// }

// // ==================== EVENT LISTENERS ====================
// document.getElementById('btnMinus')?.addEventListener('click', () => updateQuantity(-1));
// document.getElementById('btnPlus')?.addEventListener('click', () => updateQuantity(1));
// document.getElementById('btnSearch')?.addEventListener('click', searchTickets);
// document.getElementById('btnConfirm')?.addEventListener('click', confirmPurchase);
// document.getElementById('searchInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchTickets(); });
// document.getElementById('voucherFile')?.addEventListener('change', handleVoucherFileSelect);
// document.getElementById('configForm')?.addEventListener('submit', saveConfig);
// document.getElementById('userIcon')?.addEventListener('click', () => {
//     if (currentUser) {
//         handleLogout();
//     } else {
//         openLoginModal();
//     }
// });
// document.getElementById('loginForm')?.addEventListener('submit', (e) => {
//     e.preventDefault();
//     const email = document.getElementById('loginEmail').value;
//     const password = document.getElementById('loginPassword').value;
//     handleLogin(email, password);
// });

// document.querySelectorAll('.admin-tab').forEach(tab => {
//     tab.addEventListener('click', () => {
//         document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
//         document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
//         tab.classList.add('active');
//         document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
//     });
// });

// $(window).scroll(function() { if ($(this).scrollTop() > 20) $('#navbar').addClass('header-scrolled'); else $('#navbar').removeClass('header-scrolled'); });
// $("#navbarNav").on("click", "a", function() { $(".navbar-toggler").click(); });
// $(".nav-item").on("click", "a", function() { $("#navbarNav").removeClass('show'); });

// async function init() {
//     await loadConfig();
//     await loadPaymentMethods();
//     await loadRaffle();
//     supabaseClient.auth.getSession().then(({ data: { session } }) => {
//         if (session) {
//             currentUser = session.user;
//             document.getElementById('statsButton').style.display = 'flex';
//             document.getElementById('settingsButton').style.display = 'flex';
//             document.getElementById('userIcon').style.color = '#dc3545';
//             loadAdminData();
//         } else {
//             document.getElementById('statsButton').style.display = 'none';
//             document.getElementById('settingsButton').style.display = 'none';
//         }
//     });
// }
// init();
