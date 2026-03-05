// Nexus Zero Core Engine
let systemData = null;

// Canvas Background
function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// Navigation
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

// Auth Logic
async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value.trim();
    const error = document.getElementById('error');

    if (!systemData) {
        error.innerText = "ERROR: Núcleo no sincronizado.";
        return;
    }

    const session = systemData.sesion;
    const inputHash = await sha256(pass);
    const cleanUser = user.toLowerCase();
    const cleanSessionUser = session.usuario.trim().toLowerCase();

    if (cleanUser === cleanSessionUser && inputHash === session.pase_adn_sha256) {
        error.innerText = "ADN VALIDADO. ACCEDIENDO...";
        localStorage.setItem('nexus_zero_auth', 'true');
        setTimeout(() => startDashboard(user), 800);
    } else {
        error.innerText = "FALLO ADN: ACCESO DENEGADO.";
    }
}

// Data Handling
async function loadSystem() {
    try {
        const res = await fetch('public_data.json?v=' + Date.now());
        systemData = await res.json();
        if (localStorage.getItem('nexus_zero_auth')) startDashboard(systemData.sesion.usuario);
    } catch (e) { console.error("Falla sync núcleo", e); }
}

function startDashboard(user) {
    document.getElementById('admin-name').innerText = `SUPER_ADMIN: ${user.toUpperCase()}`;
    showView('admin-view');
    renderCards();
    renderLogs();
}

function renderCards() {
    const grid = document.querySelector('.card-grid');
    grid.innerHTML = '';
    const modules = [
        { id: 'personal', title: 'GESTIÓN OPERADORES', icon: '👤', desc: 'Crear nuevos trabajadores y roles.' },
        { id: 'stock', title: 'LOGÍSTICA STOCK', icon: '📦', desc: 'Inventario real-time y productos.' },
        { id: 'links', title: 'MICROSERVICIO ENLACES', icon: '🔗', desc: 'Acortador y rutas seguras.' },
        { id: 'sec', title: 'SEGURIDAD CORE', icon: '🛡️', desc: 'Control de firewall y accesos.' },
        { id: 'soul', title: 'CÁPSULAS ALMA', icon: '🌌', desc: 'Conocimiento inyectado.' }
    ];

    modules.forEach(m => {
        const div = document.createElement('div');
        div.className = 'btn-zero';
        div.innerHTML = `<span class="icon">${m.icon}</span><div class="label"><strong>${m.title}</strong><span>${m.desc}</span></div>`;
        div.onclick = () => {
            if (m.id === 'personal') {
                alert("CARGANDO PANEL DE RECLUTAMIENTO...\nSolo tú, Súper Admin, podés ver esto.");
            } else if (m.id === 'links') {
                showLinksPanel();
            } else {
                alert(`EJECUTANDO MÓDULO: ${m.title}`);
            }
        };
        grid.appendChild(div);
    });
}

function showLinksPanel() {
    const list = systemData.links || [];
    let html = `
        <div class="links-panel glass">
            <h3>GESTIÓN DE RUTAS SEGURAS</h3>
            <div class="links-list">
                ${list.map(l => `
                    <div class="link-item">
                        <span class="slug">/s/${l.slug}</span>
                        <span class="target">${l.target}</span>
                        <button onclick="navigator.clipboard.writeText(window.location.host + '/s/${l.slug}')">COPIAR</button>
                    </div>
                `).join('')}
            </div>
            <p class="note">Para crear nuevos, ejecuta link_shortener.py con tu URL destino.</p>
            <button class="btn-text" onclick="renderCards()">VOLVER</button>
        </div>
    `;
    document.querySelector('.card-grid').innerHTML = html;
}

function renderLogs() {
    const out = document.getElementById('console-output');
    out.innerHTML = '';
    const logs = [...(systemData.mensajes || []), ...(systemData.memoria_errores || [])];
    logs.slice(-20).reverse().forEach(l => {
        const li = document.createElement('li');
        li.innerText = l.mensaje || `${l.contexto}: ${l.error}`;
        out.appendChild(li);
    });
    // Scroll to bottom
    const screen = document.getElementById('terminal-screen');
    if (screen) screen.scrollTop = screen.scrollHeight;
}

function executeCommand(cmd) {
    const out = document.getElementById('console-output');
    const li = document.createElement('li');
    li.innerHTML = `<span style="opacity:0.5">>></span> ${cmd}`;
    out.appendChild(li);

    const parts = cmd.toLowerCase().split(' ');
    const command = parts[0];

    switch (command) {
        case 'help':
            addLog("COMANDOS: help, clear, status, links, soul");
            break;
        case 'clear':
            out.innerHTML = '';
            addLog("TERMINAL REINICIALIZADA.");
            break;
        case 'status':
            addLog("SISTEMA: ONLINE | ADN: VALIDADO | RECEPTOR: ACTIVO");
            break;
        case 'links':
            showLinksPanel();
            addLog("MÓDULO ENLACES ABIERTO.");
            break;
        case 'soul':
            alert("SINTONIZANDO CÁPSULAS DE ALMA...");
            addLog("ALMA: EN FRECUENCIA.");
            break;
        default:
            addLog(`ERROR: COMANDO '${command}' NO RECONOCIDO.`);
    }
}

function addLog(msg) {
    const out = document.getElementById('console-output');
    const li = document.createElement('li');
    li.innerText = msg;
    out.appendChild(li);
    const screen = document.getElementById('terminal-screen');
    if (screen) screen.scrollTop = screen.scrollHeight;
}

// Initialization
window.addEventListener('load', () => {
    initCanvas();
    loadSystem();
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Terminal Keyboard Logic
    const terminalInput = document.getElementById('terminal-input');
    if (terminalInput) {
        terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const cmd = terminalInput.value.trim();
                if (cmd) executeCommand(cmd);
                terminalInput.value = '';
            }
        });
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('nexus_zero_auth');
        location.reload();
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    }
});
