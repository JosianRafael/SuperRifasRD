// ==================== FUNCIONES DE IMPRESIÓN ====================
function printTicketModal(ticketNumber, userName, userPhone, purchaseDate, status) {
    const ticketHTML = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Boleto</title><style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Courier New',monospace;background:white;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;}
            .ticket{width:320px;background:white;border:2px solid #000;padding:20px;margin:0 auto;}
            .center{text-align:center;}
            .bold{font-weight:bold;}
            .separator{border-top:1px dashed #000;margin:12px 0;}
            .ticket-number{background:#000;color:white;padding:12px;text-align:center;margin:12px 0;font-size:28px;letter-spacing:3px;}
            .info-line{display:flex;justify-content:space-between;margin:8px 0;}
            .logo-img{max-width:80px;margin:0 auto 10px;display:block;border-radius:50%;}
        </style></head>
        <body><div class="ticket"><div class="center"><img src="${document.getElementById('navbarLogo').src}" class="logo-img"><div class="bold" style="font-size:18px;">Super Rifas RD</div></div>
        <div class="separator"></div><div class="center bold">${currentRaffle.name}</div><div class="separator"></div>
        <div class="ticket-number">${ticketNumber}</div>
        <div class="info-line"><span>PARTICIPANTE:</span><span class="bold">${userName.toUpperCase()}</span></div>
        <div class="info-line"><span>TELÉFONO:</span><span class="bold">${userPhone}</span></div>
        <div class="info-line"><span>FECHA:</span><span class="bold">${purchaseDate}</span></div>
        <div class="info-line"><span>ESTADO:</span><span class="bold">${status === 'pending' ? 'PENDIENTE' : status === 'confirmed' ? 'VERIFICADO' : 'ANULADO'}</span></div>
        <div class="separator"></div><div class="center bold">SORTEO AL COMPLETAR EL 100%</div>
        <div class="center small">¡ESTE BOLETO TE HACE PARTICIPANTE!</div>
        <div class="separator"></div><div class="center small">📱 WHATSAPP: +1 8295026484</div>
        <div class="center small">📷 INSTAGRAM: Super Rifas RD</div></div></body></html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.print();
}

async function downloadTicketAsPNG(ticketNumber, userName, userPhone, purchaseDate, status) {
    const ticketHTML = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Boleto</title><style>
            *{margin:0;padding:0;box-sizing:border-box;}
            body{font-family:'Courier New',monospace;background:white;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px;}
            .ticket{width:320px;background:white;border:2px solid #000;padding:20px;}
            .center{text-align:center;}
            .bold{font-weight:bold;}
            .separator{border-top:1px dashed #000;margin:12px 0;}
            .ticket-number{background:#000;color:white;padding:12px;text-align:center;margin:12px 0;font-size:28px;letter-spacing:3px;}
            .info-line{display:flex;justify-content:space-between;margin:8px 0;}
            .logo-img{max-width:80px;margin:0 auto 10px;display:block;border-radius:50%;}
        </style></head>
        <body><div class="ticket"><div class="center"><img src="${document.getElementById('navbarLogo').src}" class="logo-img"><div class="bold" style="font-size:18px;">Super Rifas RD</div></div>
        <div class="separator"></div><div class="center bold">${currentRaffle.name}</div><div class="separator"></div>
        <div class="ticket-number">${ticketNumber}</div>
        <div class="info-line"><span>PARTICIPANTE:</span><span class="bold">${userName.toUpperCase()}</span></div>
        <div class="info-line"><span>TELÉFONO:</span><span class="bold">${userPhone}</span></div>
        <div class="info-line"><span>FECHA:</span><span class="bold">${purchaseDate}</span></div>
        <div class="info-line"><span>ESTADO:</span><span class="bold">${status === 'pending' ? 'PENDIENTE' : status === 'confirmed' ? 'VERIFICADO' : 'ANULADO'}</span></div>
        <div class="separator"></div><div class="center bold">SORTEO AL COMPLETAR EL 100%</div>
        <div class="center small">¡ESTE BOLETO TE HACE PARTICIPANTE!</div>
        <div class="separator"></div><div class="center small">📱 WHATSAPP: +1 8295026484</div>
        <div class="center small">📷 INSTAGRAM: @Super_Rifas_RD</div></div></body></html>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.innerHTML = ticketHTML;
    document.body.appendChild(tempDiv);
    
    const ticketElement = tempDiv.querySelector('.ticket');
    
    try {
        const canvas = await html2canvas(ticketElement, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
        const link = document.createElement('a');
        link.download = `boleto_${ticketNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        Swal.fire({ icon: 'success', title: '¡Descarga completada!', timer: 2000, showConfirmButton: false, toast: true });
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'No se pudo generar la imagen', 'error');
    } finally {
        document.body.removeChild(tempDiv);
    }
}