const API_URL = "https://script.google.com/macros/s/AKfycbxKALUYq0h--u8J121LOA7utUZLzrxWIbuxvGskE7_lC52ppFjJ7zCeUio5Bd62VIJw1Q/exec";

/* --------------------------------------------------------------------------
   1. CONSUMO DE API (GOOGLE APPS SCRIPT)
   -------------------------------------------------------------------------- */
async function consumirAPI(accion, datosExtra = null) {
    try {
        if (datosExtra) {
            let respuesta = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify({ accion: accion, ...datosExtra })
            });
            return respuesta;
        } else {
            let res = await fetch(`${API_URL}?accion=${accion}&nocache=${new Date().getTime()}`);
            return await res.json();
        }
    } catch (error) {
        console.error("Error en la conexión con la API:", error);
        return null;
    }
}

/* --------------------------------------------------------------------------
   2. GENERADOR DE SKELETON LOADERS (SHIMMER)
   -------------------------------------------------------------------------- */
function generarSkeletonCards(cantidad = 6) {
    let html = '';
    for (let i = 0; i < cantidad; i++) {
        html += `
            <div class="skeleton-card">
                <div>
                    <div class="skeleton-shimmer skeleton-img"></div>
                    <div class="skeleton-shimmer skeleton-line" style="width: 75%;"></div>
                    <div class="skeleton-shimmer skeleton-line medium"></div>
                    <div class="skeleton-shimmer skeleton-line short"></div>
                </div>
                <div>
                    <div class="skeleton-shimmer skeleton-line" style="width: 50%; height: 22px; margin: 10px 0;"></div>
                    <div class="skeleton-shimmer skeleton-btn"></div>
                    <div class="skeleton-shimmer skeleton-btn" style="height: 36px; margin-top: 8px;"></div>
                </div>
            </div>`;
    }
    return html;
}

/* --------------------------------------------------------------------------
   3. SISTEMA DE NOTIFICACIONES TOAST ULTRA-MODERNAS
   -------------------------------------------------------------------------- */
function mostrarToast(titulo, mensaje, sucursal = '', accionTexto = 'Ver Carrito 🛍️', accionCallback = abrirCarritoGlobal) {
    let container = document.getElementById('mvrToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mvrToastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    let sucursalClase = '';
    let sucLower = String(sucursal).toLowerCase();
    if (sucLower.includes('marcel')) sucursalClase = 'toast-marcel';
    else if (sucLower.includes("d'villa") || sucLower.includes('dvilla')) sucursalClase = 'toast-dvilla';
    else if (sucLower.includes('ravali')) sucursalClase = 'toast-ravali';

    const toast = document.createElement('div');
    toast.className = `toast-item ${sucursalClase}`;
    toast.innerHTML = `
        <div class="toast-icon">✨</div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-msg">${mensaje}</div>
        </div>
        ${accionTexto ? `<button class="toast-action-btn">${accionTexto}</button>` : ''}
    `;

    if (accionTexto && accionCallback) {
        const btn = toast.querySelector('.toast-action-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                accionCallback();
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 350);
            });
        }
    }

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 350);
        }
    }, 3800);
}

/* --------------------------------------------------------------------------
   4. GESTIÓN DEL CARRITO GLOBAL CON CONTROL DE CANTIDADES Y TALLAS
   -------------------------------------------------------------------------- */
function obtenerCarrito() {
    try {
        return JSON.parse(localStorage.getItem('mvr_carrito_global')) || [];
    } catch (e) {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem('mvr_carrito_global', JSON.stringify(carrito));
    actualizarContadorCarrito();
    
    // Animación de pulso receptivo en el botón flotante del carrito
    const btnCarrito = document.getElementById('btnFlotanteCarrito');
    if (btnCarrito) {
        btnCarrito.classList.remove('cart-bouncing');
        void btnCarrito.offsetWidth; // Forzar reflow para reiniciar animación
        btnCarrito.classList.add('cart-bouncing');
    }
}

function actualizarContadorCarrito() {
    let carrito = obtenerCarrito();
    let totalItems = carrito.reduce((sum, item) => sum + (parseInt(item.cantidad) || 1), 0);
    const contador = document.getElementById('contadorCarrito');
    if (contador) {
        contador.innerText = totalItems;
        contador.style.animation = 'none';
        void contador.offsetWidth;
        contador.style.animation = 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
}

function agregarAlCarrito(id, nombre, precio, sucursal, imagen = '', talla = null) {
    let carrito = obtenerCarrito();
    let index = -1;

    // Buscar si ya existe el producto con la misma talla (o sin talla)
    if (talla) {
        index = carrito.findIndex(item => item.id === id && item.talla === talla);
    } else {
        index = carrito.findIndex(item => item.id === id && !item.talla);
    }

    if (index > -1) {
        carrito[index].cantidad = (parseInt(carrito[index].cantidad) || 1) + 1;
    } else {
        carrito.push({
            id: String(id),
            nombre: String(nombre),
            precio: parseFloat(precio) || 0,
            sucursal: String(sucursal || 'Grupo MVR'),
            imagen: imagen || '',
            talla: talla ? String(talla) : null,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);

    let mensajeToast = talla ? `Talla: <strong>${talla}</strong> (${sucursal})` : `${sucursal}`;
    mostrarToast(`¡${nombre} agregado!`, mensajeToast, sucursal);
}

function modificarCantidadItemCarrito(index, cambio) {
    let carrito = obtenerCarrito();
    if (!carrito[index]) return;

    carrito[index].cantidad = (parseInt(carrito[index].cantidad) || 1) + cambio;

    if (carrito[index].cantidad <= 0) {
        eliminarItemCarrito(index);
        return;
    }

    guardarCarrito(carrito);
    abrirCarritoGlobal();
}

function eliminarItemCarrito(index) {
    let itemEl = document.getElementById(`itemCarritoRow_${index}`);
    if (itemEl) {
        itemEl.classList.add('eliminando');
        setTimeout(() => {
            let carrito = obtenerCarrito();
            carrito.splice(index, 1);
            guardarCarrito(carrito);
            abrirCarritoGlobal();
        }, 320);
    } else {
        let carrito = obtenerCarrito();
        carrito.splice(index, 1);
        guardarCarrito(carrito);
        abrirCarritoGlobal();
    }
}

function vaciarCarrito() {
    if (confirm("¿Estás seguro de vaciar todos los productos del carrito?")) {
        localStorage.removeItem('mvr_carrito_global');
        actualizarContadorCarrito();
        abrirCarritoGlobal();
        mostrarToast("Carrito vaciado", "Has retirado todos los productos.", "");
    }
}

// Estado de Checkout en Carrito
window.checkoutEstado = {
    metodoPago: 'Contado',
    metodoEntrega: 'Sucursal'
};

function seleccionarMetodoPago(tipo) {
    window.checkoutEstado.metodoPago = tipo;
    const btnContado = document.getElementById('btnPagoContado');
    const btnVale = document.getElementById('btnPagoVale');
    const boxPromotora = document.getElementById('campoPromotoraBox');

    if (tipo === 'Vale') {
        if (btnVale) btnVale.classList.add('activo');
        if (btnContado) btnContado.classList.remove('activo');
        if (boxPromotora) boxPromotora.style.display = 'block';
    } else {
        if (btnContado) btnContado.classList.add('activo');
        if (btnVale) btnVale.classList.remove('activo');
        if (boxPromotora) boxPromotora.style.display = 'none';
    }
}

function seleccionarMetodoEntrega(tipo) {
    window.checkoutEstado.metodoEntrega = tipo;
    const btnSucursal = document.getElementById('btnEntregaSucursal');
    const btnDom = document.getElementById('btnEntregaDomicilio');
    const boxSucursal = document.getElementById('campoSucursalBox');
    const boxDom = document.getElementById('campoDomicilioBox');

    if (tipo === 'Domicilio') {
        if (btnDom) btnDom.classList.add('activo');
        if (btnSucursal) btnSucursal.classList.remove('activo');
        if (boxDom) boxDom.style.display = 'block';
        if (boxSucursal) boxSucursal.style.display = 'none';
    } else {
        if (btnSucursal) btnSucursal.classList.add('activo');
        if (btnDom) btnDom.classList.remove('activo');
        if (boxSucursal) boxSucursal.style.display = 'block';
        if (boxDom) boxDom.style.display = 'none';
    }
}

function abrirCarritoGlobal() {
    let carrito = obtenerCarrito();
    let listaDiv = document.getElementById('listaProductosCarrito');
    let totalMxn = 0;
    
    if (!listaDiv) return;
    listaDiv.innerHTML = "";

    if (carrito.length === 0) {
        listaDiv.innerHTML = `
            <div class="carrito-vacio-container">
                <div class="carrito-vacio-icon">🛒</div>
                <h4 style="color: var(--color-primary); margin: 0 0 5px 0;">Tu carrito está vacío</h4>
                <p style="margin: 0; font-size: 0.88rem;">Explora los catálogos y añade tus productos y estilos favoritos.</p>
            </div>`;
    } else {
        carrito.forEach((item, index) => {
            let cant = parseInt(item.cantidad) || 1;
            let subtotal = (parseFloat(item.precio) || 0) * cant;
            totalMxn += subtotal;
            let subtotalFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotal);
            let precioUnitFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.precio || 0);
            let imgDefault = item.sucursal.includes('Marcel') ? 'marcel.png' : (item.sucursal.includes('Ravali') ? 'ravali.jpg' : 'dvilla.jpg');
            let imgThumb = (item.imagen && item.imagen.trim() !== '') ? item.imagen : imgDefault;

            let badgeTallaHtml = item.talla ? `<span class="badge-talla">Talla: ${item.talla}</span>` : '';

            listaDiv.innerHTML += `
                <div id="itemCarritoRow_${index}" class="item-carrito-card">
                    <img src="${imgThumb}" class="item-carrito-thumb" onerror="this.src='mvr.png';" alt="${item.nombre}">
                    <div class="item-carrito-details">
                        <div class="item-carrito-title">${item.nombre} ${badgeTallaHtml}</div>
                        <div class="item-carrito-meta">${item.sucursal} · ${precioUnitFmt} c/u</div>
                        <div class="item-carrito-price">${subtotalFmt}</div>
                    </div>
                    <div class="item-carrito-controls">
                        <div class="control-qty-box">
                            <button class="btn-qty" onclick="modificarCantidadItemCarrito(${index}, -1)" title="Reducir">-</button>
                            <span class="qty-display">${cant}</span>
                            <button class="btn-qty" onclick="modificarCantidadItemCarrito(${index}, 1)" title="Aumentar">+</button>
                        </div>
                        <button class="btn-eliminar-item" onclick="eliminarItemCarrito(${index})">🗑️ Eliminar</button>
                    </div>
                </div>`;
        });

        // Calculadora de Quincenas dentro del Carrito
        let pago8Q = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalMxn / 8);
        listaDiv.innerHTML += `
            <div class="calculadora-quincenas-carrito">
                <span>💳 <strong>¿Pagas con Vale?</strong></span>
                <span>Paga solo <strong>${pago8Q}</strong> quincenales (a 8 quincenas ⭐)</span>
            </div>
        `;

        // Formulario de Checkout Inteligente
        listaDiv.innerHTML += `
            <div class="checkout-seccion-box">
                <div class="checkout-titulo">💳 1. Modalidad de Pago</div>
                <div class="selector-pills-grid">
                    <button type="button" id="btnPagoContado" class="btn-pill-option ${window.checkoutEstado.metodoPago === 'Contado' ? 'activo' : ''}" onclick="seleccionarMetodoPago('Contado')">💵 Contado / Transf.</button>
                    <button type="button" id="btnPagoVale" class="btn-pill-option ${window.checkoutEstado.metodoPago === 'Vale' ? 'activo' : ''}" onclick="seleccionarMetodoPago('Vale')">🎟️ Vale de Promotora</button>
                </div>
                <div id="campoPromotoraBox" style="display: ${window.checkoutEstado.metodoPago === 'Vale' ? 'block' : 'none'}; margin-bottom: 0.8rem;">
                    <label style="font-size: 0.8rem; font-weight: bold; color: #555;">ID o Nombre de tu Promotora:</label>
                    <input type="text" id="inputPromotoraAsignada" class="input-checkout-field" placeholder="Ej. P-4502 / María López">
                </div>

                <div class="checkout-titulo">🚚 2. Método de Entrega</div>
                <div class="selector-pills-grid">
                    <button type="button" id="btnEntregaSucursal" class="btn-pill-option ${window.checkoutEstado.metodoEntrega === 'Sucursal' ? 'activo' : ''}" onclick="seleccionarMetodoEntrega('Sucursal')">🏪 En Sucursal</button>
                    <button type="button" id="btnEntregaDomicilio" class="btn-pill-option ${window.checkoutEstado.metodoEntrega === 'Domicilio' ? 'activo' : ''}" onclick="seleccionarMetodoEntrega('Domicilio')">🛵 A Domicilio</button>
                </div>
                <div id="campoSucursalBox" style="display: ${window.checkoutEstado.metodoEntrega === 'Sucursal' ? 'block' : 'none'}; margin-bottom: 0.8rem;">
                    <label style="font-size: 0.8rem; font-weight: bold; color: #555;">Sucursal para entrega:</label>
                    <select id="selectSucursalRecoger" class="input-checkout-field">
                        <option value="Óptica D'villa">Óptica D'villa</option>
                        <option value="Óptica Ravali">Óptica Ravali</option>
                        <option value="Marcel Boutique">Marcel Boutique</option>
                    </select>
                </div>
                <div id="campoDomicilioBox" style="display: ${window.checkoutEstado.metodoEntrega === 'Domicilio' ? 'block' : 'none'}; margin-bottom: 0.8rem;">
                    <label style="font-size: 0.8rem; font-weight: bold; color: #555;">Dirección Completa de Envío:</label>
                    <input type="text" id="inputDireccionEnvio" class="input-checkout-field" placeholder="Calle, número, colonia y ciudad">
                </div>

                <div class="checkout-titulo">👤 3. Datos del Comprador</div>
                <input type="text" id="inputNombreClienteCarrito" class="input-checkout-field" placeholder="Tu Nombre Completo (Opcional)">
                <input type="tel" id="inputTelefonoClienteCarrito" class="input-checkout-field" placeholder="Teléfono de Contacto (Opcional)">
            </div>
        `;
    }

    const totalSpan = document.getElementById('totalCarritoMxn');
    if (totalSpan) {
        totalSpan.innerText = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalMxn);
    }

    const modalCarrito = document.getElementById('modalCarritoGlobal');
    if (modalCarrito) {
        modalCarrito.style.display = 'flex';
    }
}

function cerrarCarritoGlobal() {
    const modalCarrito = document.getElementById('modalCarritoGlobal');
    if (modalCarrito) {
        modalCarrito.style.display = 'none';
    }
}

function enviarPedidoWhatsApp() {
    let carrito = obtenerCarrito();
    if (carrito.length === 0) return alert("El carrito está vacío.");

    const folioPedido = "PED-" + Math.floor(10000 + Math.random() * 90000);
    const nombreCliente = document.getElementById('inputNombreClienteCarrito')?.value.trim() || 'Cliente';
    const telCliente = document.getElementById('inputTelefonoClienteCarrito')?.value.trim() || 'No especificado';
    const esVale = window.checkoutEstado.metodoPago === 'Vale';
    const promotora = document.getElementById('inputPromotoraAsignada')?.value.trim() || 'No especificada';
    const esDomicilio = window.checkoutEstado.metodoEntrega === 'Domicilio';
    const sucursalRecoger = document.getElementById('selectSucursalRecoger')?.value || "Sucursal Principal";
    const direccionEnvio = document.getElementById('inputDireccionEnvio')?.value.trim() || 'Por coordinar';

    let total = 0;
    let mensaje = `🌟 *NUEVO PEDIDO EN GRUPO MVR* 🌟\n`;
    mensaje += `📄 *Folio de Pedido:* #${folioPedido}\n`;
    mensaje += `👤 *Cliente:* ${nombreCliente} (Tel: ${telCliente})\n`;
    mensaje += `💳 *Método de Pago:* ${esVale ? `🎟️ Crédito con Vale (Promotora: ${promotora})` : '💵 Contado / Transferencia'}\n`;
    mensaje += `🚚 *Entrega:* ${esDomicilio ? `🛵 Envío a Domicilio (${direccionEnvio})` : `🏪 Recoger en ${sucursalRecoger}`}\n\n`;
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🛍️ *PRODUCTOS SELECCIONADOS:*\n`;

    carrito.forEach((item, i) => {
        let cant = parseInt(item.cantidad) || 1;
        let sub = (parseFloat(item.precio) || 0) * cant;
        total += sub;
        let subFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(sub);
        let tallaTxt = item.talla ? ` [Talla: *${item.talla}*]` : '';
        mensaje += `${i + 1}. *${item.nombre}*${tallaTxt}\n`;
        mensaje += `   📍 Sucursal: ${item.sucursal}\n`;
        mensaje += `   📦 Cantidad: ${cant} | Subtotal: ${subFmt}\n\n`;
    });

    let totalFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total);
    let pago8QFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total / 8);

    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `💰 *TOTAL GENERAL:* ${totalFmt}\n`;
    if (esVale) {
        mensaje += `💳 *Plan Estimado:* 8 quincenas de ${pago8QFmt} MXN\n`;
    }
    mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    mensaje += `Quedo a la espera de la confirmación de existencias y datos de pago/entrega. ¡Muchas gracias!`;

    window.open(`https://wa.me/528332854129?text=${encodeURIComponent(mensaje)}`, '_blank');
}

/* --------------------------------------------------------------------------
   5. SOLICITUD DE RESURTIDO Y APARTADO DE PRODUCTOS AGOTADOS
   -------------------------------------------------------------------------- */
function solicitarResurtidoWhatsApp(id, nombre, sucursal, talla = null) {
    let tallaTxt = talla ? ` en talla *${talla}*` : '';
    let mensaje = `Hola Grupo MVR, estoy muy interesado(a) en el producto *${nombre}* (ID: ${id})${tallaTxt} de la sucursal *${sucursal}*, que actualmente aparece agotado en el catálogo.\n\n¿Podrían informarme cuándo tendrán resurtido o cómo puedo apartarlo? ¡Muchas gracias!`;
    window.open(`https://wa.me/528332854129?text=${encodeURIComponent(mensaje)}`, '_blank');
}

/* --------------------------------------------------------------------------
   6. MODO OSCURO / DARK MODE LUXURY
   -------------------------------------------------------------------------- */
function inicializarTema() {
    const temaGuardado = localStorage.getItem('mvr_theme') || 'light';
    document.documentElement.setAttribute('data-theme', temaGuardado);
    actualizarBotonesTema(temaGuardado);
}

function toggleModoOscuro() {
    const temaActual = document.documentElement.getAttribute('data-theme') || 'light';
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevoTema);
    localStorage.setItem('mvr_theme', nuevoTema);
    actualizarBotonesTema(nuevoTema);
    mostrarToast(
        nuevoTema === 'dark' ? 'Modo Oscuro Activado 🌙' : 'Modo Claro Activado ☀️',
        'Tu preferencia de visualización ha sido guardada.',
        '',
        'Entendido'
    );
}

function actualizarBotonesTema(tema) {
    document.querySelectorAll('.btn-theme-toggle').forEach(btn => {
        btn.innerHTML = tema === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    });
}

/* --------------------------------------------------------------------------
   7. SPEED DIAL FLOTANTE MULTICANAL DE WHATSAPP
   -------------------------------------------------------------------------- */
function toggleSpeedDial() {
    const menu = document.getElementById('mvrSpeedDialMenu');
    const mainBtn = document.getElementById('mvrSpeedDialBtn');
    if (!menu) return;
    const estaAbierto = menu.classList.toggle('abierto');
    if (mainBtn) {
        mainBtn.innerHTML = estaAbierto ? '✕' : '💬';
        mainBtn.style.transform = estaAbierto ? 'rotate(90deg)' : 'rotate(0deg)';
    }
}

/* --------------------------------------------------------------------------
   8. MODAL DE VISTA RÁPIDA / ZOOM DE PRODUCTO (QUICK VIEW)
   -------------------------------------------------------------------------- */
function abrirVistaRapidaProducto(id, nombre, precio, sucursal, imagen, stock = 1, tallas = null) {
    let modal = document.getElementById('modalQuickViewMVR');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalQuickViewMVR';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    const precioNum = parseFloat(precio) || 0;
    const precioFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precioNum);
    const quincena8 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precioNum / 8);
    const agotado = parseInt(stock) <= 0;

    let tallasArray = [];
    if (tallas) {
        tallasArray = typeof tallas === 'string' ? tallas.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tallas) ? tallas : []);
    }

    let tallasHtml = '';
    if (tallasArray.length > 0) {
        tallasHtml = `
            <div style="margin: 1rem 0;">
                <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 6px;">Selecciona tu Talla:</label>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="quickViewTallasGroup">
                    ${tallasArray.map((t, idx) => `
                        <button type="button" class="btn-talla ${idx === 0 ? 'activo' : ''}" onclick="seleccionarTallaQuickView('${t}', this)">${t}</button>
                    `).join('')}
                </div>
            </div>`;
    }

    modal.innerHTML = `
        <div class="modal-content modal-quick-view-card">
            <button class="close-btn" onclick="cerrarVistaRapida()">×</button>
            <div class="quick-view-img-box">
                <img src="${imagen}" onerror="this.onerror=null; this.src='mvr.png';" alt="${nombre}">
                ${agotado ? '<div class="ribbon-agotado">🏷️ AGOTADO</div>' : ''}
            </div>
            <div>
                <span class="badge-optica ${sucursal.includes('Ravali') ? 'badge-ravali' : (sucursal.includes('Marcel') ? 'badge-marcel' : 'badge-dvilla')}">${sucursal}</span>
                <h2 style="color: var(--color-primary); margin: 0.5rem 0; font-size: 1.45rem;">${nombre}</h2>
                <div style="font-size: 1.6rem; font-weight: 900; color: var(--color-primary); margin-bottom: 0.4rem;">${precioFmt} MXN</div>
                
                <div style="background: var(--color-primary-light); color: var(--color-primary); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; display: inline-flex; align-items: center; gap: 6px;">
                    💳 8 quincenas de ${quincena8} con Vale
                </div>

                <p style="color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.5; margin: 0.5rem 0;">
                    Calidad garantizada, diseño exclusivo y la mejor comodidad para tu visión y estilo en Grupo MVR.
                </p>

                ${tallasHtml}

                <div style="margin-top: 1.5rem; display: flex; gap: 10px; flex-wrap: wrap;">
                    ${agotado ? `
                        <button onclick="cerrarVistaRapida(); solicitarResurtidoWhatsApp('${id}', '${String(nombre).replace(/'/g, "")}', '${sucursal}', window.quickViewTallaSeleccionada || '${tallasArray[0] || ''}')" class="btn-solicitar-resurtido" style="flex: 1;">
                            📲 Solicitar Resurtido / Apartar
                        </button>
                    ` : `
                        <button onclick="cerrarVistaRapida(); agregarAlCarritoGlobal('${id}', '${String(nombre).replace(/'/g, "")}', ${precioNum}, '${sucursal}', '${imagen}', window.quickViewTallaSeleccionada || '${tallasArray[0] || ''}')" class="btn btn-shimmer-shine" style="flex: 1; padding: 0.85rem; font-weight: 800; border-radius: var(--radius-sm);">
                            🛍️ Agregar al Carrito
                        </button>
                    `}
                </div>
            </div>
        </div>`;

    window.quickViewTallaSeleccionada = tallasArray[0] || null;
    modal.classList.add('mostrar');
}

function seleccionarTallaQuickView(talla, btn) {
    window.quickViewTallaSeleccionada = talla;
    const grupo = document.getElementById('quickViewTallasGroup');
    if (grupo) {
        grupo.querySelectorAll('.btn-talla').forEach(b => b.classList.remove('activo'));
    }
    btn.classList.add('activo');
}

function cerrarVistaRapida() {
    const modal = document.getElementById('modalQuickViewMVR');
    if (modal) modal.classList.remove('mostrar');
}

/* --------------------------------------------------------------------------
   9. INYECCIÓN AUTOMÁTICA DE COMPONENTES MODERNOS
   -------------------------------------------------------------------------- */
function inyectarComponentesModernos() {
    // 1. Marquesina Infinita Superior (Ticker Tape)
    if (!document.getElementById('mvrTickerTape')) {
        const ticker = document.createElement('div');
        ticker.id = 'mvrTickerTape';
        ticker.className = 'ticker-tape-wrapper';
        ticker.innerHTML = `
            <div class="ticker-tape-track">
                <span class="ticker-item"><span class="ticker-bullet">✦</span> Paga hasta en 12 quincenas con tus Vales de Promotora</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 🚚 Entregas a Domicilio y en Sucursales</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 👓 Examen de la vista gratis en Ópticas D'villa y Ravali</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 👗 Moda y Calzado Exclusivo en Marcel Boutique</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 💳 Aceptamos Vales, Efectivo y Transferencias</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> Paga hasta en 12 quincenas con tus Vales de Promotora</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 🚚 Entregas a Domicilio y en Sucursales</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 👓 Examen de la vista gratis en Ópticas D'villa y Ravali</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 👗 Moda y Calzado Exclusivo en Marcel Boutique</span>
                <span class="ticker-item"><span class="ticker-bullet">✦</span> 💳 Aceptamos Vales, Efectivo y Transferencias</span>
            </div>`;
        document.body.insertAdjacentElement('afterbegin', ticker);
    }

    // 2. Speed Dial Multicanal de WhatsApp
    if (!document.getElementById('mvrSpeedDial')) {
        const speedDial = document.createElement('div');
        speedDial.id = 'mvrSpeedDial';
        speedDial.className = 'speed-dial-container';
        speedDial.innerHTML = `
            <div class="speed-dial-menu" id="mvrSpeedDialMenu">
                <a href="https://wa.me/528332854129?text=${encodeURIComponent("Hola Óptica D'villa, me gustaría recibir atención y cotización personalizada.")}" target="_blank" class="speed-dial-item">
                    <span class="speed-dial-dot" style="background: #0059b3;"></span> Óptica D'villa 👓
                </a>
                <a href="https://wa.me/528332854129?text=${encodeURIComponent("Hola Óptica Ravali, me gustaría recibir informes sobre armazones y micas.")}" target="_blank" class="speed-dial-item">
                    <span class="speed-dial-dot" style="background: #a80f14;"></span> Óptica Ravali 🕶️
                </a>
                <a href="https://wa.me/528332854129?text=${encodeURIComponent("Hola Marcel Boutique, me gustaría información sobre prendas y tallas disponibles.")}" target="_blank" class="speed-dial-item">
                    <span class="speed-dial-dot" style="background: #880e4f;"></span> Marcel Boutique 👗
                </a>
                <a href="https://wa.me/528332854129?text=${encodeURIComponent("Hola Grupo MVR, solicito información sobre Vales y Crédito para Promotoras.")}" target="_blank" class="speed-dial-item">
                    <span class="speed-dial-dot" style="background: #ff8c00;"></span> Vales y Promotoras 🎟️
                </a>
            </div>
            <button class="speed-dial-main-btn" id="mvrSpeedDialBtn" onclick="toggleSpeedDial()" title="Atención por WhatsApp">
                💬
            </button>`;
        document.body.appendChild(speedDial);
    }

    // 3. Barra Móvil Inferior (Sticky Bottom Nav Bar)
    if (!document.getElementById('mvrMobileBottomNav')) {
        const pathname = window.location.pathname.toLowerCase();
        const esIndex = pathname.includes('index') || pathname.endsWith('/') || pathname.endsWith('grupomvr');
        const esDvilla = pathname.includes('d%c2%b4villa') || pathname.includes('dvilla');
        const esRavali = pathname.includes('ravali');
        const esMarcel = pathname.includes('marcel');

        const nav = document.createElement('nav');
        nav.id = 'mvrMobileBottomNav';
        nav.className = 'mobile-bottom-nav';
        nav.innerHTML = `
            <a href="index.html" class="bottom-nav-item ${esIndex ? 'activo' : ''}">
                <span class="bottom-nav-icon">🏠</span> Inicio
            </a>
            <a href="D´villa.html" class="bottom-nav-item ${esDvilla ? 'activo' : ''}">
                <span class="bottom-nav-icon">👓</span> D'villa
            </a>
            <a href="Ravali.html" class="bottom-nav-item ${esRavali ? 'activo' : ''}">
                <span class="bottom-nav-icon">🕶️</span> Ravali
            </a>
            <a href="Marcel.html" class="bottom-nav-item ${esMarcel ? 'activo' : ''}">
                <span class="bottom-nav-icon">👗</span> Marcel
            </a>
            <a href="javascript:void(0)" onclick="abrirCarritoGlobal()" class="bottom-nav-item">
                <span class="bottom-nav-icon">🛍️</span> Carrito
            </a>`;
        document.body.appendChild(nav);
    }

    // 4. Agregar Botón de Modo Oscuro al Header si existe
    const navUl = document.querySelector('.main-nav ul');
    if (navUl && !document.getElementById('navThemeToggle')) {
        const li = document.createElement('li');
        li.id = 'navThemeToggle';
        li.innerHTML = `<button onclick="toggleModoOscuro()" class="btn-theme-toggle" title="Cambiar tema claro/oscuro">🌙 Modo Oscuro</button>`;
        navUl.appendChild(li);
    }
}

/* --------------------------------------------------------------------------
   8. SISTEMA DE EXPORTACIÓN Y REPORTES SEGMENTADOS (EXCEL / PDF)
   -------------------------------------------------------------------------- */
function filtrarValesData(vales, filtroSucursal = 'TODAS', filtroPromotora = '') {
    if (!Array.isArray(vales)) return [];
    const fSuc = String(filtroSucursal || 'TODAS').trim().toLowerCase();
    const fProm = String(filtroPromotora || '').trim().toUpperCase();

    return vales.filter(v => {
        const suc = String(v.sucursal || '').trim();
        const prom = String(v.promotora || '').trim().toUpperCase();
        
        const matchSucursal = (fSuc === 'todas' || fSuc === '' || fSuc === 'all') 
            ? true 
            : (suc.toLowerCase() === fSuc);

        const matchProm = (!fProm || fProm === 'TODAS') 
            ? true 
            : (prom === fProm || prom.includes(fProm) || fProm.includes(prom));

        return matchSucursal && matchProm;
    });
}

function imprimirHTMLSeguro(htmlDocumento, tituloDocumento = 'Reporte Oficial Grupo MVR') {
    reproducirSonido('click');
    
    // Método 1: Iframe Invisible (Garantiza cero bloqueos por popup blockers)
    try {
        let iframe = document.getElementById('iframeImpresionMVR');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'iframeImpresionMVR';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlDocumento);
        iframeDoc.close();

        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.warn("Iframe print fallback trigger", e);
                abrirVentanaPrintFallback(htmlDocumento);
            }
        }, 450);
        return;
    } catch (err) {
        console.warn("Error con iframe de impresión, usando ventana emergente:", err);
        abrirVentanaPrintFallback(htmlDocumento);
    }
}

function abrirVentanaPrintFallback(htmlDocumento) {
    const ventana = window.open('', '_blank');
    if (ventana) {
        ventana.document.open();
        ventana.document.write(htmlDocumento);
        ventana.document.close();
        ventana.focus();
        setTimeout(() => {
            try { ventana.print(); } catch (e) {}
        }, 500);
    } else {
        alert("⚠️ Tu navegador bloqueó la ventana emergente. Por favor permite las ventanas emergentes o revisa la vista en pantalla.");
    }
}

function exportarCarteraCSV(vales, filtroSucursal = 'TODAS', filtroPromotora = '', nombreArchivoPersonalizado = '') {
    const lista = filtrarValesData(vales, filtroSucursal, filtroPromotora);
    if (lista.length === 0) {
        alert("⚠️ No hay registros de vales para exportar con los filtros seleccionados.");
        return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM para apertura perfecta de tildes y símbolos en Excel
    csvContent += "Folio,Fecha,Promotora,Cliente,Telefono,Direccion,Monto Autorizado,Monto Venta,Plazo,Sucursal,Estatus Pago,Estatus Canje\r\n";

    let totalMonto = 0;
    let totalAlCorriente = 0;
    let totalVencido = 0;

    lista.forEach(v => {
        const folio = `"${String(v.folio || '').replace(/"/g, '""')}"`;
        const fecha = `"${String(v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX') : '').replace(/"/g, '""')}"`;
        const prom = `"${String(v.promotora || '').replace(/"/g, '""')}"`;
        const cli = `"${String(v.cliente || '').replace(/"/g, '""')}"`;
        const tel = `"${String(v.telefono || '').replace(/"/g, '""')}"`;
        const dir = `"${String(v.direccion || '').replace(/"/g, '""')}"`;
        const montoNum = parseFloat(v.monto) || 0;
        const montoVenta = parseFloat(v.montoVenta) || 0;
        totalMonto += montoNum;

        const plazo = `"${String(v.quincenas || '').replace(/"/g, '""')}"`;
        const suc = `"${String(v.sucursal || '').replace(/"/g, '""')}"`;
        const estPago = String(v.estatusPago || 'Al Corriente').trim();
        const estCanje = String(v.estatusCanje || 'Pendiente').trim();

        if (estPago.toLowerCase().includes('vencido')) totalVencido += montoNum;
        else totalAlCorriente += montoNum;

        csvContent += `${folio},${fecha},${prom},${cli},${tel},${dir},${montoNum},${montoVenta},${plazo},${suc},"${estPago}","${estCanje}"\r\n`;
    });

    // Fila de Totales
    csvContent += `\r\n"--- RESUMEN ---","","","","","","","","","","",""\r\n`;
    csvContent += `"Total de Vales:",${lista.length},"","","","","","","","","",""\r\n`;
    csvContent += `"Monto Total Colocado:",${totalMonto},"","","","","","","","","",""\r\n`;
    csvContent += `"Total al Corriente:",${totalAlCorriente},"","","","","","","","","",""\r\n`;
    csvContent += `"Total en Cartera Vencida:",${totalVencido},"","","","","","","","","",""\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const fechaHoy = new Date().toISOString().split('T')[0];
    const etiquetaSuc = (filtroSucursal && filtroSucursal !== 'TODAS') ? filtroSucursal.replace(/[^a-zA-Z0-9]/g, '_') : 'General_Consolidado';
    const etiquetaProm = filtroPromotora ? `_Promotora_${filtroPromotora.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    
    link.setAttribute("href", url);
    link.setAttribute("download", nombreArchivoPersonalizado || `Cartera_${etiquetaSuc}${etiquetaProm}_${fechaHoy}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    reproducirSonido('success');
    mostrarToast("¡Descarga Exitosa!", "Tu archivo Excel (.csv) se ha generado y descargado correctamente.");
}

function imprimirReporteCartera(vales, filtroSucursal = 'TODAS', filtroPromotora = '') {
    const lista = filtrarValesData(vales, filtroSucursal, filtroPromotora);
    if (lista.length === 0) {
        alert("⚠️ No hay registros de vales para imprimir con los filtros seleccionados.");
        return;
    }

    let totalMonto = 0;
    let totalVencido = 0;
    let totalAlCorriente = 0;

    let filasHtml = '';
    lista.forEach(v => {
        const montoNum = parseFloat(v.monto) || 0;
        totalMonto += montoNum;
        const estPago = String(v.estatusPago || 'Al Corriente').trim();
        const esVencido = estPago.toLowerCase().includes('vencido');
        if (esVencido) totalVencido += montoNum; else totalAlCorriente += montoNum;

        const colorBadge = esVencido ? '#d32f2f' : '#28a745';
        const fechaFmt = v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX') : '-';

        filasHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: bold; color: #002b55;">${v.folio || '-'}</td>
                <td style="padding: 8px;">${fechaFmt}</td>
                <td style="padding: 8px; font-weight: bold;">${v.promotora || '-'}</td>
                <td style="padding: 8px;">${v.cliente || '-'}<br><small style="color: #64748b;">${v.telefono || ''}</small></td>
                <td style="padding: 8px; font-weight: bold;">$${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                <td style="padding: 8px;">${v.quincenas || '-'}</td>
                <td style="padding: 8px;">${v.sucursal || '-'}</td>
                <td style="padding: 8px;"><span style="background: ${colorBadge}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${estPago}</span></td>
            </tr>`;
    });

    const tituloSucursal = (filtroSucursal && filtroSucursal !== 'TODAS') ? filtroSucursal : 'Consolidado General (Todas las Sucursales)';
    const subtituloPromotora = filtroPromotora ? `<h4 style="margin: 4px 0 0 0; color: #0059b3;">Promotora: ${filtroPromotora}</h4>` : '';

    const htmlDoc = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Reporte de Cartera - Grupo MVR</title>
            <style>
                @page { size: letter portrait; margin: 15mm; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px; color: #1e293b; margin: 0; }
                .header { border-bottom: 3px solid #002b55; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                .cards-kpi { display: flex; gap: 15px; margin-bottom: 20px; }
                .card-kpi { flex: 1; padding: 12px 16px; border-radius: 6px; background: #f8fafc; border: 1px solid #cbd5e1; }
                .card-kpi strong { display: block; font-size: 1.2rem; color: #002b55; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                th { background: #002b55; color: white; text-align: left; padding: 8px 6px; }
                @media print { .no-print { display: none !important; } body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 style="margin: 0; color: #002b55; font-size: 1.6rem; letter-spacing: 1px;">GRUPO MVR</h1>
                    <p style="margin: 3px 0 0 0; font-size: 0.95rem; color: #64748b;">Óptica D'villa • Óptica Ravali • Marcel Boutique</p>
                    <h3 style="margin: 10px 0 0 0; color: #334155;">Estado de Cartera de Vales — ${tituloSucursal}</h3>
                    ${subtituloPromotora}
                </div>
                <div style="text-align: right; font-size: 0.85rem; color: #64748b;">
                    <p style="margin: 0;"><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p style="margin: 4px 0 0 0;"><strong>Total Registros:</strong> ${lista.length}</p>
                </div>
            </div>

            <div class="cards-kpi">
                <div class="card-kpi" style="border-left: 4px solid #0059b3;">
                    <span style="font-size: 0.8rem; color: #64748b; font-weight: bold; text-transform: uppercase;">Monto Total Colocado</span>
                    <strong>$${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
                <div class="card-kpi" style="border-left: 4px solid #28a745;">
                    <span style="font-size: 0.8rem; color: #64748b; font-weight: bold; text-transform: uppercase;">Al Corriente</span>
                    <strong style="color: #28a745;">$${totalAlCorriente.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
                <div class="card-kpi" style="border-left: 4px solid #d32f2f;">
                    <span style="font-size: 0.8rem; color: #64748b; font-weight: bold; text-transform: uppercase;">Cartera Vencida</span>
                    <strong style="color: #d32f2f;">$${totalVencido.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Folio</th>
                        <th>Fecha</th>
                        <th>Promotora</th>
                        <th>Cliente / Teléfono</th>
                        <th>Monto</th>
                        <th>Plazo</th>
                        <th>Sucursal</th>
                        <th>Estatus</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHtml}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 0.85rem; color: #64748b;">
                <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Firma de Administración</div>
                <div style="border-top: 1px solid #94a3b8; width: 220px; padding-top: 6px;">Firma de Conformidad</div>
            </div>
        </body>
        </html>
    `;

    imprimirHTMLSeguro(htmlDoc, `Reporte_Cartera_${tituloSucursal}`);
}

function mostrarTicketValeModal(vale) {
    const modalId = 'modalTicketValeDigital';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
    }

    const montoNum = parseFloat(vale.monto) || 0;
    const qNum = parseInt(vale.quincenas) || 8;
    const cuotaQuincenal = qNum > 0 ? (montoNum / qNum) : 0;
    const qrData = encodeURIComponent(`GRUPO MVR | VALE OFICIAL\nFolio: ${vale.folio}\nCliente: ${vale.cliente}\nPromotora: ${vale.promotora}\nMonto: $${montoNum} MXN\nPlazo: ${vale.quincenas}\nSucursal: ${vale.sucursal}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&margin=4`;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px; padding: 1.5rem; text-align: center;">
            <span class="cerrar-modal" onclick="document.getElementById('${modalId}').style.display = 'none'">&times;</span>
            <div class="ticket-digital-card">
                <div class="ticket-header">
                    <span style="font-size: 0.8rem; font-weight: 800; color: #ff8c00; text-transform: uppercase;">Vale Oficial de Crédito</span>
                    <h3>GRUPO MVR</h3>
                    <span class="ticket-folio-badge">${vale.folio}</span>
                </div>
                
                <div class="ticket-row"><strong>Sucursal:</strong> <span>${vale.sucursal}</span></div>
                <div class="ticket-row"><strong>Promotora:</strong> <span>${vale.promotora}</span></div>
                <div class="ticket-row"><strong>Cliente:</strong> <span>${vale.cliente}</span></div>
                <div class="ticket-row"><strong>Teléfono:</strong> <span>${vale.telefono || '-'}</span></div>
                <div class="ticket-row"><strong>Monto Autorizado:</strong> <span style="font-size: 1.1rem; font-weight: 900; color: #0059b3;">$${montoNum.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</span></div>
                <div class="ticket-row"><strong>Plazo:</strong> <span>${vale.quincenas}</span></div>
                <div class="ticket-row"><strong>Pago Quincenal Aprox.:</strong> <span style="font-weight: bold; color: #28a745;">$${cuotaQuincenal.toLocaleString('es-MX', {minimumFractionDigits: 2})} MXN</span></div>
                <div class="ticket-row"><strong>Estatus Pago:</strong> <span style="font-weight: bold;">${vale.estatusPago || 'Al Corriente'}</span></div>

                <div class="ticket-qr-container">
                    <img src="${qrUrl}" alt="QR de Validación de Vale">
                    <p style="margin: 6px 0 0 0; font-size: 0.75rem; color: #64748b;">Escanea en caja para validar y canjear</p>
                </div>

                <div style="font-size: 0.72rem; color: #64748b; line-height: 1.3; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
                    * Válido únicamente en sucursales oficiales de Grupo MVR. Indispensable presentar identificación oficial al canjear.
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 1.2rem; justify-content: center;">
                <button onclick="imprimirTicketValeDirecto('${vale.folio}', '${vale.promotora}', '${String(vale.cliente).replace(/'/g, "")}', '${montoNum}', '${vale.quincenas}', '${vale.sucursal}', '${vale.telefono || ''}')" class="btn btn-primary" style="flex: 1; padding: 0.8rem; font-size: 0.9rem;">🖨️ Imprimir Ticket</button>
                <button onclick="compartirValeWhatsApp('${vale.folio}', '${vale.cliente}', '${montoNum}', '${vale.quincenas}', '${vale.sucursal}', '${vale.telefono}')" class="btn" style="background: #25d366; color: white; flex: 1; padding: 0.8rem; font-size: 0.9rem; font-weight: bold;">📲 WhatsApp</button>
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function imprimirTicketValeDirecto(folio, promotora, cliente, monto, quincenas, sucursal, telefono) {
    const qrData = encodeURIComponent(`GRUPO MVR | Folio: ${folio} | Monto: $${monto} | Cliente: ${cliente}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

    const w = window.open('', '_blank');
    w.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket Vale - ${folio}</title>
            <style>
                body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 13px; color: #000; }
                .center { text-align: center; }
                .line { border-top: 1px dashed #000; margin: 8px 0; }
                .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <div class="center">
                <h3 style="margin:0;">GRUPO MVR</h3>
                <p style="margin:2px 0;">VALE DE CRÉDITO</p>
                <strong>${folio}</strong>
            </div>
            <div class="line"></div>
            <div class="row"><span>Sucursal:</span><strong>${sucursal}</strong></div>
            <div class="row"><span>Promotora:</span><strong>${promotora}</strong></div>
            <div class="row"><span>Cliente:</span><strong>${cliente}</strong></div>
            <div class="row"><span>Teléfono:</span><strong>${telefono}</strong></div>
            <div class="row"><span>Plazo:</span><strong>${quincenas}</strong></div>
            <div class="row"><span>Monto:</span><strong>$${parseFloat(monto).toLocaleString('es-MX', {minimumFractionDigits:2})} MXN</strong></div>
            <div class="line"></div>
            <div class="center">
                <img src="${qrUrl}" style="width: 120px; height: 120px;">
                <p style="font-size: 10px; margin: 4px 0 0 0;">Canjeable en sucursal con ID oficial.</p>
            </div>
            <div style="margin-top: 25px; text-align: center;">
                <div style="border-top: 1px solid #000; width: 180px; margin: 0 auto 4px auto;"></div>
                <small>Firma del Cliente</small>
            </div>
            <script>window.onload = function() { window.print(); };<\/script>
        </body>
        </html>
    `);
    w.document.close();
}

function compartirValeWhatsApp(folio, cliente, monto, quincenas, sucursal, telefono) {
    const msj = encodeURIComponent(`🎟️ *¡Tu Vale de Crédito en Grupo MVR está Listo!*\n\n• *Folio:* ${folio}\n• *Cliente:* ${cliente}\n• *Monto:* $${parseFloat(monto).toLocaleString('es-MX')} MXN\n• *Plazo:* ${quincenas}\n• *Sucursal:* ${sucursal}\n\nPresenta tu folio o identificación en sucursal para canjearlo. ¡Gracias por tu preferencia!`);
    const telLimpio = String(telefono || '').replace(/[^0-9]/g, '');
    const urlWa = (telLimpio.length === 10) ? `https://wa.me/52${telLimpio}?text=${msj}` : `https://wa.me/?text=${msj}`;
    window.open(urlWa, '_blank');
}

/* --------------------------------------------------------------------------
   9. SISTEMA DE FAVORITOS (WISHLIST ❤️)
   -------------------------------------------------------------------------- */
function obtenerFavoritos() {
    try {
        return JSON.parse(localStorage.getItem('mvr_favoritos')) || [];
    } catch (e) {
        return [];
    }
}

function esFavorito(id) {
    const favs = obtenerFavoritos();
    return favs.some(item => item.id === id);
}

function toggleFavorito(id, nombre, precio, imagen, sucursal) {
    let favs = obtenerFavoritos();
    const index = favs.findIndex(item => item.id === id);

    if (index >= 0) {
        favs.splice(index, 1);
        mostrarToast("Eliminado de Favoritos", `${nombre} se quitó de tu lista ❤️.`);
    } else {
        favs.push({ id, nombre, precio, imagen, sucursal });
        mostrarToast("¡Guardado en Favoritos! ❤️", `${nombre} se agregó a tu lista.`);
    }

    localStorage.setItem('mvr_favoritos', JSON.stringify(favs));
    actualizarBotonesFavoritosUI();
    actualizarBotonFlotanteFavoritos();
}

function actualizarBotonesFavoritosUI() {
    const btns = document.querySelectorAll('.btn-fav-heart');
    btns.forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (id && esFavorito(id)) {
            btn.classList.add('active');
            btn.innerHTML = '❤️';
        } else if (id) {
            btn.classList.remove('active');
            btn.innerHTML = '🤍';
        }
    });
}

function actualizarBotonFlotanteFavoritos() {
    const favs = obtenerFavoritos();
    let btnFlotante = document.getElementById('btnFlotanteFavoritos');

    if (favs.length > 0) {
        if (!btnFlotante) {
            btnFlotante = document.createElement('button');
            btnFlotante.id = 'btnFlotanteFavoritos';
            btnFlotante.className = 'btn-flotante-fav';
            btnFlotante.onclick = abrirModalFavoritos;
            document.body.appendChild(btnFlotante);
        }
        btnFlotante.innerHTML = `❤️ Favoritos (${favs.length})`;
        btnFlotante.style.display = 'inline-flex';
    } else if (btnFlotante) {
        btnFlotante.style.display = 'none';
    }
}

function abrirModalFavoritos() {
    const modalId = 'modalWishlistGlobal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    const favs = obtenerFavoritos();
    let cuerpoItems = '';

    if (favs.length === 0) {
        cuerpoItems = `
            <div style="text-align: center; padding: 2rem 1rem;">
                <span style="font-size: 3rem;">🤍</span>
                <h4 style="margin: 10px 0 6px 0; color: #64748b;">Tu lista de favoritos está vacía</h4>
                <p style="font-size: 0.88rem; color: #94a3b8;">Toca el corazón en cualquier modelo para guardarlo aquí.</p>
            </div>`;
    } else {
        cuerpoItems = `<div style="max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin: 1rem 0;">`;
        favs.forEach(p => {
            const precioFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(p.precio || 0);
            cuerpoItems += `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; gap: 10px;">
                    <img src="${p.imagen}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;" onerror="this.src='mvr.jpg';">
                    <div style="flex: 1; text-align: left;">
                        <h4 style="margin: 0; font-size: 0.95rem; color: #002b55;">${p.nombre}</h4>
                        <small style="color: #64748b;">${p.sucursal || 'Grupo MVR'} • <strong>${precioFmt}</strong></small>
                    </div>
                    <button onclick="toggleFavorito('${p.id}', '${p.nombre}', ${p.precio}, '${p.imagen}', '${p.sucursal}'); abrirModalFavoritos();" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #e11d48;" title="Quitar de favoritos">🗑️</button>
                </div>`;
        });
        cuerpoItems += `</div>`;
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; padding: 1.5rem; text-align: center;">
            <span class="cerrar-modal" onclick="document.getElementById('${modalId}').style.display = 'none'">&times;</span>
            <h3 style="margin: 0; color: #e11d48; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>❤️</span> Mis Modelos Favoritos
            </h3>
            ${cuerpoItems}
            ${favs.length > 0 ? `
                <div style="display: flex; gap: 10px; margin-top: 1rem;">
                    <button onclick="compartirFavoritosWhatsApp()" class="btn" style="background: #25d366; color: white; flex: 1; padding: 0.8rem; font-weight: bold;">
                        📲 Cotizar Favoritos por WhatsApp
                    </button>
                </div>` : ''}
        </div>`;

    modal.style.display = 'flex';
}

function compartirFavoritosWhatsApp() {
    const favs = obtenerFavoritos();
    if (favs.length === 0) return;

    let mensaje = "Hola Grupo MVR, me interesan estos modelos de mi lista de favoritos:\n\n";
    favs.forEach((p, idx) => {
        mensaje += `${idx + 1}. *${p.nombre}* (${p.sucursal || 'Grupo MVR'}) - $${p.precio} MXN\n`;
    });
    mensaje += "\n¿Tienen disponibilidad y vales para estos modelos?";
    window.open(`https://wa.me/528332854129?text=${encodeURIComponent(mensaje)}`, '_blank');
}

/* --------------------------------------------------------------------------
   10. PROBADOR VIRTUAL 2D (ESPEJO DIGITAL)
   -------------------------------------------------------------------------- */
let streamCamaraActual = null;
let posicionLente = { x: 0, y: 0, scale: 1 };

function abrirProbadorVirtual(imgLente, nombreModelo) {
    let overlay = document.getElementById('probadorVirtualOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'probadorVirtualOverlay';
        overlay.className = 'probador-overlay';
        document.body.appendChild(overlay);
    }

    posicionLente = { x: 0, y: 0, scale: 1 };

    overlay.innerHTML = `
        <div class="probador-container">
            <span class="cerrar-modal" onclick="cerrarProbadorVirtual()">&times;</span>
            <h3 style="margin: 0 0 6px 0; color: #002b55;">👓 Espejo y Probador Virtual 2D</h3>
            <p style="margin: 0; font-size: 0.88rem; color: #64748b;">Probando modelo: <strong>${nombreModelo || 'Armazón Grupo MVR'}</strong></p>

            <div class="probador-viewport" id="probadorViewport">
                <video id="probadorVideo" autoplay playsinline style="display: none;"></video>
                <img id="probadorFotoUsuario" class="user-photo" src="imagenes/dvilla/lente1.jpg" style="display: block;" onerror="this.src='mvr.jpg';">
                <img id="probadorArmazon" class="frame-overlay" src="${imgLente}" alt="Lente" style="transform: translate(0px, 0px) scale(1);">
            </div>

            <div class="probador-controls">
                <button onclick="activarCamaraProbador()" class="btn btn-primary" style="font-size: 0.85rem; padding: 6px 12px;">📷 Activar Cámara</button>
                <label class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px; cursor: pointer; margin: 0;">
                    📁 Subir mi Foto
                    <input type="file" accept="image/*" onchange="cargarFotoUsuarioProbador(event)" style="display: none;">
                </label>
                <button onclick="ajustarTamanioLente(1.1)" class="btn" style="background: #e2e8f0; color: #1e293b; font-size: 0.85rem; padding: 6px 12px;">🔍 + Grande</button>
                <button onclick="ajustarTamanioLente(0.9)" class="btn" style="background: #e2e8f0; color: #1e293b; font-size: 0.85rem; padding: 6px 12px;">🔍 - Chico</button>
            </div>
            <p style="font-size: 0.78rem; color: #94a3b8; margin: 10px 0 0 0;">💡 Puedes arrastrar el armazón con el mouse o con tu dedo para acomodarlo a tu rostro.</p>
        </div>`;

    overlay.style.display = 'flex';
    configurarArrastreLente();
}

function cerrarProbadorVirtual() {
    const overlay = document.getElementById('probadorVirtualOverlay');
    if (overlay) overlay.style.display = 'none';
    if (streamCamaraActual) {
        streamCamaraActual.getTracks().forEach(track => track.stop());
        streamCamaraActual = null;
    }
}

async function activarCamaraProbador() {
    const video = document.getElementById('probadorVideo');
    const foto = document.getElementById('probadorFotoUsuario');
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            streamCamaraActual = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            video.srcObject = streamCamaraActual;
            video.style.display = 'block';
            if (foto) foto.style.display = 'none';
        }
    } catch (e) {
        alert("No se pudo acceder a la cámara. Puedes subir una foto de tu rostro para probar el armazón.");
    }
}

function cargarFotoUsuarioProbador(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const foto = document.getElementById('probadorFotoUsuario');
        const video = document.getElementById('probadorVideo');
        if (video) video.style.display = 'none';
        if (foto) {
            foto.src = e.target.result;
            foto.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function ajustarTamanioLente(factor) {
    posicionLente.scale *= factor;
    const armazon = document.getElementById('probadorArmazon');
    if (armazon) {
        armazon.style.transform = `translate(${posicionLente.x}px, ${posicionLente.y}px) scale(${posicionLente.scale})`;
    }
}

function configurarArrastreLente() {
    const armazon = document.getElementById('probadorArmazon');
    const viewport = document.getElementById('probadorViewport');
    if (!armazon || !viewport) return;

    let isDragging = false;
    let startX, startY;

    function onStart(e) {
        isDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX - posicionLente.x;
        startY = clientY - posicionLente.y;
    }

    function onMove(e) {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        posicionLente.x = clientX - startX;
        posicionLente.y = clientY - startY;
        armazon.style.transform = `translate(${posicionLente.x}px, ${posicionLente.y}px) scale(${posicionLente.scale})`;
    }

    function onEnd() {
        isDragging = false;
    }

    armazon.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    armazon.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
}

/* --------------------------------------------------------------------------
   11. MICRO-INTERACCIONES SONORAS Y HÁPTICAS (WEB AUDIO API)
   -------------------------------------------------------------------------- */
let audioCtx = null;

function obtenerAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function reproducirSonido(tipo = 'click') {
    try {
        const ctx = obtenerAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (tipo === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            vibrarDispositivo(20);
        } else if (tipo === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
            vibrarDispositivo([30, 40, 50]);
        } else if (tipo === 'cash') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.09); // E6
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            vibrarDispositivo([40, 60, 40]);
        }
    } catch (e) {
        // Silencioso si el navegador bloquea audio sin interacción previa
    }
}

function vibrarDispositivo(patron) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(patron || 30);
    }
}

/* --------------------------------------------------------------------------
   12. PROGRESSIVE WEB APP (PWA) & SERVICE WORKER
   -------------------------------------------------------------------------- */
let eventoInstalacionPWA = null;

function inicializarPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('✅ ServiceWorker registrado con éxito para Grupo MVR:', reg.scope);
        }).catch(err => {
            console.log('ℹ️ ServiceWorker offline info:', err);
        });
    }

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        eventoInstalacionPWA = e;
        mostrarBannerInstalacionPWA();
    });
}

function mostrarBannerInstalacionPWA() {
    let banner = document.getElementById('pwaInstallBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <span>📲 <strong>Instala la App de Grupo MVR</strong></span>
            <button onclick="instalarPWA()">Instalar</button>
            <span onclick="this.parentElement.style.display='none'" style="cursor:pointer; font-weight:bold; padding-left:4px;">&times;</span>
        `;
        document.body.appendChild(banner);
    }
    banner.style.display = 'flex';
}

function instalarPWA() {
    reproducirSonido('click');
    if (eventoInstalacionPWA) {
        eventoInstalacionPWA.prompt();
        eventoInstalacionPWA.userChoice.then(choice => {
            if (choice.outcome === 'accepted') {
                mostrarToast("¡App Instalada!", "Grupo MVR ahora está en tu pantalla de inicio.");
            }
            eventoInstalacionPWA = null;
            const b = document.getElementById('pwaInstallBanner');
            if (b) b.style.display = 'none';
        });
    } else {
        alert("Para instalar Grupo MVR:\n\n• En Chrome / Android: Toca los 3 puntos (⋮) y elige 'Instalar aplicación' o 'Agregar a pantalla principal'.\n• En iPhone (Safari): Toca el botón Compartir (⎙) y elige 'Agregar a pantalla de inicio'.");
    }
}

/* --------------------------------------------------------------------------
   13. COMPARADOR DE MODELOS LADO A LADO (2 O 3 PRODUCTOS)
   -------------------------------------------------------------------------- */
function obtenerComparador() {
    try {
        return JSON.parse(localStorage.getItem('mvr_comparador')) || [];
    } catch (e) {
        return [];
    }
}

function estaEnComparador(id) {
    return obtenerComparador().some(p => p.id === id);
}

function toggleComparar(id, nombre, precio, imagen, sucursal, specs = {}) {
    let comp = obtenerComparador();
    const idx = comp.findIndex(p => p.id === id);

    if (idx >= 0) {
        comp.splice(idx, 1);
        reproducirSonido('click');
        mostrarToast("Comparador", `${nombre} quitado del comparador.`);
    } else {
        if (comp.length >= 3) {
            alert("⚠️ Puedes comparar un máximo de 3 productos a la vez. Deselecciona uno para agregar este modelo.");
            return;
        }
        comp.push({ id, nombre, precio, imagen, sucursal, specs });
        reproducirSonido('success');
        mostrarToast("Comparador ⚖️", `${nombre} añadido. (${comp.length}/3)`);
    }

    localStorage.setItem('mvr_comparador', JSON.stringify(comp));
    actualizarBarraComparadorUI();
}

function actualizarBarraComparadorUI() {
    const comp = obtenerComparador();
    let bar = document.getElementById('floatingCompareBar');

    // Actualizar botones de toggle en la página
    document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
        const id = btn.getAttribute('data-id');
        if (id && estaEnComparador(id)) {
            btn.classList.add('active');
            btn.innerHTML = '⚖️✓';
        } else if (id) {
            btn.classList.remove('active');
            btn.innerHTML = '⚖️';
        }
    });

    if (comp.length > 0) {
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'floatingCompareBar';
            bar.className = 'floating-compare-bar';
            document.body.appendChild(bar);
        }
        let thumbs = comp.map(p => `<img src="${p.imagen}" class="compare-item-thumb" title="${p.nombre}" onerror="this.src='mvr.jpg';">`).join('');
        bar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                ${thumbs}
                <strong style="font-size: 0.9rem;">Comparar (${comp.length}/3)</strong>
            </div>
            <button onclick="abrirModalComparador()" class="btn" style="background: #ff8c00; color: white; padding: 6px 14px; font-weight: bold; border-radius: 20px; font-size: 0.85rem; border: none; cursor: pointer;">
                Ver Comparativa
            </button>
            <button onclick="limpiarComparador()" style="background: none; border: none; color: #cbd5e1; font-size: 1.1rem; cursor: pointer;" title="Limpiar comparador">&times;</button>
        `;
        bar.style.display = 'flex';
    } else if (bar) {
        bar.style.display = 'none';
    }
}

function limpiarComparador() {
    localStorage.removeItem('mvr_comparador');
    actualizarBarraComparadorUI();
    reproducirSonido('click');
}

function abrirModalComparador() {
    reproducirSonido('click');
    const comp = obtenerComparador();
    if (comp.length === 0) return;

    const modalId = 'modalComparadorGlobal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    let filasHeader = '<th>Característica</th>';
    let filasFotos = '<td><strong>Modelo</strong></td>';
    let filasPrecio = '<td><strong>Precio Contado</strong></td>';
    let filasQuincenal = '<td><strong>Pago Quincenal (8Q)</strong></td>';
    let filasSucursal = '<td><strong>Sucursal</strong></td>';
    let filasAcciones = '<td><strong>Acción</strong></td>';

    comp.forEach(p => {
        const precioNum = parseFloat(p.precio) || 0;
        const precioFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precioNum);
        const cuota8Q = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precioNum / 8);

        filasHeader += `<th>${p.nombre}</th>`;
        filasFotos += `<td><img src="${p.imagen}" style="width: 100px; height: 75px; object-fit: contain; border-radius: 6px;" onerror="this.src='mvr.jpg';"><br><strong>${p.nombre}</strong></td>`;
        filasPrecio += `<td style="font-size: 1.1rem; font-weight: 900; color: #0059b3;">${precioFmt}</td>`;
        filasQuincenal += `<td style="font-weight: bold; color: #28a745;">${cuota8Q} / quincena</td>`;
        filasSucursal += `<td><span class="badge-optica">${p.sucursal || 'Grupo MVR'}</span></td>`;
        filasAcciones += `
            <td>
                <button onclick="agregarAlCarrito('${p.id}', '${String(p.nombre).replace(/'/g, "")}', ${p.precio}, '${p.sucursal}', '${p.imagen}'); document.getElementById('${modalId}').style.display='none';" class="btn btn-primary" style="padding: 6px 10px; font-size: 0.8rem; width: 100%;">
                    🛒 Carrito
                </button>
            </td>`;
    });

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 750px; padding: 1.5rem; text-align: center;">
            <span class="cerrar-modal" onclick="document.getElementById('${modalId}').style.display = 'none'">&times;</span>
            <h3 style="margin: 0; color: #002b55; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span>⚖️</span> Comparador de Modelos Lado a Lado
            </h3>
            <div style="overflow-x: auto;">
                <table class="compare-modal-table">
                    <thead><tr>${filasHeader}</tr></thead>
                    <tbody>
                        <tr>${filasFotos}</tr>
                        <tr>${filasPrecio}</tr>
                        <tr>${filasQuincenal}</tr>
                        <tr>${filasSucursal}</tr>
                        <tr>${filasAcciones}</tr>
                    </tbody>
                </table>
            </div>
            <button onclick="limpiarComparador(); document.getElementById('${modalId}').style.display = 'none';" class="btn" style="background: #e2e8f0; color: #334155; margin-top: 1rem; padding: 6px 14px; font-size: 0.85rem; font-weight: bold;">
                🗑️ Limpiar Comparativa
            </button>
        </div>`;

    modal.style.display = 'flex';
}

/* --------------------------------------------------------------------------
   14. VALE DIGITAL APPLE WALLET / PASSBOOK CON DESCARGA PNG
   -------------------------------------------------------------------------- */
function mostrarPassbookModal(vale) {
    reproducirSonido('click');
    const modalId = 'modalPassbookDigital';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    const montoNum = parseFloat(vale.monto) || 0;
    const qNum = parseInt(vale.quincenas) || 8;
    const cuotaQuincenal = qNum > 0 ? (montoNum / qNum) : 0;
    const qrData = encodeURIComponent(`GRUPO MVR | Folio: ${vale.folio} | Monto: $${montoNum} | Cliente: ${vale.cliente} | Promotora: ${vale.promotora}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&margin=2`;

    const claseWallet = String(vale.sucursal).includes('Ravali') ? 'ravali' : (String(vale.sucursal).includes('Marcel') ? 'marcel' : '');

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px; padding: 1.5rem; text-align: center; background: transparent; box-shadow: none;">
            <span class="cerrar-modal" style="color: white; font-size: 2rem;" onclick="document.getElementById('${modalId}').style.display = 'none'">&times;</span>
            <div class="passbook-wallet ${claseWallet}" id="passbookCardExportTarget">
                <div class="passbook-top">
                    <div>
                        <span class="passbook-label">Vale de Crédito Digital</span>
                        <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 1px;">GRUPO MVR</h2>
                    </div>
                    <div style="text-align: right;">
                        <span class="passbook-label">Sucursal</span>
                        <strong style="font-size: 0.95rem;">${vale.sucursal}</strong>
                    </div>
                </div>

                <div class="passbook-body">
                    <div class="passbook-row-main">
                        <div>
                            <span class="passbook-label">Cliente Autorizado</span>
                            <strong style="font-size: 1.1rem;">${vale.cliente}</strong>
                        </div>
                        <div style="text-align: right;">
                            <span class="passbook-label">Monto Aprobado</span>
                            <span class="passbook-value-large">$${montoNum.toLocaleString('es-MX')}</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.85rem; opacity: 0.9;">
                        <div><span class="passbook-label">Folio</span><strong>${vale.folio}</strong></div>
                        <div><span class="passbook-label">Plazo</span><strong>${vale.quincenas}</strong></div>
                        <div><span class="passbook-label">Cuota Quincenal</span><strong>$${cuotaQuincenal.toFixed(0)} MXN</strong></div>
                    </div>

                    <div class="passbook-qr-box">
                        <img src="${qrUrl}" alt="QR de Vale" crossOrigin="anonymous">
                        <p style="margin: 6px 0 0 0; font-size: 0.72rem; color: #1e293b; font-weight: bold;">Presenta este código en caja al solicitar tu armazón</p>
                    </div>

                    <div style="margin-top: 12px; font-size: 0.7rem; opacity: 0.75; text-align: center;">
                        Promotora: <strong>${vale.promotora}</strong> • Válido en Grupo MVR
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 1.2rem; justify-content: center;">
                <button onclick="descargarPassbookComoImagen('${vale.folio}', '${vale.cliente}', '${montoNum}', '${vale.sucursal}', '${vale.promotora}', '${vale.quincenas}')" class="btn btn-primary" style="padding: 0.8rem; font-size: 0.9rem; flex: 1;">
                    📥 Guardar en Galería (PNG)
                </button>
                <button onclick="compartirValeWhatsApp('${vale.folio}', '${vale.cliente}', '${montoNum}', '${vale.quincenas}', '${vale.sucursal}', '${vale.telefono}')" class="btn" style="background: #25d366; color: white; padding: 0.8rem; font-size: 0.9rem; font-weight: bold; flex: 1;">
                    📲 Enviar WhatsApp
                </button>
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function descargarPassbookComoImagen(folio, cliente, monto, sucursal, promotora, quincenas) {
    reproducirSonido('cash');
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Fondo degradado elegante
    const grad = ctx.createLinearGradient(0, 0, 600, 800);
    if (sucursal.includes('Ravali')) {
        grad.addColorStop(0, '#4a0508'); grad.addColorStop(1, '#8b0000');
    } else if (sucursal.includes('Marcel')) {
        grad.addColorStop(0, '#2b0938'); grad.addColorStop(1, '#5a189a');
    } else {
        grad.addColorStop(0, '#001f3f'); grad.addColorStop(1, '#003366');
    }
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 600, 800, 24);
    ctx.fill();

    // Encabezado
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('GRUPO MVR', 40, 65);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('VALE DE CRÉDITO DIGITAL', 40, 95);
    ctx.textAlign = 'right';
    ctx.fillText(sucursal, 560, 65);
    ctx.textAlign = 'left';

    // Línea divisoria
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(40, 120); ctx.lineTo(560, 120);
    ctx.stroke();
    ctx.setLineDash([]);

    // Datos del Cliente y Monto
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText('CLIENTE AUTORIZADO', 40, 160);
    ctx.fillText('MONTO APROBADO', 360, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(cliente, 40, 195);
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`$${parseFloat(monto).toLocaleString('es-MX')}`, 360, 200);

    // Detalles secundarios
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText('FOLIO', 40, 260);
    ctx.fillText('PLAZO', 220, 260);
    ctx.fillText('PROMOTORA', 380, 260);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(folio, 40, 290);
    ctx.fillText(quincenas, 220, 290);
    ctx.fillText(promotora, 380, 290);

    // Recuadro blanco para el QR
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(160, 340, 280, 340, 16);
    ctx.fill();

    // Cargar y pintar QR
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    const qrData = encodeURIComponent(`GRUPO MVR | ${folio} | $${monto} | ${cliente}`);
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`;

    qrImg.onload = function() {
        ctx.drawImage(qrImg, 180, 360, 240, 240);
        ctx.fillStyle = '#002b55';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Escanear en sucursal al pagar', 300, 640);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '13px sans-serif';
        ctx.fillText('Presentar folio o identificación oficial al canjear.', 300, 740);

        // Descarga
        const link = document.createElement('a');
        link.download = `Vale_MVR_${folio}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        mostrarToast("¡Vale Guardado!", `El vale ${folio} se descargó como imagen.`);
    };
}

/* --------------------------------------------------------------------------
   15. MÓDULO DE REGISTRO DE ABONOS Y PAGOS PARCIALES
   -------------------------------------------------------------------------- */
function obtenerHistorialAbonos(folio) {
    try {
        const key = `mvr_abonos_${folio}`;
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
        return [];
    }
}

function registrarAbonoEnStorage(folio, montoAbono, nota) {
    const key = `mvr_abonos_${folio}`;
    let abonos = obtenerHistorialAbonos(folio);
    const nuevo = {
        fecha: new Date().toISOString(),
        monto: parseFloat(montoAbono) || 0,
        nota: nota || 'Abono quincenal'
    };
    abonos.push(nuevo);
    localStorage.setItem(key, JSON.stringify(abonos));
    return abonos;
}

function abrirModalAbonos(folio, cliente, montoTotal, quincenas, promotora, sucursal) {
    reproducirSonido('click');
    const modalId = 'modalAbonosVale';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    const montoNum = parseFloat(montoTotal) || 0;
    const abonos = obtenerHistorialAbonos(folio);
    const totalAbonado = abonos.reduce((acc, a) => acc + (parseFloat(a.monto) || 0), 0);
    const saldoRestante = Math.max(0, montoNum - totalAbonado);
    const porcentajePagado = montoNum > 0 ? Math.min(100, Math.round((totalAbonado / montoNum) * 100)) : 0;

    let filasAbonos = '';
    if (abonos.length === 0) {
        filasAbonos = `<tr><td colspan="3" style="text-align:center; color:#888;">No se han registrado abonos aún.</td></tr>`;
    } else {
        abonos.forEach((a, idx) => {
            filasAbonos += `
                <tr>
                    <td>#${idx + 1} - ${new Date(a.fecha).toLocaleDateString('es-MX')}</td>
                    <td style="font-weight: bold; color: #28a745;">+$${parseFloat(a.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                    <td>${a.nota}</td>
                </tr>`;
        });
    }

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: 1.5rem; text-align: center;">
            <span class="cerrar-modal" onclick="document.getElementById('${modalId}').style.display = 'none'">&times;</span>
            <h3 style="margin: 0; color: #002b55;">💵 Control de Abonos y Amortizaciones</h3>
            <p style="margin: 4px 0 1rem 0; color: #64748b; font-size: 0.9rem;">Folio: <strong>${folio}</strong> • Cliente: <strong>${cliente}</strong></p>

            <div class="modal-abonos-card">
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span>Monto Total: <strong>$${montoNum.toLocaleString('es-MX')}</strong></span>
                    <span>Total Abonado: <strong style="color: #28a745;">$${totalAbonado.toLocaleString('es-MX')}</strong></span>
                </div>
                <div class="abono-progreso-bar">
                    <div class="abono-progreso-fill" style="width: ${porcentajePagado}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: bold;">
                    <span>Amortización: ${porcentajePagado}%</span>
                    <span style="color: ${saldoRestante === 0 ? '#28a745' : '#d32f2f'};">Saldo Restante: $${saldoRestante.toLocaleString('es-MX')}</span>
                </div>
            </div>

            <div style="overflow-y: auto; max-height: 180px; margin-bottom: 1rem;">
                <table class="tabla-admin" style="font-size: 0.85rem;">
                    <thead><tr><th>Fecha</th><th>Abono</th><th>Nota</th></tr></thead>
                    <tbody>${filasAbonos}</tbody>
                </table>
            </div>

            <div style="background: #f1f5f9; padding: 1rem; border-radius: 6px; text-align: left;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #002b55;">➕ Registrar Nuevo Abono</h4>
                <div style="display: flex; gap: 8px;">
                    <input type="number" id="inputMontoAbono" placeholder="Monto ($)" min="1" max="${saldoRestante}" style="flex: 1; padding: 0.5rem; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <input type="text" id="inputNotaAbono" placeholder="Nota (Ej. Quincena 1)" style="flex: 1.5; padding: 0.5rem; border-radius: 4px; border: 1px solid #cbd5e1;">
                    <button onclick="guardarAbonoModal('${folio}', '${cliente}', ${montoNum}, '${quincenas}', '${promotora}', '${sucursal}')" class="btn btn-primary" style="padding: 0.5rem 1rem;">Guardar</button>
                </div>
            </div>
        </div>`;

    modal.style.display = 'flex';
}

function guardarAbonoModal(folio, cliente, montoTotal, quincenas, promotora, sucursal) {
    const inputMonto = document.getElementById('inputMontoAbono');
    const inputNota = document.getElementById('inputNotaAbono');
    const monto = parseFloat(inputMonto.value);

    if (!monto || monto <= 0) {
        alert("Por favor ingresa un monto válido de abono.");
        return;
    }

    registrarAbonoEnStorage(folio, monto, inputNota.value);
    reproducirSonido('cash');
    mostrarToast("¡Abono Registrado!", `Se sumó un abono de $${monto} al vale ${folio}.`);
    abrirModalAbonos(folio, cliente, montoTotal, quincenas, promotora, sucursal);
}

/* --------------------------------------------------------------------------
   16. EXPORTACIÓN TOTAL DE INVENTARIO Y LISTAS DE PRECIOS
   -------------------------------------------------------------------------- */
function exportarInventarioCSV(inventario) {
    if (!inventario || typeof inventario !== 'object') {
        alert("No hay datos de inventario disponibles para exportar.");
        return;
    }

    let csv = "\uFEFFSKU / ID,Sucursal,Nombre del Producto,Precio Contado,Existencias,Estado\r\n";
    const ids = Object.keys(inventario);

    ids.forEach(id => {
        const p = inventario[id];
        const stock = parseInt(p.stock) || 0;
        const estado = stock > 0 ? 'Disponible' : 'Agotado';
        csv += `"${id}","${p.sucursal || ''}","${String(p.nombre || '').replace(/"/g, '""')}",${p.precio || 0},${stock},"${estado}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Inventario_GrupoMVR_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function imprimirListaPrecios(inventario) {
    if (!inventario || typeof inventario !== 'object') {
        alert("⚠️ No hay inventario cargado para imprimir.");
        return;
    }

    const ids = Object.keys(inventario);
    if (ids.length === 0) {
        alert("⚠️ No hay productos en el inventario.");
        return;
    }

    let filas = '';
    ids.forEach(id => {
        const p = inventario[id];
        const precio = parseFloat(p.precio) || 0;
        const cuota8 = precio / 8;
        filas += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px; font-weight: bold;">${id}</td>
                <td style="padding: 8px;">${p.sucursal || '-'}</td>
                <td style="padding: 8px; font-weight: bold;">${p.nombre || '-'}</td>
                <td style="padding: 8px; color: #0059b3; font-weight: 900;">$${precio.toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                <td style="padding: 8px; color: #28a745; font-weight: bold;">$${cuota8.toLocaleString('es-MX', {minimumFractionDigits:2})} / Q</td>
                <td style="padding: 8px; text-align: center;">${p.stock || 0} pzas</td>
            </tr>`;
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lista de Precios Oficial - Grupo MVR</title>
            <style>
                @page { size: letter portrait; margin: 15mm; }
                body { font-family: 'Segoe UI', sans-serif; padding: 15px; color: #1e293b; margin: 0; }
                table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 15px; }
                th { background: #002b55; color: white; text-align: left; padding: 8px 6px; }
            </style>
        </head>
        <body>
            <div style="border-bottom: 3px solid #002b55; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin:0; color:#002b55;">GRUPO MVR</h1>
                    <p style="margin:2px 0; color:#64748b;">Lista Oficial de Precios y Catálogo de Modelos</p>
                </div>
                <div style="text-align: right; color: #64748b;">Fecha: ${new Date().toLocaleDateString('es-MX')}</div>
            </div>
            <table>
                <thead><tr><th>SKU / ID</th><th>Sucursal</th><th>Modelo</th><th>Precio Contado</th><th>Cuota Estimada (8Q)</th><th>Stock</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </body>
        </html>
    `;

    imprimirHTMLSeguro(html, 'Lista_Precios_GrupoMVR');
}

/* --------------------------------------------------------------------------
   17. DRAWER DE FILTROS FACETADOS AVANZADOS (OFF-CANVAS)
   -------------------------------------------------------------------------- */
let filtrosFacetadosActivos = {
    forma: null,
    material: null,
    genero: null,
    soloStock: false
};

function abrirDrawerFiltros() {
    reproducirSonido('click');
    let drawer = document.getElementById('mvrFiltrosDrawerOverlay');
    if (!drawer) {
        drawer = document.createElement('div');
        drawer.id = 'mvrFiltrosDrawerOverlay';
        drawer.className = 'drawer-overlay';
        drawer.onclick = function(e) { if (e.target === drawer) cerrarDrawerFiltros(); };

        drawer.innerHTML = `
            <div class="drawer-panel" onclick="event.stopPropagation()">
                <div class="drawer-header">
                    <h3>🎛️ Filtros Avanzados</h3>
                    <span style="font-size: 1.5rem; cursor: pointer; color: #64748b;" onclick="cerrarDrawerFiltros()">&times;</span>
                </div>
                <div class="drawer-content">
                    <div>
                        <div class="filter-group-title">Forma de Armazón</div>
                        <div class="filter-chips-grid">
                            <button class="chip-filter" onclick="seleccionarChipFiltro('forma', 'Aviador', this)">Aviador</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('forma', 'Cat Eye', this)">Cat Eye</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('forma', 'Redondo', this)">Redondo</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('forma', 'Rectangular', this)">Rectangular</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('forma', 'Cuadrado', this)">Cuadrado</button>
                        </div>
                    </div>

                    <div>
                        <div class="filter-group-title">Material</div>
                        <div class="filter-chips-grid">
                            <button class="chip-filter" onclick="seleccionarChipFiltro('material', 'Pasta', this)">Pasta / Acetato</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('material', 'Metálico', this)">Metálico</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('material', 'Titanio', this)">Titanio</button>
                        </div>
                    </div>

                    <div>
                        <div class="filter-group-title">Género</div>
                        <div class="filter-chips-grid">
                            <button class="chip-filter" onclick="seleccionarChipFiltro('genero', 'Dama', this)">Dama</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('genero', 'Caballero', this)">Caballero</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('genero', 'Unisex', this)">Unisex</button>
                            <button class="chip-filter" onclick="seleccionarChipFiltro('genero', 'Niños', this)">Niños</button>
                        </div>
                    </div>

                    <div style="border-top: 1px solid var(--color-border); padding-top: 1rem;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: bold; cursor: pointer;">
                            <input type="checkbox" id="chkSoloStock" onchange="filtrosFacetadosActivos.soloStock = this.checked">
                            <span>🟢 Solo modelos con stock disponible</span>
                        </label>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 1rem;">
                        <button onclick="aplicarFiltrosFacetados()" class="btn btn-primary" style="flex: 1; padding: 0.8rem; font-weight: bold;">Aplicar Filtros</button>
                        <button onclick="limpiarFiltrosFacetados()" class="btn" style="background: #e2e8f0; color: #1e293b; padding: 0.8rem; font-weight: bold;">Limpiar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(drawer);
    }
    drawer.classList.add('active');
}

function cerrarDrawerFiltros() {
    const drawer = document.getElementById('mvrFiltrosDrawerOverlay');
    if (drawer) drawer.classList.remove('active');
}

function seleccionarChipFiltro(categoria, valor, btn) {
    reproducirSonido('click');
    if (filtrosFacetadosActivos[categoria] === valor) {
        filtrosFacetadosActivos[categoria] = null;
        btn.classList.remove('active');
    } else {
        filtrosFacetadosActivos[categoria] = valor;
        btn.parentElement.querySelectorAll('.chip-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
}

function aplicarFiltrosFacetados() {
    reproducirSonido('click');
    cerrarDrawerFiltros();
    if (typeof filtrarCatalogoCombinado === 'function') {
        filtrarCatalogoCombinado();
    }
}

function limpiarFiltrosFacetados() {
    filtrosFacetadosActivos = { forma: null, material: null, genero: null, soloStock: false };
    document.querySelectorAll('.chip-filter').forEach(b => b.classList.remove('active'));
    const chk = document.getElementById('chkSoloStock');
    if (chk) chk.checked = false;
    cerrarDrawerFiltros();
    if (typeof filtrarCatalogoCombinado === 'function') {
        filtrarCatalogoCombinado();
    }
}

// Inicializar el contador, favoritos, PWA y tema al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    inicializarTema();
    inyectarComponentesModernos();
    actualizarContadorCarrito();
    actualizarBotonesFavoritosUI();
    actualizarBotonFlotanteFavoritos();
    actualizarBarraComparadorUI();
    inicializarPWA();
});