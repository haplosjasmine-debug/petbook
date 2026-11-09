const API = '/api';
const TOKEN_KEY = 'petbook_token';

const state = {
    token: localStorage.getItem(TOKEN_KEY) || null,
    user: null,
    business: null,
    route: 'home',
    booting: true,
    apptFilter: 'all',
    reportFrom: '',
    reportTo: '',
    pendingBusinessId: null,
    pendingServiceId: null,
    loginEmail: '',
};

const STATUS_CLASS = {
    pending: 'yellow',
    confirmed: 'blue',
    in_progress: 'orange',
    completed: 'green',
    cancelled: 'red',
    no_show: 'red',
    unpaid: 'yellow',
    paid: 'green',
    failed: 'red',
    refunded: 'blue',
};

function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
}

function money(value) {
    return '\u20b1' + Number(value || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function label(value) {
    return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(value, withTime = true) {
    if (!value) return '\u2014';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return esc(value);
    return date.toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
}

function fmtDateInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initials(name) {
    return String(name || 'PB').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function pill(value) {
    return `<span class="pill ${STATUS_CLASS[value] || ''}">${esc(label(value))}</span>`;
}

function errorMessage(data, status) {
    if (data && data.errors) {
        const first = Object.values(data.errors)[0];
        if (Array.isArray(first) && first.length) return first[0];
    }
    if (data && data.message) return data.message;
    return `Request failed (${status}).`;
}

async function api(path, options = {}) {
    const { method = 'GET', body, auth = true } = options;
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && state.token) headers.Authorization = `Bearer ${state.token}`;

    let response;
    try {
        response = await fetch(API + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (error) {
        throw new Error('Cannot reach the PetBook API. Is the server running?');
    }

    const text = await response.text();
    let data = null;
    if (text) {
        try { data = JSON.parse(text); } catch (error) { data = { message: text }; }
    }

    if (!response.ok) {
        if (response.status === 401 && auth && state.token) {
            clearAuth();
            if (!state.booting && location.hash !== '#/login') location.hash = '#/login';
        }
        throw new Error(errorMessage(data, response.status));
    }

    return data;
}

function applyAuth(payload) {
    state.token = payload.token;
    localStorage.setItem(TOKEN_KEY, payload.token);
    state.user = payload.user;
    state.business = payload.business || null;
}

function clearAuth() {
    state.token = null;
    state.user = null;
    state.business = null;
    localStorage.removeItem(TOKEN_KEY);
}

function toast(message, type = 'success') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' ? 'error' : ''}`;
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => node.remove(), 4200);
}

function openModal(html) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `<div class="modal-backdrop" onclick="if (event.target === this) closeModal()"><div class="modal">${html}</div></div>`;
}

function closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
}

function go(route) {
    const target = `#/${route}`;
    if (location.hash === target) {
        render();
    } else {
        location.hash = target;
    }
}

function dashboardRoute() {
    if (!state.user) return 'login';
    if (state.user.role === 'business') return 'business';
    if (state.user.role === 'admin') return 'admin';
    return 'owner';
}

function requireAuth(role) {
    if (!state.user) {
        go('login');
        return false;
    }
    if (role && state.user.role !== role) {
        go(dashboardRoute());
        return false;
    }
    return true;
}

function navLink(route, text, current) {
    return `<a href="#/${route}" class="${current === route ? 'active' : ''}">${text}</a>`;
}

function navLinks(current) {
    const links = [navLink('home', 'Explore', current)];
    if (!state.user) return links.join('');

    if (state.user.role === 'owner') {
        links.push(navLink('owner', 'Dashboard', current));
        links.push(navLink('owner-pets', 'My pets', current));
        links.push(navLink('owner-book', 'Book', current));
        links.push(navLink('owner-appointments', 'Appointments', current));
        links.push(navLink('owner-payments', 'Payments', current));
        links.push(navLink('owner-loyalty', 'Rewards', current));
    }

    if (state.user.role === 'business') {
        links.push(navLink('business', 'Dashboard', current));
        links.push(navLink('business-appointments', 'Schedule', current));
        links.push(navLink('business-services', 'Services', current));
        links.push(navLink('business-staff', 'Staff', current));
        links.push(navLink('business-payments', 'Payments', current));
        links.push(navLink('business-reports', 'Reports', current));
        links.push(navLink('business-commissions', 'Commissions', current));
        links.push(navLink('business-settings', 'Settings', current));
    }

    if (state.user.role === 'admin') {
        links.push(navLink('admin', 'Overview', current));
        links.push(navLink('admin-commissions', 'Commissions', current));
    }

    return links.join('');
}

function layout(content, current) {
    const user = state.user;
    return `
        <header class="topbar">
            <a class="brand" href="#/home">PetBook<span>.</span></a>
            <nav class="nav-links">${navLinks(current)}</nav>
            <div class="nav-actions">
                ${user
                    ? `<span class="user-chip"><b>${esc(user.first_name)}</b> \u00b7 ${esc(user.role)}</span>
                       <button class="btn ghost small" onclick="logout()">Sign out</button>`
                    : `<a class="btn ghost small" href="#/login">Sign in</a>
                       <a class="btn primary small" href="#/register">Get started</a>`}
                ${user && (user.role === 'admin' || user.role === 'business')
                    ? `<a class="btn soft small" href="http://127.0.0.1:8055/admin" target="_blank" rel="noopener">Directus CMS</a>`
                    : ''}
            </div>
        </header>
        <main class="container">
            ${content}
            <footer class="footer">
                <span>PetBook \u00b7 Care, booked.</span>
                <span>Laravel API \u00b7 Directus CMS \u00b7 PayMongo payments</span>
            </footer>
        </main>`;
}

async function render() {
    const hash = location.hash.replace(/^#\/?/, '');
    const route = hash || 'home';
    state.route = route;
    const root = document.getElementById('app');
    root.innerHTML = layout('<div class="loading"><span class="spinner"></span> Loading\u2026</div>', route);
    closeModal();

    let content;
    try {
        content = await viewFor(route);
    } catch (error) {
        content = `<div class="notice">${esc(error.message)}</div>`;
    }

    root.innerHTML = layout(content, route);
}

async function viewFor(route) {
    switch (route) {
        case 'home': return viewHome();
        case 'login': return viewLogin();
        case 'register': return viewRegister();
        case 'owner': return requireAuth('owner') ? viewOwnerDashboard() : loadingView();
        case 'owner-pets': return requireAuth('owner') ? viewOwnerPets() : loadingView();
        case 'owner-book': return requireAuth('owner') ? viewOwnerBook() : loadingView();
        case 'owner-appointments': return requireAuth('owner') ? viewOwnerAppointments() : loadingView();
        case 'owner-payments': return requireAuth('owner') ? viewOwnerPayments() : loadingView();
        case 'owner-loyalty': return requireAuth('owner') ? viewOwnerLoyalty() : loadingView();
        case 'business': return requireAuth('business') ? viewBusinessDashboard() : loadingView();
        case 'business-appointments': return requireAuth('business') ? viewBusinessAppointments() : loadingView();
        case 'business-services': return requireAuth('business') ? viewBusinessServices() : loadingView();
        case 'business-staff': return requireAuth('business') ? viewBusinessStaff() : loadingView();
        case 'business-payments': return requireAuth('business') ? viewBusinessPayments() : loadingView();
        case 'business-reports': return requireAuth('business') ? viewBusinessReports() : loadingView();
        case 'business-commissions': return requireAuth('business') ? viewBusinessCommissions() : loadingView();
        case 'business-settings': return requireAuth('business') ? viewBusinessSettings() : loadingView();
        case 'admin': return requireAuth('admin') ? viewAdmin() : loadingView();
        case 'admin-commissions': return requireAuth('admin') ? viewAdminCommissions() : loadingView();
        default: return viewHome();
    }
}

function loadingView() {
    return '<div class="loading"><span class="spinner"></span></div>';
}

function sectionHead(eyebrow, title, copy) {
    return `<div class="section-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p>${copy || ''}</p></div></div>`;
}

function stat(labelText, value, hint, accent = false) {
    return `<div class="stat ${accent ? 'accent' : ''}">
        <div class="label">${esc(labelText)}</div>
        <div class="value">${value}</div>
        ${hint ? `<div class="hint">${esc(hint)}</div>` : ''}
    </div>`;
}

function empty(text) {
    return `<div class="empty">${esc(text)}</div>`;
}

async function viewHome() {
    const response = await api('/businesses', { auth: false });
    const businesses = response.data || [];

    const cards = businesses.map((business) => `
        <div class="card">
            <div class="biz-top">
                <div class="biz-avatar">${initials(business.name)}</div>
                <div>
                    <h3>${esc(business.name)}</h3>
                    <div class="biz-meta">${esc(business.city || business.address || 'Book online')}</div>
                </div>
            </div>
            <p class="muted small">${esc(business.description || 'Grooming, veterinary care, and wellness services for your pet.')}</p>
            <div class="row-actions" style="justify-content:flex-start;margin-top:14px">
                <span class="pill green">${Number(business.services_count || 0)} services</span>
                <button class="btn soft small" onclick="showBusiness(${business.id})">View services</button>
                <button class="btn primary small" onclick="startBooking(${business.id})">Book now</button>
            </div>
        </div>`).join('');

    return `
        <section class="hero">
            <div>
                <span class="eyebrow" style="color:var(--yellow)">Pet care, simplified</span>
                <h1>Book trusted pet care in seconds.</h1>
                <p>Grooming, veterinary visits, vaccinations, packages, and loyalty rewards \u2014 one place for every pet.</p>
                <div class="hero-actions">
                    ${state.user
                        ? `<a class="btn orange" href="#/${dashboardRoute()}">Open dashboard</a>`
                        : `<a class="btn orange" href="#/register">Create free account</a><a class="btn ghost" href="#/login">Sign in</a>`}
                    <button class="btn ghost" onclick="document.getElementById('providers').scrollIntoView({behavior:'smooth'})">Browse providers</button>
                </div>
            </div>
            <div class="hero-card">
                <h3>Today at Happy Paws</h3>
                <p>Live schedule from the business dashboard</p>
                <div class="mini-row"><span><span class="mini-dot"></span>Grooming \u00b7 Biscuit</span><span class="pill green">Confirmed</span></div>
                <div class="mini-row"><span><span class="mini-dot"></span>Vaccination \u00b7 Luna</span><span class="pill blue">Upcoming</span></div>
                <div class="mini-row"><span><span class="mini-dot"></span>Nail trim \u00b7 Milo</span><span class="pill yellow">Pending</span></div>
                <div class="mini-row"><span>Platform commission</span><span><b>10%</b></span></div>
            </div>
        </section>

        ${sectionHead('Verified providers', 'Pet care near you', 'Browse services and book instantly. Payment is available through GCash, Maya, GrabPay, QR Ph, or card.')}
        <div class="grid three" id="providers">
            ${cards || empty('No active businesses yet. Run the seeder or create one through Directus.')}
        </div>

        <div class="hero-steps">
            <div class="step"><b>1. Pick a provider</b><span>Compare grooming, veterinary, and wellness services.</span></div>
            <div class="step"><b>2. Book a slot</b><span>Choose your pet, service, and preferred date and time.</span></div>
            <div class="step"><b>3. Earn rewards</b><span>Collect loyalty points and get SMS reminders before visits.</span></div>
        </div>`;
}

async function showBusiness(id) {
    openModal('<div class="loading"><span class="spinner"></span></div>');
    try {
        const business = (await api(`/businesses/${id}`, { auth: false })).data;
        const services = (business.services || []).map((service) => `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(service.name)}</div>
                    <div class="meta">${esc(label(service.category))} \u00b7 ${Number(service.duration_min)} min \u00b7 ${money(service.price)}</div>
                </div>
                <button class="btn primary small" onclick="startBookingService(${business.id}, ${service.id})">Book</button>
            </div>`).join('');
        const staff = (business.staff || []).map((member) =>
            `<span class="pill">${esc(member.name)} \u00b7 ${esc(label(member.role))}</span>`).join('');

        openModal(`
            <button class="modal-close" onclick="closeModal()">\u00d7</button>
            <span class="eyebrow">${esc(business.city || 'Pet care provider')}</span>
            <h2>${esc(business.name)}</h2>
            <p class="muted">${esc(business.description || '')}</p>
            <div class="mini-row"><span>Phone</span><span>${esc(business.phone || '\u2014')}</span></div>
            <div class="mini-row"><span>Address</span><span>${esc(business.address || '\u2014')}</span></div>
            <h3 style="margin:18px 0 10px">Services</h3>
            <div class="list">${services || empty('No active services yet.')}</div>
            ${staff ? `<h3 style="margin:18px 0 10px">Team</h3><div class="row-actions" style="justify-content:flex-start">${staff}</div>` : ''}
        `);
    } catch (error) {
        closeModal();
        toast(error.message, 'error');
    }
}

function startBooking(businessId, serviceId = null) {
    state.pendingBusinessId = businessId;
    state.pendingServiceId = serviceId;
    if (!state.user) {
        state.loginEmail = '';
        go('login');
        return;
    }
    if (state.user.role !== 'owner' && state.user.role !== 'admin') {
        toast('Only pet owner accounts can book appointments.', 'error');
        return;
    }
    go('owner-book');
}

function startBookingService(businessId, serviceId) {
    closeModal();
    startBooking(businessId, serviceId);
}

async function viewLogin() {
    return `
        <div class="auth-wrap">
            <aside class="auth-aside">
                <span class="eyebrow" style="color:var(--yellow)">PetBook accounts</span>
                <h2>One login for every pet and every visit.</h2>
                <p>Use a demo account to explore the customer app, the business dashboard, or the platform admin view.</p>
                <div class="demo-list">
                    <button class="demo-btn" onclick="fillLogin('customer@petbook.app')"><b>Pet owner</b><span>customer@petbook.app</span></button>
                    <button class="demo-btn" onclick="fillLogin('owner@petbook.app')"><b>Business owner</b><span>owner@petbook.app</span></button>
                    <button class="demo-btn" onclick="fillLogin('admin@petbook.app')"><b>Platform admin</b><span>admin@petbook.app</span></button>
                </div>
                <p class="small" style="margin-top:14px;color:rgba(255,255,255,.6)">All demo passwords are <b>password</b>.</p>
            </aside>
            <div class="card">
                <h2>Welcome back</h2>
                <p class="muted">Sign in to manage bookings, pets, and your business.</p>
                <form onsubmit="handleLogin(event)">
                    <div class="field">
                        <label>Email</label>
                        <input name="email" type="email" required value="${esc(state.loginEmail)}" placeholder="you@example.com">
                    </div>
                    <div class="field">
                        <label>Password</label>
                        <input name="password" type="password" required placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022">
                    </div>
                    <button class="btn primary block">Sign in</button>
                </form>
                <p class="form-note">New to PetBook? <a href="#/register" style="color:var(--green);font-weight:700">Create an account</a></p>
            </div>
        </div>`;
}

function fillLogin(email) {
    state.loginEmail = email;
    render();
}

async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const result = await api('/auth/login', {
            auth: false,
            method: 'POST',
            body: {
                email: form.get('email'),
                password: form.get('password'),
                device: 'web',
            },
        });
        applyAuth(result.data);
        toast(`Welcome back, ${state.user.first_name}.`);
        if (state.user.role === 'owner' && state.pendingBusinessId) {
            go('owner-book');
        } else {
            go(dashboardRoute());
        }
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewRegister() {
    return `
        <div class="auth-wrap">
            <aside class="auth-aside">
                <span class="eyebrow" style="color:var(--yellow)">Join PetBook</span>
                <h2>Care for pets. Grow your business.</h2>
                <p>Pet owners get booking, reminders, health records, and loyalty points. Businesses get a full scheduling and revenue dashboard.</p>
                <div class="mini-row"><span>Booking + SMS reminders</span><span>\u2713</span></div>
                <div class="mini-row"><span>Pet records + vaccinations</span><span>\u2713</span></div>
                <div class="mini-row"><span>PayMongo checkout</span><span>\u2713</span></div>
                <div class="mini-row"><span>Loyalty rewards</span><span>\u2713</span></div>
            </aside>
            <div class="card">
                <h2>Create your account</h2>
                <p class="muted">Choose whether you are a pet owner or a pet care business.</p>
                <form onsubmit="handleRegister(event)">
                    <div class="field">
                        <label>Account type</label>
                        <select name="role" id="register-role" onchange="toggleBusinessFields()">
                            <option value="owner">Pet owner</option>
                            <option value="business">Business owner</option>
                        </select>
                    </div>
                    <div class="field-row">
                        <div class="field"><label>First name</label><input name="first_name" required maxlength="100"></div>
                        <div class="field"><label>Last name</label><input name="last_name" required maxlength="100"></div>
                    </div>
                    <div class="field"><label>Email</label><input name="email" type="email" required></div>
                    <div class="field-row">
                        <div class="field"><label>Phone</label><input name="phone" placeholder="+63 900 000 0000"></div>
                        <div class="field"><label>Password</label><input name="password" type="password" minlength="8" required></div>
                    </div>
                    <div class="field"><label>Confirm password</label><input name="password_confirmation" type="password" minlength="8" required></div>
                    <div id="business-fields" style="display:none">
                        <div class="field"><label>Business name</label><input name="business_name" maxlength="150" placeholder="Happy Paws Grooming"></div>
                        <div class="field-row">
                            <div class="field"><label>City</label><input name="city" maxlength="120"></div>
                            <div class="field"><label>Address</label><input name="address" maxlength="255"></div>
                        </div>
                        <div class="field"><label>Description</label><textarea name="description" maxlength="2000" placeholder="Tell pet owners what makes your business special."></textarea></div>
                    </div>
                    <button class="btn primary block">Create account</button>
                </form>
                <p class="form-note">Already registered? <a href="#/login" style="color:var(--green);font-weight:700">Sign in</a></p>
            </div>
        </div>`;
}

function toggleBusinessFields() {
    const role = document.getElementById('register-role').value;
    const fields = document.getElementById('business-fields');
    if (fields) fields.style.display = role === 'business' ? 'block' : 'none';
}

async function handleRegister(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const body = {
        first_name: form.get('first_name'),
        last_name: form.get('last_name'),
        email: form.get('email'),
        phone: form.get('phone') || null,
        password: form.get('password'),
        password_confirmation: form.get('password_confirmation'),
        role: form.get('role'),
        business_name: form.get('business_name') || null,
        address: form.get('address') || null,
        city: form.get('city') || null,
        description: form.get('description') || null,
        device: 'web',
    };
    try {
        const result = await api('/auth/register', { auth: false, method: 'POST', body });
        applyAuth(result.data);
        toast('Account created. Welcome to PetBook.');
        go(dashboardRoute());
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function logout() {
    try {
        await api('/auth/logout', { method: 'POST' });
    } catch (error) {
        // The local session is cleared regardless.
    }
    clearAuth();
    toast('Signed out.');
    go('home');
}

async function viewOwnerDashboard() {
    const summary = (await api('/dashboard')).data.summary;
    const next = (summary.next_appointments || []).map((appointment) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(appointment.service?.name || 'Appointment')} \u00b7 ${esc(appointment.pet?.name || 'Pet')}</div>
                <div class="meta">${esc(appointment.business?.name || '')} \u00b7 ${fmtDate(appointment.start_at)}</div>
            </div>
            ${pill(appointment.status)}
        </div>`).join('');

    const vaccinations = (summary.vaccinations_due || []).map((item) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(item.pet_name)} \u00b7 ${esc(item.vaccine)}</div>
                <div class="meta">Due ${fmtDate(item.due_at, false)}</div>
            </div>
            <span class="pill ${item.overdue ? 'red' : 'yellow'}">${item.overdue ? 'Overdue' : 'Due soon'}</span>
        </div>`).join('');

    return `
        <div class="section-head">
            <div><span class="eyebrow">Pet owner dashboard</span><h2>Hi ${esc(state.user.first_name)}.</h2><p>Your pets, upcoming visits, and rewards at a glance.</p></div>
            <a class="btn primary" href="#/owner-book">Book an appointment</a>
        </div>
        <div class="grid four">
            ${stat('Pets', summary.pets, 'In your household')}
            ${stat('Upcoming', summary.upcoming_appointments, 'Appointments', true)}
            ${stat('Loyalty points', summary.loyalty_points, 'Redeemable rewards')}
            ${stat('Total spent', money(summary.total_spent), 'All time')}
        </div>
        <div class="grid two" style="margin-top:18px">
            <div class="card">
                <div class="card-head"><div><h3>Next appointments</h3><span class="muted small">Confirmed and pending visits</span></div><a class="btn ghost small" href="#/owner-appointments">View all</a></div>
                <div class="list">${next || empty('No upcoming appointments. Book your first visit.')}</div>
            </div>
            <div class="card">
                <div class="card-head"><div><h3>Vaccinations due</h3><span class="muted small">Keep health records current</span></div></div>
                <div class="list">${vaccinations || empty('No vaccination reminders right now.')}</div>
            </div>
        </div>
        <div class="grid three" style="margin-top:18px">
            <div class="card"><h3>Manage pets</h3><p class="muted small">Add pets, review health records, and keep details up to date.</p><a class="btn soft small" href="#/owner-pets">Open pets</a></div>
            <div class="card"><h3>Payments</h3><p class="muted small">Pay online via PayMongo or view cash payments recorded by the business.</p><a class="btn soft small" href="#/owner-payments">View payments</a></div>
            <div class="card"><h3>Rewards</h3><p class="muted small">Earn points on completed visits and redeem them for perks.</p><a class="btn soft small" href="#/owner-loyalty">View rewards</a></div>
        </div>`;
}

async function viewOwnerPets() {
    const pets = (await api('/pets')).data || [];
    const cards = pets.map((pet) => `
        <div class="card">
            <div class="biz-top">
                <div class="biz-avatar">${initials(pet.name)}</div>
                <div><h3>${esc(pet.name)}</h3><div class="biz-meta">${esc(label(pet.species))}${pet.breed ? ` \u00b7 ${esc(pet.breed)}` : ''}</div></div>
            </div>
            <div class="mini-row"><span>Sex</span><span>${esc(label(pet.sex || 'unknown'))}</span></div>
            <div class="mini-row"><span>Weight</span><span>${pet.weight_kg ? `${Number(pet.weight_kg)} kg` : '\u2014'}</span></div>
            <div class="mini-row"><span>Appointments</span><span>${Number(pet.appointments_count || 0)}</span></div>
            <div class="row-actions" style="justify-content:flex-start;margin-top:14px">
                <button class="btn soft small" onclick="showPet(${pet.id})">View records</button>
                <button class="btn ghost small" onclick="deletePet(${pet.id})">Remove</button>
            </div>
        </div>`).join('');

    return `
        ${sectionHead('My pets', 'Your pet family', 'Add each pet so booking, health records, and reminders stay organized.')}
        <div class="grid three" style="margin-bottom:20px">${cards || empty('No pets yet. Add your first pet below.')}</div>
        <div class="card form-card">
            <div class="card-head"><div><h3>Add a pet</h3><span class="muted small">Required: name and species.</span></div></div>
            <form onsubmit="handleAddPet(event)">
                <div class="field-row">
                    <div class="field"><label>Name</label><input name="name" required maxlength="100"></div>
                    <div class="field"><label>Species</label>
                        <select name="species">
                            <option value="dog">Dog</option><option value="cat">Cat</option>
                            <option value="bird">Bird</option><option value="rabbit">Rabbit</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field"><label>Breed</label><input name="breed" maxlength="100"></div>
                    <div class="field"><label>Sex</label>
                        <select name="sex"><option value="unknown">Unknown</option><option value="male">Male</option><option value="female">Female</option></select>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field"><label>Birth date</label><input name="birth_date" type="date"></div>
                    <div class="field"><label>Weight (kg)</label><input name="weight_kg" type="number" step="0.01" min="0" max="200"></div>
                </div>
                <div class="field"><label>Color / markings</label><input name="color" maxlength="60"></div>
                <div class="field"><label>Notes</label><textarea name="notes" maxlength="2000" placeholder="Allergies, temperament, feeding notes\u2026"></textarea></div>
                <button class="btn primary">Add pet</button>
            </form>
        </div>`;
}

async function handleAddPet(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const body = {
        name: form.get('name'),
        species: form.get('species'),
        breed: form.get('breed') || null,
        sex: form.get('sex') || 'unknown',
        birth_date: form.get('birth_date') || null,
        weight_kg: form.get('weight_kg') ? Number(form.get('weight_kg')) : null,
        color: form.get('color') || null,
        notes: form.get('notes') || null,
    };
    try {
        await api('/pets', { method: 'POST', body });
        toast('Pet added.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function showPet(id) {
    openModal('<div class="loading"><span class="spinner"></span></div>');
    try {
        const pet = (await api(`/pets/${id}`)).data;
        const records = (pet.medical_records || []).map((record) => `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(record.title || record.type || 'Record')}</div>
                    <div class="meta">${fmtDate(record.recorded_at)} \u00b7 ${esc(record.staff?.name || 'Clinic')}</div>
                    ${record.notes ? `<div class="meta">${esc(record.notes)}</div>` : ''}
                </div>
                ${pill(record.type || 'note')}
            </div>`).join('');
        const vaccinations = (pet.vaccinations || []).map((item) => `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(item.name)}</div>
                    <div class="meta">Given ${fmtDate(item.administered_at, false)}${item.next_due_at ? ` \u00b7 next due ${fmtDate(item.next_due_at, false)}` : ''}</div>
                </div>
            </div>`).join('');
        const appointments = (pet.appointments || []).slice(0, 6).map((appointment) => `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(appointment.service?.name || 'Visit')}</div>
                    <div class="meta">${esc(appointment.business?.name || '')} \u00b7 ${fmtDate(appointment.start_at)}</div>
                </div>
                ${pill(appointment.status)}
            </div>`).join('');

        openModal(`
            <button class="modal-close" onclick="closeModal()">\u00d7</button>
            <span class="eyebrow">${esc(label(pet.species))}${pet.breed ? ` \u00b7 ${esc(pet.breed)}` : ''}</span>
            <h2>${esc(pet.name)}</h2>
            <div class="mini-row"><span>Age</span><span>${pet.birth_date ? `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} years` : '\u2014'}</span></div>
            <div class="mini-row"><span>Weight</span><span>${pet.weight_kg ? `${Number(pet.weight_kg)} kg` : '\u2014'}</span></div>
            <div class="mini-row"><span>Notes</span><span>${esc(pet.notes || '\u2014')}</span></div>
            <h3 style="margin:20px 0 10px">Recent appointments</h3>
            <div class="list">${appointments || empty('No appointments recorded.')}</div>
            <h3 style="margin:20px 0 10px">Medical records</h3>
            <div class="list">${records || empty('No medical records yet.')}</div>
            <h3 style="margin:20px 0 10px">Vaccinations</h3>
            <div class="list">${vaccinations || empty('No vaccinations recorded.')}</div>
        `);
    } catch (error) {
        closeModal();
        toast(error.message, 'error');
    }
}

async function deletePet(id) {
    if (!confirm('Remove this pet? Their appointment history will remain in business records.')) return;
    try {
        await api(`/pets/${id}`, { method: 'DELETE' });
        toast('Pet removed.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewOwnerBook() {
    const [businesses, pets] = await Promise.all([
        api('/businesses', { auth: false }),
        api('/pets'),
    ]);

    const businessList = businesses.data || [];
    const petList = pets.data || [];

    if (!businessList.length) return empty('No active businesses are available for booking yet.');
    if (!petList.length) {
        return `<div class="notice">Add a pet before booking. <a href="#/owner-pets" style="font-weight:700;color:inherit;text-decoration:underline">Add a pet</a></div>`;
    }

    const selectedBusinessId = Number(state.pendingBusinessId) || businessList[0].id;
    const detail = (await api(`/businesses/${selectedBusinessId}`, { auth: false })).data;
    const services = detail.services || [];
    const staff = detail.staff || [];

    const businessOptions = businessList.map((business) =>
        `<option value="${business.id}" ${business.id === selectedBusinessId ? 'selected' : ''}>${esc(business.name)}${business.city ? ` \u2014 ${esc(business.city)}` : ''}</option>`).join('');
    const serviceOptions = services.map((service) =>
        `<option value="${service.id}" ${Number(state.pendingServiceId) === service.id ? 'selected' : ''}>${esc(service.name)} \u00b7 ${money(service.price)} \u00b7 ${Number(service.duration_min)} min</option>`).join('');
    const petOptions = petList.map((pet) =>
        `<option value="${pet.id}">${esc(pet.name)} \u00b7 ${esc(label(pet.species))}</option>`).join('');

    return `
        ${sectionHead('Book a visit', 'Reserve a slot', 'Choose a provider, service, pet, and preferred time. A reminder is scheduled automatically.')}
        <div class="grid two">
            <div class="card">
                <form onsubmit="handleBooking(event)">
                    <div class="field"><label>Business</label><select name="business_id" onchange="switchBookingBusiness(this.value)">${businessOptions}</select></div>
                    <div class="field"><label>Service</label><select name="service_id" required>${serviceOptions || '<option value="">No active services</option>'}</select></div>
                    <div class="field"><label>Pet</label><select name="pet_id" required>${petOptions}</select></div>
                    <div class="field"><label>Preferred date &amp; time</label><input name="start_at" type="datetime-local" required min="${fmtDateInput(new Date(Date.now() + 15 * 60000))}"></div>
                    <div class="field"><label>Staff preference (optional)</label><select name="staff_id"><option value="">Any available staff</option>${staff.map((member) => `<option value="${member.id}">${esc(member.name)} \u00b7 ${esc(label(member.role))}</option>`).join('')}</select></div>
                    <div class="field"><label>Notes for the team</label><textarea name="notes" maxlength="2000" placeholder="Anything the groomer or vet should know?"></textarea></div>
                    <button class="btn primary block" ${services.length ? '' : 'disabled'}>Confirm booking</button>
                </form>
            </div>
            <div class="card">
                <div class="biz-top"><div class="biz-avatar">${initials(detail.name)}</div><div><h3>${esc(detail.name)}</h3><div class="biz-meta">${esc(detail.address || detail.city || '')}</div></div></div>
                <p class="muted small">${esc(detail.description || '')}</p>
                <div class="mini-row"><span>Commission</span><span>${(Number(detail.commission_rate) * 100).toFixed(0)}% platform fee</span></div>
                <div class="mini-row"><span>Payment</span><span>Pay online or cash at the visit</span></div>
                <div class="mini-row"><span>Reminders</span><span>SMS before the appointment</span></div>
                <div class="notice info" style="margin-top:16px">Online payments are powered by PayMongo. GCash, Maya, GrabPay, QR Ph, and cards are supported once live keys are configured.</div>
            </div>
        </div>`;
}

async function switchBookingBusiness(id) {
    state.pendingBusinessId = Number(id);
    state.pendingServiceId = null;
    await render();
}

async function handleBooking(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const startAt = form.get('start_at');
    if (!startAt) {
        toast('Choose a date and time.', 'error');
        return;
    }
    const body = {
        business_id: Number(form.get('business_id')),
        service_id: Number(form.get('service_id')),
        pet_id: Number(form.get('pet_id')),
        staff_id: form.get('staff_id') ? Number(form.get('staff_id')) : null,
        start_at: new Date(startAt).toISOString(),
        notes: form.get('notes') || null,
    };
    try {
        await api('/appointments', { method: 'POST', body });
        state.pendingBusinessId = null;
        state.pendingServiceId = null;
        toast('Appointment booked. A reminder will be sent before the visit.');
        go('owner-appointments');
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewOwnerAppointments() {
    const [appointments, payments] = await Promise.all([
        api('/appointments?per_page=100'),
        api('/payments?per_page=100'),
    ]);
    const paymentMap = {};
    (payments.data || []).forEach((transaction) => {
        if (transaction.appointment_id) paymentMap[transaction.appointment_id] = transaction;
    });

    const rows = (appointments.data || []).map((appointment) => {
        const transaction = paymentMap[appointment.id];
        const paid = transaction && transaction.payment_status === 'paid';
        const canCancel = ['pending', 'confirmed'].includes(appointment.status);
        return `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(appointment.service?.name || 'Appointment')} \u00b7 ${esc(appointment.pet?.name || 'Pet')}</div>
                    <div class="meta">${esc(appointment.business?.name || '')} \u00b7 ${fmtDate(appointment.start_at)}${appointment.staff?.name ? ` \u00b7 ${esc(appointment.staff.name)}` : ''}</div>
                    <div class="meta">${money(appointment.price || appointment.service?.price)}${paid ? ' \u00b7 paid online' : transaction ? ` \u00b7 ${esc(label(transaction.payment_status))}` : ''}</div>
                </div>
                <div class="row-actions">
                    ${pill(appointment.status)}
                    ${canCancel ? `<button class="btn ghost small" onclick="rescheduleAppointment(${appointment.id}, '${esc(fmtDateInput(appointment.start_at))}')">Reschedule</button>` : ''}
                    ${!paid && appointment.status !== 'cancelled' ? `<button class="btn primary small" onclick="payAppointment(${appointment.id})">Pay online</button>` : ''}
                    ${canCancel ? `<button class="btn danger small" onclick="cancelAppointment(${appointment.id})">Cancel</button>` : ''}
                    <button class="btn soft small" onclick="showAppointment(${appointment.id})">Details</button>
                </div>
            </div>`;
    }).join('');

    return `
        ${sectionHead('Appointments', 'Your visits', 'Track upcoming visits, pay online, reschedule, or cancel pending bookings.')}
        <div class="grid three" style="margin-bottom:18px">
            <div class="card"><h3>Upcoming</h3><p class="muted small">Booked and confirmed visits appear here with SMS reminders.</p><a class="btn primary small" href="#/owner-book">Book another</a></div>
            <div class="card"><h3>Payments</h3><p class="muted small">Use GCash, Maya, GrabPay, QR Ph, or card through PayMongo.</p><a class="btn soft small" href="#/owner-payments">Open payments</a></div>
            <div class="card"><h3>Need to change a visit?</h3><p class="muted small">Reschedule or cancel while the appointment is pending or confirmed.</p></div>
        </div>
        <div class="list">${rows || empty('No appointments yet. Book your first visit.')}</div>`;
}

async function showAppointment(id) {
    openModal('<div class="loading"><span class="spinner"></span></div>');
    try {
        const appointment = (await api(`/appointments/${id}`)).data;
        const transaction = appointment.transaction;
        openModal(`
            <button class="modal-close" onclick="closeModal()">\u00d7</button>
            <span class="eyebrow">${esc(appointment.business?.name || 'Appointment')}</span>
            <h2>${esc(appointment.service?.name || 'Visit')}</h2>
            <div class="mini-row"><span>Pet</span><span>${esc(appointment.pet?.name || '')}</span></div>
            <div class="mini-row"><span>When</span><span>${fmtDate(appointment.start_at)}</span></div>
            <div class="mini-row"><span>Status</span><span>${pill(appointment.status)}</span></div>
            <div class="mini-row"><span>Staff</span><span>${esc(appointment.staff?.name || 'Any available')}</span></div>
            <div class="mini-row"><span>Price</span><span>${money(appointment.price || appointment.service?.price)}</span></div>
            ${transaction ? `<div class="mini-row"><span>Payment</span><span>${pill(transaction.payment_status)} \u00b7 ${esc(label(transaction.payment_method || transaction.payment_provider || 'cash'))}</span></div>` : ''}
            ${appointment.notes ? `<div class="mini-row"><span>Notes</span><span>${esc(appointment.notes)}</span></div>` : ''}
            ${appointment.medical_records && appointment.medical_records.length ? `<h3 style="margin:18px 0 10px">Visit records</h3>${appointment.medical_records.map((record) => `<div class="mini-row"><span>${esc(record.title || label(record.type))}</span><span>${esc(record.notes || '')}</span></div>`).join('')}` : ''}
        `);
    } catch (error) {
        closeModal();
        toast(error.message, 'error');
    }
}

async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
        await api(`/appointments/${id}/cancel`, { method: 'POST' });
        toast('Appointment cancelled.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function rescheduleAppointment(id, current) {
    const value = prompt('Enter the new date and time (YYYY-MM-DDTHH:MM):', current || '');
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        toast('That date and time could not be read.', 'error');
        return;
    }
    try {
        await api(`/appointments/${id}/reschedule`, { method: 'PATCH', body: { start_at: parsed.toISOString() } });
        toast('Appointment rescheduled.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function payAppointment(id) {
    try {
        const result = await api('/payments/checkout', {
            method: 'POST',
            body: {
                appointment_id: id,
                success_url: `${location.origin}/#/owner-payments`,
                cancel_url: `${location.origin}/#/owner-appointments`,
            },
        });
        toast('Opening PayMongo checkout\u2026');
        if (result.data.checkout_url) window.open(result.data.checkout_url, '_blank');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function payTransaction(id) {
    try {
        const result = await api('/payments/checkout', {
            method: 'POST',
            body: {
                transaction_id: id,
                success_url: `${location.origin}/#/owner-payments`,
                cancel_url: `${location.origin}/#/owner-payments`,
            },
        });
        toast('Opening PayMongo checkout\u2026');
        if (result.data.checkout_url) window.open(result.data.checkout_url, '_blank');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewOwnerPayments() {
    const response = await api('/payments?per_page=100');
    const rows = (response.data || []).map((transaction) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${money(transaction.amount)} \u00b7 ${esc(transaction.business?.name || 'Payment')}</div>
                <div class="meta">${transaction.appointment ? `Appointment ${fmtDate(transaction.appointment.start_at)}` : 'Package purchase'} \u00b7 ${fmtDate(transaction.created_at)}</div>
                <div class="meta">Provider: ${esc(label(transaction.payment_provider || 'cash'))}${transaction.payment_method ? ` \u00b7 ${esc(label(transaction.payment_method))}` : ''}${transaction.payment_reference ? ` \u00b7 Ref ${esc(transaction.payment_reference)}` : ''}</div>
            </div>
            <div class="row-actions">
                ${pill(transaction.payment_status)}
                ${transaction.payment_status !== 'paid' ? `<button class="btn primary small" onclick="payTransaction(${transaction.id})">Pay now</button>` : ''}
            </div>
        </div>`).join('');

    return `
        ${sectionHead('Payments', 'Your payment history', 'Pay online through PayMongo or settle remaining balances at the business.')}
        <div class="grid three" style="margin-bottom:18px">
            ${stat('Transactions', (response.data || []).length, 'Showing latest 100')}
            ${stat('Total paid', money((response.data || []).filter((t) => t.payment_status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0)), 'Online and cash')}
            ${stat('Outstanding', money((response.data || []).filter((t) => t.payment_status !== 'paid').reduce((sum, t) => sum + Number(t.amount), 0)), 'Unpaid balances')}
        </div>
        <div class="list">${rows || empty('No payments yet.')}</div>`;
}

async function viewOwnerLoyalty() {
    const data = (await api('/loyalty')).data;
    const rows = (data.transactions || []).map((transaction) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(transaction.description || label(transaction.type))}</div>
                <div class="meta">${fmtDate(transaction.created_at)}</div>
            </div>
            <span class="pill ${Number(transaction.points) >= 0 ? 'green' : 'red'}">${Number(transaction.points) >= 0 ? '+' : ''}${Number(transaction.points)}</span>
        </div>`).join('');

    return `
        ${sectionHead('Rewards', 'Loyalty points', 'Earn points on completed visits and redeem them for perks.')}
        <div class="grid three" style="margin-bottom:18px">
            ${stat('Current balance', Number(data.balance), 'points', true)}
            <div class="card"><h3>How it works</h3><p class="muted small">Points are credited automatically when a visit is completed. Redeem them on this page.</p></div>
            <div class="card">
                <h3>Redeem points</h3>
                <form onsubmit="handleRedeem(event)">
                    <div class="field"><label>Points</label><input name="points" type="number" min="1" max="${Number(data.balance)}" required></div>
                    <div class="field"><label>Description</label><input name="description" placeholder="Reward redemption"></div>
                    <button class="btn primary block">Redeem</button>
                </form>
            </div>
        </div>
        <div class="card"><div class="card-head"><div><h3>Points history</h3><span class="muted small">Latest 100 transactions</span></div></div>
            <div class="list">${rows || empty('No loyalty activity yet.')}</div>
        </div>`;
}

async function handleRedeem(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const result = await api('/loyalty/redeem', {
            method: 'POST',
            body: {
                points: Number(form.get('points')),
                description: form.get('description') || 'Loyalty points redeemed',
            },
        });
        toast(`Points redeemed. New balance: ${result.balance}.`);
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

function businessNav(active) {
    return `<div class="tabs">
        <a href="#/business" class="${active === 'business' ? 'active' : ''}">Overview</a>
        <a href="#/business-appointments" class="${active === 'business-appointments' ? 'active' : ''}">Schedule</a>
        <a href="#/business-services" class="${active === 'business-services' ? 'active' : ''}">Services</a>
        <a href="#/business-staff" class="${active === 'business-staff' ? 'active' : ''}">Staff</a>
        <a href="#/business-payments" class="${active === 'business-payments' ? 'active' : ''}">Payments</a>
        <a href="#/business-reports" class="${active === 'business-reports' ? 'active' : ''}">Reports</a>
    </div>`;
}

async function viewBusinessDashboard() {
    if (!state.business) return empty('No business is linked to this account. Ask a platform admin to connect your business.');
    const data = (await api('/dashboard')).data;
    const summary = data.summary;
    const today = summary.today || {};
    const month = summary.month || {};
    const revenue = month.revenue || {};

    const schedule = (summary.today_schedule || []).map((appointment) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(appointment.pet?.name || 'Pet')} \u00b7 ${esc(appointment.service?.name || 'Service')}</div>
                <div class="meta">${fmtDate(appointment.start_at)} \u00b7 ${esc(appointment.owner ? `${appointment.owner.first_name} ${appointment.owner.last_name}` : '')} \u00b7 ${esc(appointment.staff?.name || 'Unassigned')}</div>
            </div>
            ${pill(appointment.status)}
        </div>`).join('');

    const upcoming = (summary.upcoming || []).map((appointment) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(appointment.pet?.name || 'Pet')} \u00b7 ${esc(appointment.service?.name || 'Service')}</div>
                <div class="meta">${fmtDate(appointment.start_at)} \u00b7 ${esc(appointment.staff?.name || 'Unassigned')}</div>
            </div>
            ${pill(appointment.status)}
        </div>`).join('');

    return `
        <div class="section-head">
            <div><span class="eyebrow">Business dashboard</span><h2>${esc(state.business.name)}</h2><p>Today\u2019s schedule, revenue, and commission at a glance.</p></div>
            <div class="row-actions"><a class="btn ghost" href="#/business-settings">Business settings</a><a class="btn primary" href="#/business-appointments">Manage schedule</a></div>
        </div>
        ${businessNav('business')}
        <div class="grid four">
            ${stat('Today appointments', Number(today.appointments || 0), `${Number(today.completed || 0)} completed`)}
            ${stat('Today revenue', money(today.revenue), 'Recorded transactions', true)}
            ${stat('Month revenue', money(revenue.gross), 'Gross sales')}
            ${stat('Month commission', money(revenue.commission), '10% platform fee')}
        </div>
        <div class="grid two" style="margin-top:18px">
            <div class="card">
                <div class="card-head"><div><h3>Today\u2019s schedule</h3><span class="muted small">${fmtDate(new Date(), false)}</span></div><a class="btn ghost small" href="#/business-appointments">View all</a></div>
                <div class="list">${schedule || empty('No appointments scheduled today.')}</div>
            </div>
            <div class="card">
                <div class="card-head"><div><h3>Upcoming</h3><span class="muted small">Next 10 appointments</span></div></div>
                <div class="list">${upcoming || empty('Nothing upcoming yet.')}</div>
            </div>
        </div>
        <div class="grid three" style="margin-top:18px">
            <div class="card"><h3>Net earnings</h3><div class="stat" style="box-shadow:none;padding:0;border:0"><div class="value">${money(revenue.net)}</div><div class="hint">After commission this month</div></div></div>
            <div class="card"><h3>Customers</h3><div class="stat" style="box-shadow:none;padding:0;border:0"><div class="value">${Number(month.customers?.total || 0)}</div><div class="hint">${Number(month.customers?.pets || 0)} pets served</div></div></div>
            <div class="card"><h3>Completed visits</h3><div class="stat" style="box-shadow:none;padding:0;border:0"><div class="value">${Number(month.appointments?.completed || 0)}</div><div class="hint">This month</div></div></div>
        </div>`;
}

async function viewBusinessAppointments() {
    const [appointments, staff, payments] = await Promise.all([
        api('/appointments?per_page=100'),
        api('/staff'),
        api('/payments?per_page=100'),
    ]);
    const paymentMap = {};
    (payments.data || []).forEach((transaction) => {
        if (transaction.appointment_id) paymentMap[transaction.appointment_id] = transaction;
    });
    const staffList = staff.data || [];
    const filters = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const list = (appointments.data || []).filter((appointment) =>
        state.apptFilter === 'all' ? true : appointment.status === state.apptFilter);

    const rows = list.map((appointment) => {
        const transaction = paymentMap[appointment.id];
        const paid = transaction && transaction.payment_status === 'paid';
        const staffOptions = [`<option value="">Unassigned</option>`].concat(staffList.map((member) =>
            `<option value="${member.id}" ${appointment.staff_id === member.id ? 'selected' : ''}>${esc(member.name)}</option>`)).join('');
        return `
            <div class="row-item">
                <div class="grow">
                    <div class="title">${esc(appointment.pet?.name || 'Pet')} \u00b7 ${esc(appointment.service?.name || 'Service')}</div>
                    <div class="meta">${fmtDate(appointment.start_at)} \u00b7 ${esc(appointment.owner ? `${appointment.owner.first_name} ${appointment.owner.last_name}` : '')}${appointment.owner?.phone ? ` \u00b7 ${esc(appointment.owner.phone)}` : ''}</div>
                    <div class="meta">${money(appointment.price || appointment.service?.price)}${transaction ? ` \u00b7 ${esc(label(transaction.payment_status))}` : ''}</div>
                    <div class="row-actions" style="justify-content:flex-start;margin-top:8px">
                        <select onchange="assignStaff(${appointment.id}, this.value)" style="border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-size:12px;background:var(--surface-2)">${staffOptions}</select>
                    </div>
                </div>
                <div class="row-actions">
                    ${pill(appointment.status)}
                    ${appointment.status === 'pending' ? `<button class="btn primary small" onclick="changeAppointmentStatus(${appointment.id}, 'confirmed')">Confirm</button>` : ''}
                    ${appointment.status === 'confirmed' ? `<button class="btn primary small" onclick="changeAppointmentStatus(${appointment.id}, 'in_progress')">Start</button>` : ''}
                    ${appointment.status === 'in_progress' ? `<button class="btn orange small" onclick="changeAppointmentStatus(${appointment.id}, 'completed')">Complete</button>` : ''}
                    ${['pending', 'confirmed'].includes(appointment.status) ? `<button class="btn danger small" onclick="changeAppointmentStatus(${appointment.id}, 'cancelled')">Cancel</button>` : ''}
                    ${transaction && !paid ? `<button class="btn soft small" onclick="recordCashPaid(${transaction.id})">Cash paid</button>` : ''}
                </div>
            </div>`;
    }).join('');

    return `
        ${sectionHead('Schedule', 'Appointments', 'Confirm bookings, assign staff, complete visits, and record cash payments.')}
        ${businessNav('business-appointments')}
        <div class="tabs">
            ${filters.map((filter) => `<button class="${state.apptFilter === filter ? 'active' : ''}" onclick="filterAppointments('${filter}')">${label(filter)}</button>`).join('')}
        </div>
        <div class="list">${rows || empty(`No ${state.apptFilter === 'all' ? '' : label(state.apptFilter) + ' '}appointments.`)}</div>`;
}

function filterAppointments(filter) {
    state.apptFilter = filter;
    render();
}

async function changeAppointmentStatus(id, status) {
    const body = { status };
    if (status === 'completed') {
        const notes = prompt('Completion notes (optional):', '');
        if (notes === null) return;
        const weight = prompt('Pet weight in kg (optional):', '');
        if (weight === null) return;
        body.record_notes = notes || null;
        body.weight_kg = weight ? Number(weight) : null;
    }
    try {
        await api(`/appointments/${id}/status`, { method: 'PATCH', body });
        toast('Appointment updated.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function assignStaff(id, staffId) {
    try {
        await api(`/appointments/${id}/assign-staff`, {
            method: 'PATCH',
            body: { staff_id: staffId ? Number(staffId) : null },
        });
        toast('Staff member assigned.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewBusinessServices() {
    if (!state.business) return empty('No business is linked to this account.');
    const services = (await api(`/services?business_id=${state.business.id}&active_only=false`)).data || [];
    const rows = services.map((service) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(service.name)} ${service.active ? '' : '<span class="pill red">Inactive</span>'}</div>
                <div class="meta">${esc(label(service.category))} \u00b7 ${Number(service.duration_min)} min \u00b7 ${money(service.price)}</div>
                ${service.description ? `<div class="meta">${esc(service.description)}</div>` : ''}
            </div>
            <div class="row-actions">
                <button class="btn soft small" onclick="serviceModal(${service.id})">Edit</button>
                ${service.active ? `<button class="btn danger small" onclick="deactivateService(${service.id})">Deactivate</button>` : `<button class="btn ghost small" onclick="reactivateService(${service.id})">Reactivate</button>`}
            </div>
        </div>`).join('');

    return `
        ${sectionHead('Services', 'Your service menu', 'Create grooming, veterinary, and package services with duration and pricing.')}
        ${businessNav('business-services')}
        <div class="row-actions" style="justify-content:flex-end;margin-bottom:14px"><button class="btn primary" onclick="serviceModal(null)">Add service</button></div>
        <div class="list">${rows || empty('No services yet. Add your first service.')}</div>`;
}

async function serviceModal(id) {
    let service = { name: '', category: 'grooming', description: '', duration_min: 60, price: 0, active: true };
    if (id) {
        try {
            const services = (await api(`/services?business_id=${state.business.id}&active_only=false`)).data || [];
            service = services.find((item) => item.id === id) || service;
        } catch (error) {
            toast(error.message, 'error');
            return;
        }
    }

    openModal(`
        <button class="modal-close" onclick="closeModal()">\u00d7</button>
        <h2>${id ? 'Edit service' : 'Add service'}</h2>
        <form onsubmit="saveService(event, ${id || 'null'})">
            <div class="field"><label>Name</label><input name="name" required maxlength="150" value="${esc(service.name)}"></div>
            <div class="field-row">
                <div class="field"><label>Category</label>
                    <select name="category">
                        ${['grooming', 'veterinary', 'package'].map((category) => `<option value="${category}" ${service.category === category ? 'selected' : ''}>${label(category)}</option>`).join('')}
                    </select>
                </div>
                <div class="field"><label>Duration (minutes)</label><input name="duration_min" type="number" min="5" max="600" required value="${Number(service.duration_min)}"></div>
            </div>
            <div class="field"><label>Price (PHP)</label><input name="price" type="number" step="0.01" min="0" max="100000" required value="${Number(service.price)}"></div>
            <div class="field"><label>Description</label><textarea name="description" maxlength="2000">${esc(service.description || '')}</textarea></div>
            <div class="field"><label><input type="checkbox" name="active" ${service.active ? 'checked' : ''} style="width:auto"> Active and bookable</label></div>
            <button class="btn primary block">${id ? 'Save changes' : 'Create service'}</button>
        </form>`);
}

async function saveService(event, id) {
    event.preventDefault();
    const form = new FormData(event.target);
    const body = {
        name: form.get('name'),
        category: form.get('category'),
        duration_min: Number(form.get('duration_min')),
        price: Number(form.get('price')),
        description: form.get('description') || null,
        active: form.get('active') === 'on',
    };
    try {
        if (id) {
            await api(`/services/${id}`, { method: 'PATCH', body });
        } else {
            await api('/services', { method: 'POST', body });
        }
        closeModal();
        toast(id ? 'Service updated.' : 'Service created.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function deactivateService(id) {
    if (!confirm('Deactivate this service? Existing appointments are unaffected.')) return;
    try {
        await api(`/services/${id}`, { method: 'DELETE' });
        toast('Service deactivated.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function reactivateService(id) {
    try {
        await api(`/services/${id}`, { method: 'PATCH', body: { active: true } });
        toast('Service reactivated.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewBusinessStaff() {
    if (!state.business) return empty('No business is linked to this account.');
    const staff = (await api('/staff')).data || [];
    const rows = staff.map((member) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${esc(member.name)} ${member.active ? '' : '<span class="pill red">Inactive</span>'}</div>
                <div class="meta">${esc(label(member.role))}${member.email ? ` \u00b7 ${esc(member.email)}` : ''}${member.phone ? ` \u00b7 ${esc(member.phone)}` : ''}</div>
                <div class="meta">${Number(member.appointments_count || 0)} appointments</div>
            </div>
            <div class="row-actions">
                <button class="btn soft small" onclick="staffModal(${member.id})">Edit</button>
                ${member.active ? `<button class="btn danger small" onclick="deactivateStaff(${member.id})">Deactivate</button>` : ''}
            </div>
        </div>`).join('');

    return `
        ${sectionHead('Team', 'Staff', 'Add groomers, veterinarians, assistants, and managers, then assign them to appointments.')}
        ${businessNav('business-staff')}
        <div class="row-actions" style="justify-content:flex-end;margin-bottom:14px"><button class="btn primary" onclick="staffModal(null)">Add staff</button></div>
        <div class="list">${rows || empty('No staff yet. Add your first team member.')}</div>`;
}

async function staffModal(id) {
    let member = { name: '', role: 'groomer', email: '', phone: '', bio: '', active: true };
    if (id) {
        try {
            const staff = (await api('/staff')).data || [];
            member = staff.find((item) => item.id === id) || member;
        } catch (error) {
            toast(error.message, 'error');
            return;
        }
    }

    openModal(`
        <button class="modal-close" onclick="closeModal()">\u00d7</button>
        <h2>${id ? 'Edit staff member' : 'Add staff member'}</h2>
        <form onsubmit="saveStaff(event, ${id || 'null'})">
            <div class="field"><label>Name</label><input name="name" required maxlength="150" value="${esc(member.name)}"></div>
            <div class="field"><label>Role</label>
                <select name="role">
                    ${['groomer', 'vet', 'assistant', 'manager'].map((role) => `<option value="${role}" ${member.role === role ? 'selected' : ''}>${label(role)}</option>`).join('')}
                </select>
            </div>
            <div class="field-row">
                <div class="field"><label>Email</label><input name="email" type="email" value="${esc(member.email || '')}"></div>
                <div class="field"><label>Phone</label><input name="phone" value="${esc(member.phone || '')}"></div>
            </div>
            <div class="field"><label>Bio</label><textarea name="bio" maxlength="2000">${esc(member.bio || '')}</textarea></div>
            <div class="field"><label><input type="checkbox" name="active" ${member.active ? 'checked' : ''} style="width:auto"> Active</label></div>
            <button class="btn primary block">${id ? 'Save changes' : 'Add staff'}</button>
        </form>`);
}

async function saveStaff(event, id) {
    event.preventDefault();
    const form = new FormData(event.target);
    const body = {
        name: form.get('name'),
        role: form.get('role'),
        email: form.get('email') || null,
        phone: form.get('phone') || null,
        bio: form.get('bio') || null,
        active: form.get('active') === 'on',
    };
    try {
        if (id) {
            await api(`/staff/${id}`, { method: 'PATCH', body });
        } else {
            await api('/staff', { method: 'POST', body });
        }
        closeModal();
        toast(id ? 'Staff member updated.' : 'Staff member added.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function deactivateStaff(id) {
    if (!confirm('Deactivate this staff member?')) return;
    try {
        await api(`/staff/${id}`, { method: 'DELETE' });
        toast('Staff member deactivated.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

function paymentRow(transaction, options = {}) {
    return `
        <div class="row-item">
            <div class="grow">
                <div class="title">${money(transaction.amount)} \u00b7 ${esc(transaction.business?.name || 'Transaction')}</div>
                <div class="meta">${transaction.appointment ? `Appointment ${fmtDate(transaction.appointment.start_at)}` : 'Package'} \u00b7 ${fmtDate(transaction.created_at)}</div>
                <div class="meta">Commission ${money(transaction.commission_amount)} \u00b7 Net ${money(transaction.net_amount)} \u00b7 ${esc(label(transaction.payment_provider || 'cash'))}${transaction.payment_method ? ` / ${esc(label(transaction.payment_method))}` : ''}</div>
                ${transaction.owner ? `<div class="meta">Customer: ${esc(transaction.owner.first_name)} ${esc(transaction.owner.last_name)}</div>` : ''}
            </div>
            <div class="row-actions">
                ${pill(transaction.payment_status)}
                ${options.cash && transaction.payment_status !== 'paid' ? `<button class="btn soft small" onclick="recordCashPaid(${transaction.id})">Cash paid</button>` : ''}
                ${options.pay && transaction.payment_status !== 'paid' ? `<button class="btn primary small" onclick="payTransaction(${transaction.id})">Pay now</button>` : ''}
            </div>
        </div>`;
}

async function viewBusinessPayments() {
    const response = await api('/payments?per_page=100');
    const rows = (response.data || []).map((transaction) => paymentRow(transaction, { cash: true })).join('');
    return `
        ${sectionHead('Payments', 'Transactions and cash', 'Record cash payments and monitor PayMongo online payments.')}
        ${businessNav('business-payments')}
        <div class="list">${rows || empty('No transactions yet.')}</div>`;
}

async function recordCashPaid(id) {
    if (!confirm('Mark this transaction as paid in cash?')) return;
    const reference = prompt('Cash reference (optional):', '');
    if (reference === null) return;
    try {
        await api(`/payments/${id}/cash-paid`, { method: 'POST', body: { reference: reference || null } });
        toast('Cash payment recorded.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

function currentMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function currentMonthEnd() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
}

async function viewBusinessReports() {
    if (!state.business) return empty('No business is linked to this account.');
    const from = state.reportFrom || currentMonthStart();
    const to = state.reportTo || currentMonthEnd();
    const data = (await api(`/reports/business?from=${from}&to=${to}`)).data;
    const revenue = data.revenue || {};
    const appointments = data.appointments || {};
    const daily = (data.daily || []).map((row) => `
        <tr><td>${esc(row.date)}</td><td>${money(row.revenue)}</td><td>${money(row.commission)}</td><td>${money(row.net)}</td></tr>`).join('');
    const top = (data.top_services || []).map((row) => `
        <tr><td>${esc(row.service)}</td><td>${Number(row.bookings)}</td><td>${money(row.revenue)}</td></tr>`).join('');

    return `
        ${sectionHead('Reports', 'Revenue and performance', 'Filter by date range to review sales, commission, and your busiest services.')}
        ${businessNav('business-reports')}
        <div class="card" style="margin-bottom:18px">
            <form onsubmit="applyReportRange(event)" class="row-actions" style="justify-content:flex-start;align-items:end">
                <div class="field" style="margin:0"><label>From</label><input name="from" type="date" value="${esc(from)}" required></div>
                <div class="field" style="margin:0"><label>To</label><input name="to" type="date" value="${esc(to)}" required></div>
                <button class="btn primary">Apply range</button>
            </form>
        </div>
        <div class="grid four">
            ${stat('Gross revenue', money(revenue.gross), data.period ? `${data.period.from} to ${data.period.to}` : '', true)}
            ${stat('Commission', money(revenue.commission), `${(Number(data.business?.commission_rate || 0) * 100).toFixed(0)}% platform fee`)}
            ${stat('Net earnings', money(revenue.net), 'After commission')}
            ${stat('Pending commission', money(revenue.pending_commission), 'Not yet settled')}
        </div>
        <div class="grid four" style="margin-top:18px">
            ${stat('Appointments', Number(appointments.total || 0), `${Number(appointments.completed || 0)} completed`)}
            ${stat('Upcoming', Number(appointments.upcoming || 0), 'Future bookings')}
            ${stat('Customers', Number(data.customers?.total || 0), 'Unique pet owners')}
            ${stat('Pets served', Number(data.customers?.pets || 0), 'Across visits')}
        </div>
        <div class="grid two" style="margin-top:18px">
            <div class="card"><div class="card-head"><div><h3>Top services</h3><span class="muted small">By completed revenue</span></div></div>
                <div class="table-wrap"><table><thead><tr><th>Service</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>${top || '<tr><td colspan="3">No completed services in this range.</td></tr>'}</tbody></table></div>
            </div>
            <div class="card"><div class="card-head"><div><h3>Daily revenue</h3><span class="muted small">Transaction totals</span></div></div>
                <div class="table-wrap"><table><thead><tr><th>Date</th><th>Revenue</th><th>Commission</th><th>Net</th></tr></thead><tbody>${daily || '<tr><td colspan="4">No transactions in this range.</td></tr>'}</tbody></table></div>
            </div>
        </div>`;
}

async function applyReportRange(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    state.reportFrom = form.get('from');
    state.reportTo = form.get('to');
    await render();
}

async function viewBusinessCommissions() {
    const response = await api('/commissions?per_page=100');
    const rows = (response.data || []).map((transaction) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${money(transaction.commission_amount)} commission on ${money(transaction.amount)}</div>
                <div class="meta">${fmtDate(transaction.created_at)} \u00b7 ${transaction.appointment ? `Appointment ${fmtDate(transaction.appointment.start_at)}` : 'Package'} \u00b7 ${esc(transaction.owner ? `${transaction.owner.first_name} ${transaction.owner.last_name}` : '')}</div>
                <div class="meta">Net to business: ${money(transaction.net_amount)}</div>
            </div>
            <div class="row-actions">${pill(transaction.status)}</div>
        </div>`).join('');
    return `
        ${sectionHead('Commissions', 'Platform commission', 'Every transaction records the 10% platform fee and the net amount owed to your business.')}
        ${businessNav('business-commissions')}
        <div class="card" style="margin-bottom:18px"><p class="muted small" style="margin:0">Commissions are settled by the platform admin. Contact support if a settlement looks incorrect.</p></div>
        <div class="list">${rows || empty('No commission records yet.')}</div>`;
}

async function viewBusinessSettings() {
    if (!state.business) return empty('No business is linked to this account.');
    const business = state.business;
    return `
        ${sectionHead('Settings', 'Business profile', 'Update the details pet owners see when they browse your business.')}
        ${businessNav('business-settings')}
        <div class="card form-card" style="max-width:720px">
            <form onsubmit="saveBusiness(event)">
                <div class="field"><label>Business name</label><input name="name" required maxlength="150" value="${esc(business.name)}"></div>
                <div class="field-row">
                    <div class="field"><label>Email</label><input name="email" type="email" value="${esc(business.email || '')}"></div>
                    <div class="field"><label>Phone</label><input name="phone" value="${esc(business.phone || '')}"></div>
                </div>
                <div class="field-row">
                    <div class="field"><label>City</label><input name="city" maxlength="120" value="${esc(business.city || '')}"></div>
                    <div class="field"><label>Address</label><input name="address" maxlength="255" value="${esc(business.address || '')}"></div>
                </div>
                <div class="field"><label>Description</label><textarea name="description" maxlength="2000">${esc(business.description || '')}</textarea></div>
                <div class="field"><label>Logo URL</label><input name="logo" maxlength="255" value="${esc(business.logo || '')}"></div>
                <div class="field"><label>Timezone</label><input name="timezone" value="${esc(business.timezone || 'Asia/Manila')}"></div>
                <button class="btn primary">Save business profile</button>
            </form>
        </div>`;
}

async function saveBusiness(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
        const result = await api(`/businesses/${state.business.id}`, {
            method: 'PATCH',
            body: {
                name: form.get('name'),
                email: form.get('email') || null,
                phone: form.get('phone') || null,
                city: form.get('city') || null,
                address: form.get('address') || null,
                description: form.get('description') || null,
                logo: form.get('logo') || null,
                timezone: form.get('timezone') || null,
            },
        });
        state.business = result.data;
        toast('Business profile updated.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function viewAdmin() {
    const data = (await api('/dashboard')).data;
    const summary = data.summary || {};
    const totals = summary.totals || {};
    const businesses = summary.by_business || [];
    const daily = summary.daily || [];

    const businessRows = businesses.map((row) => `
        <tr><td>${esc(row.business || `Business ${row.business_id}`)}</td><td>${money(row.revenue)}</td><td>${money(row.commission)}</td><td>${money(row.net)}</td><td>${Number(row.transactions)}</td></tr>`).join('');
    const dailyRows = daily.map((row) => `
        <tr><td>${esc(row.date)}</td><td>${money(row.revenue)}</td><td>${money(row.commission)}</td></tr>`).join('');

    return `
        <div class="section-head">
            <div><span class="eyebrow">Platform admin</span><h2>PetBook overview</h2><p>Commission, businesses, customers, and system health.</p></div>
            <div class="row-actions"><a class="btn ghost" href="http://127.0.0.1:8055/admin" target="_blank" rel="noopener">Open Directus CMS</a><a class="btn primary" href="#/admin-commissions">Settle commissions</a></div>
        </div>
        <div class="grid four">
            ${stat('Gross revenue', money(totals.gross), 'This month', true)}
            ${stat('Platform commission', money(totals.commission), 'This month')}
            ${stat('Transactions', Number(totals.transactions || 0), 'This month')}
            ${stat('Pending commission', money(totals.pending_commission), 'Awaiting settlement')}
        </div>
        <div class="grid four" style="margin-top:18px">
            ${stat('Businesses', Number(summary.businesses?.total || 0), `${Number(summary.businesses?.active || 0)} active`)}
            ${stat('Pet owners', Number(summary.customers?.pet_owners || 0), 'Registered customers')}
            ${stat('Pets', Number(summary.customers?.pets || 0), 'On the platform')}
            ${stat('Package purchases', Number(summary.package_purchases || 0), 'This month')}
        </div>
        <div class="grid two" style="margin-top:18px">
            <div class="card"><div class="card-head"><div><h3>Commission by business</h3><span class="muted small">This month</span></div></div>
                <div class="table-wrap"><table><thead><tr><th>Business</th><th>Revenue</th><th>Commission</th><th>Net</th><th>Txns</th></tr></thead><tbody>${businessRows || '<tr><td colspan="5">No transactions yet.</td></tr>'}</tbody></table></div>
            </div>
            <div class="card"><div class="card-head"><div><h3>Daily totals</h3><span class="muted small">This month</span></div></div>
                <div class="table-wrap"><table><thead><tr><th>Date</th><th>Revenue</th><th>Commission</th></tr></thead><tbody>${dailyRows || '<tr><td colspan="3">No transactions yet.</td></tr>'}</tbody></table></div>
            </div>
        </div>
        <div class="notice info" style="margin-top:18px">Manage collections, users, and custom flows in Directus at <b>http://127.0.0.1:8055/admin</b>. Laravel remains the source of truth for migrations and business logic.</div>`;
}

async function viewAdminCommissions() {
    const response = await api('/commissions?per_page=100');
    const rows = (response.data || []).map((transaction) => `
        <div class="row-item">
            <div class="grow">
                <div class="title">${money(transaction.commission_amount)} on ${money(transaction.amount)} \u00b7 ${esc(transaction.business?.name || '')}</div>
                <div class="meta">${fmtDate(transaction.created_at)} \u00b7 ${transaction.appointment ? `Appointment ${fmtDate(transaction.appointment.start_at)}` : 'Package'} \u00b7 ${esc(transaction.owner ? `${transaction.owner.first_name} ${transaction.owner.last_name}` : '')}</div>
            </div>
            <div class="row-actions">
                ${pill(transaction.status)}
                ${transaction.status !== 'paid' ? `<button class="btn soft small" onclick="markCommissionPaid(${transaction.id})">Mark paid</button>` : ''}
            </div>
        </div>`).join('');
    return `
        ${sectionHead('Commissions', 'Commission ledger', 'Settle the 10% platform fee for each transaction.')}
        <div class="list">${rows || empty('No commission records yet.')}</div>`;
}

async function markCommissionPaid(id) {
    if (!confirm('Mark this commission as settled?')) return;
    try {
        await api(`/commissions/${id}/mark-paid`, { method: 'PATCH' });
        toast('Commission marked as paid.');
        render();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function boot() {
    if (state.token) {
        try {
            const result = await api('/auth/me');
            state.user = result.data.user;
            state.business = result.data.business || null;
        } catch (error) {
            clearAuth();
        }
    }
    state.booting = false;
    if (!location.hash) location.hash = '#/home';
    window.addEventListener('hashchange', () => {
        closeModal();
        render();
    });
    render();
}

boot();
