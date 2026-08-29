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

// Inicializar el contador y tema al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    inicializarTema();
    inyectarComponentesModernos();
    actualizarContadorCarrito();
});