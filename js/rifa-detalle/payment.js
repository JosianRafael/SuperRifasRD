// ==================== MÉTODOS DE PAGO ====================
async function loadPaymentMethods() {
    try {
        const { data, error } = await supabaseClient
            .from('payment_accounts')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        paymentMethods = data;
        renderPaymentMethods();
    } catch (error) {
        console.error('Error loading payment methods:', error);
        paymentMethods = [
            { id: 'efectivo', bank_name: 'EFECTIVO', logo_url: null, account_type: 'Pago en efectivo', account_number: null, holder_name: 'Super Rifas RD - Punto de Pago' }
        ];
        renderPaymentMethods();
    }
}

function renderPaymentMethods() {
    const container = document.getElementById('paymentMethods');
    if (!container) return;
    
    container.innerHTML = '';
    paymentMethods.forEach((method, index) => {
        const div = document.createElement('div');
        div.className = 'payment-card' + (index === 0 ? ' selected' : '');
        div.innerHTML = `
            <img src="${method.logo_url || 'https://via.placeholder.com/50x50?text=Banco'}" alt="${method.bank_name}" style="height: 35px; object-fit: contain;">
            <p>${method.bank_name}</p>
        `;
        div.onclick = () => selectPaymentMethod(method.id);
        container.appendChild(div);
    });
    
    if (paymentMethods.length > 0) {
        selectPaymentMethod(paymentMethods[0].id);
    }
}

function selectPaymentMethod(methodId) {
    currentPaymentMethod = paymentMethods.find(m => m.id === methodId);
    
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
    const idx = paymentMethods.findIndex(m => m.id === methodId);
    if (document.querySelectorAll('.payment-card')[idx]) {
        document.querySelectorAll('.payment-card')[idx].classList.add('selected');
    }
    
    const bankInfo = document.getElementById('bankInfo');
    if (currentPaymentMethod.bank_name === 'EFECTIVO' || !currentPaymentMethod.account_number) {
        bankInfo.innerHTML = `
            <div class="bank-detail-row">
                <span class="bank-detail-label">Titular:</span>
                <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.holder_name || 'Super Rifas RD')}</span>
            </div>
        `;
    } else {
        bankInfo.innerHTML = `
            <div class="bank-detail-row">
                <span class="bank-detail-label">${currentPaymentMethod.account_type || 'Cuenta'}:</span>
                <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.account_number)}</span>
            </div>
            <div class="bank-detail-row">
                <span class="bank-detail-label">Titular:</span>
                <span class="bank-detail-value">${escapeHtml(currentPaymentMethod.holder_name)}</span>
            </div>
            <button class="copy-btn-modern" onclick="copyToClipboard('${escapeHtml(currentPaymentMethod.account_number)}')"><i class="fa fa-copy"></i> Copiar cuenta</button>
        `;
    }
}