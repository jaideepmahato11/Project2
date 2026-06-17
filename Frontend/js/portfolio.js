const LOCAL_API_URL = 'http://localhost:4002';
const REMOTE_API_URL = 'https://project2-vhg7.vercel.app';
const isLocalHost = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    !window.location.hostname ||
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
);
const buildTimeApiUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';
const API_BASE_URL = isLocalHost ? LOCAL_API_URL : (buildTimeApiUrl || REMOTE_API_URL);

function formatMoney(value) {
    return `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString('en-IN');
}

function getUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null;
    }
}

function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function fetchWithFallback(path) {
    const candidateBases = [API_BASE_URL];
    if (isLocalHost && API_BASE_URL !== LOCAL_API_URL) {
        candidateBases.push(LOCAL_API_URL);
    }

    let lastResponse = null;
    let lastData = null;

    for (const baseUrl of candidateBases) {
        try {
            const response = await fetch(`${baseUrl}${path}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json().catch(() => ({}));

            lastResponse = response;
            lastData = data;

            if (response.ok) {
                return { response, data, baseUrl };
            }

            if (response.status !== 503 || baseUrl === LOCAL_API_URL) {
                return { response, data, baseUrl };
            }
        } catch (error) {
            if (baseUrl === LOCAL_API_URL) {
                throw error;
            }
        }
    }

    return { response: lastResponse, data: lastData, baseUrl: candidateBases[candidateBases.length - 1] };
}

function buildHoldings(orders) {
    const bySymbol = new Map();

    for (const order of orders) {
        const symbol = String(order.symbol || '').toUpperCase();
        if (!symbol) {
            continue;
        }

        if (!bySymbol.has(symbol)) {
            bySymbol.set(symbol, {
                symbol,
                quantity: 0,
                buyValue: 0,
                sellValue: 0,
                lastAction: '',
                lastActionAt: 0
            });
        }

        const entry = bySymbol.get(symbol);
        const quantity = Number(order.quantity) || 0;
        const grossAmount = Number(order.grossAmount) || quantity * (Number(order.price) || 0);
        const createdAt = new Date(order.createdAt || 0).getTime() || 0;
        const side = String(order.side || '').toLowerCase();

        entry.quantity += side === 'sell' ? -quantity : quantity;
        if (side === 'sell') {
            entry.sellValue += grossAmount;
        } else {
            entry.buyValue += grossAmount;
        }

        if (createdAt >= entry.lastActionAt) {
            entry.lastActionAt = createdAt;
            entry.lastAction = side || 'action';
        }
    }

    return Array.from(bySymbol.values()).sort((left, right) => right.lastActionAt - left.lastActionAt);
}

function renderHoldings(orders) {
    const holdings = buildHoldings(orders);
    const body = document.getElementById('holdingsBody');
    const holdingCount = document.getElementById('holdingCount');

    if (holdingCount) {
        holdingCount.textContent = `${holdings.length} holding${holdings.length === 1 ? '' : 's'}`;
    }

    if (!holdings.length) {
        body.innerHTML = '<tr><td colspan="6" class="empty-state">No holdings yet. Place your first buy order to build a portfolio.</td></tr>';
        return;
    }

    body.innerHTML = holdings.map((item) => {
        const netValue = item.sellValue - item.buyValue;
        return `
            <tr>
                <td><strong>${item.symbol}</strong></td>
                <td class="${item.quantity >= 0 ? 'positive' : 'negative'}">${item.quantity}</td>
                <td>${formatMoney(item.buyValue)}</td>
                <td>${formatMoney(item.sellValue)}</td>
                <td class="${netValue >= 0 ? 'positive' : 'negative'}">${formatMoney(netValue)}</td>
                <td>${item.lastAction ? item.lastAction.toUpperCase() : 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function renderActivity(orders) {
    const activityList = document.getElementById('activityList');
    const activityCount = document.getElementById('activityCount');

    if (activityCount) {
        activityCount.textContent = `${orders.length} action${orders.length === 1 ? '' : 's'}`;
    }

    if (!orders.length) {
        activityList.innerHTML = '<div class="empty-state">No trades yet. Your buy and sell history will appear here.</div>';
        return;
    }

    activityList.innerHTML = orders.map((order) => {
        const side = String(order.side || '').toLowerCase();
        const transactionType = String(order.transactionType || '').toLowerCase();
        const grossAmount = Number(order.grossAmount) || 0;
        const charges = Number(order.charges) || 0;
        const settlementAmount = Number(order.settlementAmount) || 0;

        return `
            <article class="activity-item">
                <div class="activity-head">
                    <div>
                        <div class="activity-title">${String(order.symbol || 'UNKNOWN').toUpperCase()} · ${formatMoney(order.price || 0)}</div>
                        <div class="activity-meta">${formatDate(order.createdAt)}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                        <span class="badge ${side}">${side || 'action'}</span>
                        <span class="badge delivery">${transactionType || 'trade'}</span>
                    </div>
                </div>
                <div class="activity-details">
                    Qty ${Number(order.quantity) || 0} · Gross ${formatMoney(grossAmount)} · Charges ${formatMoney(charges)} · Settlement ${formatMoney(settlementAmount)}
                </div>
            </article>
        `;
    }).join('');
}

function updateSummary(orders, user) {
    const totalActions = document.getElementById('totalActions');
    const totalBuyValue = document.getElementById('totalBuyValue');
    const totalSellValue = document.getElementById('totalSellValue');
    const netValue = document.getElementById('netValue');
    const latestAction = document.getElementById('latestAction');
    const welcomeTitle = document.getElementById('welcomeTitle');

    const buyTotal = orders.filter((order) => String(order.side).toLowerCase() === 'buy').reduce((sum, order) => sum + (Number(order.grossAmount) || Number(order.quantity || 0) * Number(order.price || 0)), 0);
    const sellTotal = orders.filter((order) => String(order.side).toLowerCase() === 'sell').reduce((sum, order) => sum + (Number(order.grossAmount) || Number(order.quantity || 0) * Number(order.price || 0)), 0);
    const latest = orders[0];

    if (totalActions) {
        totalActions.textContent = orders.length.toString();
    }
    if (totalBuyValue) {
        totalBuyValue.textContent = formatMoney(buyTotal);
    }
    if (totalSellValue) {
        totalSellValue.textContent = formatMoney(sellTotal);
    }
    if (netValue) {
        netValue.textContent = formatMoney(buyTotal - sellTotal);
    }
    if (latestAction) {
        latestAction.textContent = latest ? `Latest: ${String(latest.side || 'action').toUpperCase()} ${String(latest.symbol || '').toUpperCase()}` : 'No activity yet';
    }
    if (welcomeTitle && user?.fullName) {
        welcomeTitle.textContent = `${user.fullName}'s Portfolio`;
    }
}

async function loadPortfolio() {
    const token = localStorage.getItem('token');
    const user = getUser();
    const body = document.body;

    if (!token || !user) {
        body.innerHTML = `
            <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#eef3fb;font-family:Poppins,sans-serif;">
                <section style="max-width:520px;background:white;border-radius:22px;padding:28px;box-shadow:0 18px 40px rgba(16,32,60,0.1);border:1px solid #d8e2f0;">
                    <h1 style="margin-top:0;color:#16243c;">Login required</h1>
                    <p style="color:#66748d;line-height:1.7;">Please log in to view your portfolio, purchases, and trade activity.</p>
                    <a href="index.html" style="display:inline-flex;text-decoration:none;background:#0e8fca;color:white;padding:12px 18px;border-radius:999px;font-weight:700;">Back to Home</a>
                </section>
            </main>
        `;
        return;
    }

function redirectToLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

    try {
        const { response, data } = await fetchWithFallback('/api/trades/orders');

        if (response && response.status === 401) {
            redirectToLogin();
            return;
        }

        if (!response || !response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load portfolio data');
        }

        const orders = Array.isArray(data.orders) ? data.orders.slice().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)) : [];
        updateSummary(orders, user);
        renderHoldings(orders);
        renderActivity(orders);
    } catch (error) {
        const holdingsBody = document.getElementById('holdingsBody');
        const activityList = document.getElementById('activityList');
        if (holdingsBody) {
            holdingsBody.innerHTML = `<tr><td colspan="6" class="empty-state">Unable to load portfolio data: ${error.message}</td></tr>`;
        }
        if (activityList) {
            activityList.innerHTML = `<div class="empty-state">Unable to load portfolio activity: ${error.message}</div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refreshButton');

    if (refreshButton) {
        refreshButton.addEventListener('click', loadPortfolio);
    }

    loadPortfolio();
});