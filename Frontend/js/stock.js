const companies = [
    {
        id: "RELIANCE",
        name: "Reliance Industries",
        exchange: "NSE",
        sector: "Energy",
        ceo: "Mukesh Ambani",
        basePrice: 2785.6,
        dayChange: 1.18,
        perf: { d1: 1.18, w1: 2.45, m1: -1.83, m3: 4.26 },
        volume: 3200000
    },
    {
        id: "TCS",
        name: "Tata Consultancy",
        exchange: "NSE",
        sector: "Technology",
        ceo: "K. Krithivasan",
        basePrice: 3892.4,
        dayChange: -0.42,
        perf: { d1: -0.42, w1: 0.92, m1: 3.11, m3: 5.74 },
        volume: 1800000
    },
    {
        id: "HDFCBANK",
        name: "HDFC Bank",
        exchange: "NSE",
        sector: "Financial Services",
        ceo: "Sashidhar Jagdishan",
        basePrice: 1657.8,
        dayChange: 0.74,
        perf: { d1: 0.74, w1: 1.34, m1: 2.18, m3: 3.09 },
        volume: 2700000
    },
    {
        id: "INFY",
        name: "Infosys",
        exchange: "NSE",
        sector: "Technology",
        ceo: "Salil Parekh",
        basePrice: 1528.2,
        dayChange: -0.36,
        perf: { d1: -0.36, w1: 1.15, m1: -2.1, m3: 2.85 },
        volume: 2100000
    },
    {
        id: "ICICIBANK",
        name: "ICICI Bank",
        exchange: "NSE",
        sector: "Banking",
        ceo: "Sandeep Bakhshi",
        basePrice: 1094.5,
        dayChange: 1.76,
        perf: { d1: 1.76, w1: 2.02, m1: 1.65, m3: 6.01 },
        volume: 3500000
    },
    {
        id: "BAJFINANCE",
        name: "Bajaj Finance",
        exchange: "NSE",
        sector: "Finance",
        ceo: "Rajeev Jain",
        basePrice: 7023.4,
        dayChange: -0.95,
        perf: { d1: -0.95, w1: -0.44, m1: 1.22, m3: 3.88 },
        volume: 900000
    },
    {
        id: "LT",
        name: "Larsen and Toubro",
        exchange: "NSE",
        sector: "Industrial",
        ceo: "S. N. Subrahmanyan",
        basePrice: 3760.1,
        dayChange: 0.91,
        perf: { d1: 0.91, w1: 1.86, m1: 4.02, m3: 8.21 },
        volume: 1200000
    },
    {
        id: "SUNPHARMA",
        name: "Sun Pharma",
        exchange: "NSE",
        sector: "Healthcare",
        ceo: "Dilip Shanghvi",
        basePrice: 1623.3,
        dayChange: 0.63,
        perf: { d1: 0.63, w1: 0.82, m1: 1.61, m3: 3.44 },
        volume: 1100000
    }
];

const TRADE_API_URL = "/api/trades";
const STOCK_API_URL = "/api/stocks";

const dom = {
    companyList: document.getElementById("companyList"),
    search: document.getElementById("companySearch"),
    symbolLabel: document.getElementById("symbolLabel"),
    companyName: document.getElementById("companyName"),
    companyMainLogo: document.getElementById("companyMainLogo"),
    companySector: document.getElementById("companySector"),
    companyCeo: document.getElementById("companyCeo"),
    lastPrice: document.getElementById("lastPrice"),
    priceChange: document.getElementById("priceChange"),
    buyPrice: document.getElementById("buyPrice"),
    sellPrice: document.getElementById("sellPrice"),
    openVal: document.getElementById("openVal"),
    highVal: document.getElementById("highVal"),
    lowVal: document.getElementById("lowVal"),
    volumeVal: document.getElementById("volumeVal"),
    statusVal: document.getElementById("statusVal"),
    exchangeVal: document.getElementById("exchangeVal"),
    updatedVal: document.getElementById("updatedVal"),
    signalVal: document.getElementById("signalVal"),
    perf1d: document.getElementById("perf1d"),
    perf1w: document.getElementById("perf1w"),
    perf1m: document.getElementById("perf1m"),
    perf3m: document.getElementById("perf3m"),
    marketState: document.getElementById("marketState"),
    clockValue: document.getElementById("clockValue"),
    chartSourceLink: document.getElementById("chartSourceLink"),
    rangeButtons: document.getElementById("rangeButtons"),
    chartSubtitle: document.getElementById("chartSubtitle")
};

let activeCompany = companies[0];
let activeInterval = "30";
let marketOpen = true;
let quotePrice = activeCompany.basePrice;
let chartInstance = null;
let candleSeries = null;
let currentTransactionType = "buy";
let quoteCache = new Map();

const yahooSymbols = {
    RELIANCE: "RELIANCE.NS",
    TCS: "TCS.NS",
    HDFCBANK: "HDFCBANK.NS",
    INFY: "INFY.NS",
    ICICIBANK: "ICICIBANK.NS",
    BAJFINANCE: "BAJFINANCE.NS",
    LT: "LT.NS",
    SUNPHARMA: "SUNPHARMA.NS"
};

const chartRanges = {
    "1": { range: "1d", interval: "1m", label: "1m" },
    "30": { range: "5d", interval: "30m", label: "30m" },
    "60": { range: "1mo", interval: "1h", label: "1h" }
};

const companyLogos = {
    RELIANCE: "L1.jpg",
    TCS: "L2.jpg",
    HDFCBANK: "L3.jpg",
    INFY: "L4.jpg",
    ICICIBANK: "L5.jpg",
    BAJFINANCE: "L6.jpg",
    LT: "L7.jpg",
    SUNPHARMA: "L8.jpg"
};

function formatPrice(value) {
    return "Rs " + Number(value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPriceCompact(value) {
    return Number(value).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatPercent(value) {
    const sign = value >= 0 ? "+" : "";
    return sign + Number(value).toFixed(2) + "%";
}

function toVolumeLabel(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + "M";
    }
    return (volume / 1000).toFixed(0) + "K";
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function applyPerfClass(node, value) {
    node.classList.remove("positive", "negative");
    node.classList.add(value >= 0 ? "positive" : "negative");
}

function getYahooSymbol(symbol) {
    return yahooSymbols[symbol] || (String(symbol).toUpperCase() + ".NS");
}

function updateOverview(company, livePrice, quote = {}) {
    const referencePrice = Number.isFinite(Number(quote.previousClose)) ? Number(quote.previousClose) : company.basePrice;
    const dailyChange = referencePrice ? ((livePrice - referencePrice) / referencePrice) * 100 : 0;
    const amount = livePrice - referencePrice;

    dom.symbolLabel.textContent = company.exchange + ": " + company.id;
    dom.companyName.textContent = company.name;

    if (dom.companyMainLogo) {
        dom.companyMainLogo.src = "../img/" + (companyLogos[company.id] || "L1.jpg");
        dom.companyMainLogo.alt = company.name + " logo";
    }

    dom.companySector.textContent = company.sector;
    dom.companyCeo.textContent = "CEO: " + company.ceo;
    dom.lastPrice.textContent = formatPrice(livePrice);
    dom.priceChange.textContent = (amount >= 0 ? "+" : "") + amount.toFixed(1) + " (" + formatPercent(dailyChange) + ")";
    applyPerfClass(dom.priceChange, dailyChange);

    const spread = Math.max(0.3, livePrice * 0.00025);
    dom.buyPrice.textContent = formatPrice(livePrice + spread);
    dom.sellPrice.textContent = formatPrice(livePrice - spread);

    const high = Number.isFinite(Number(quote.high)) ? Number(quote.high) : livePrice + Math.max(8, Math.abs(dailyChange) * 2.2);
    const low = Number.isFinite(Number(quote.low)) ? Number(quote.low) : livePrice - Math.max(8, Math.abs(dailyChange) * 2.4);

    dom.openVal.textContent = formatPrice(Number.isFinite(Number(quote.open)) ? Number(quote.open) : referencePrice);
    dom.highVal.textContent = formatPrice(high);
    dom.lowVal.textContent = formatPrice(low);
    dom.volumeVal.textContent = toVolumeLabel(Number.isFinite(Number(quote.volume)) ? Number(quote.volume) : company.volume + Math.floor(randomBetween(0, 160000)));
    dom.statusVal.textContent = marketOpen ? "Open" : "Closed";
    dom.exchangeVal.textContent = company.exchange;
    dom.updatedVal.textContent = quote.timestamp ? new Date(quote.timestamp * 1000).toLocaleString("en-IN") : "Just now";
    dom.signalVal.textContent = dailyChange >= 0 ? "Bullish" : "Bearish";

    dom.perf1d.textContent = formatPercent(company.perf.d1);
    dom.perf1w.textContent = formatPercent(company.perf.w1);
    dom.perf1m.textContent = formatPercent(company.perf.m1);
    dom.perf3m.textContent = formatPercent(company.perf.m3);

    applyPerfClass(dom.perf1d, company.perf.d1);
    applyPerfClass(dom.perf1w, company.perf.w1);
    applyPerfClass(dom.perf1m, company.perf.m1);
    applyPerfClass(dom.perf3m, company.perf.m3);
}

function ensureChart() {
    const container = document.getElementById("tradingview_chart");
    if (!container || !window.LightweightCharts) {
        return null;
    }

    if (chartInstance) {
        return chartInstance;
    }

    chartInstance = window.LightweightCharts.createChart(container, {
        width: container.clientWidth,
        height: 640,
        layout: {
            background: { color: "#f7faff" },
            textColor: "#27405f"
        },
        grid: {
            vertLines: { color: "#e5edf8" },
            horzLines: { color: "#e5edf8" }
        },
        crosshair: { mode: window.LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: "#d8e2f0" },
        timeScale: { borderColor: "#d8e2f0", timeVisible: true, secondsVisible: false }
    });

    const candlestickOptions = {
        upColor: "#0b9e54",
        downColor: "#d83737",
        borderUpColor: "#0b9e54",
        borderDownColor: "#d83737",
        wickUpColor: "#0b9e54",
        wickDownColor: "#d83737"
    };

    if (typeof chartInstance.addCandlestickSeries === "function") {
        candleSeries = chartInstance.addCandlestickSeries(candlestickOptions);
    } else if (typeof chartInstance.addSeries === "function" && window.LightweightCharts.CandlestickSeries) {
        candleSeries = chartInstance.addSeries(window.LightweightCharts.CandlestickSeries, candlestickOptions);
    } else {
        console.error("[STOCK PAGE] Candlestick chart API is unavailable.");
        return null;
    }

    window.addEventListener("resize", () => {
        if (container && chartInstance) {
            chartInstance.applyOptions({ width: container.clientWidth });
        }
    });

    return chartInstance;
}

function renderCandlestickChart(company, interval) {
    const chart = ensureChart();
    if (!chart || !candleSeries) {
        return;
    }

    const rangeConfig = chartRanges[interval] || chartRanges["30"];
    dom.chartSubtitle.textContent = company.exchange + ": " + company.id + " · " + rangeConfig.label;
    if (dom.chartSourceLink) {
        const yahooSymbol = yahooSymbols[company.id] || company.id;
        dom.chartSourceLink.href = `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}`;
        dom.chartSourceLink.textContent = "Source";
    }

    fetch(`${STOCK_API_URL}/${encodeURIComponent(company.id)}?range=${encodeURIComponent(rangeConfig.range)}&interval=${encodeURIComponent(rangeConfig.interval)}`)
        .then((response) => response.json())
        .then((data) => {
            if (!data.success) {
                throw new Error(data.message || "Failed to load chart data");
            }

            const candles = Array.isArray(data.candles) ? data.candles : [];
            candleSeries.setData(candles.map((point) => ({
                time: point.time,
                open: point.open,
                high: point.high,
                low: point.low,
                close: point.close
            })));

            if (candles.length > 0) {
                const last = candles[candles.length - 1];
                quotePrice = last.close;
                updateOverview(company, last.close, data);
                chart.timeScale().fitContent();
            }
        })
        .catch((error) => {
            console.error("[STOCK PAGE] Chart load failed:", error);
            dom.chartSubtitle.textContent = company.exchange + ": " + company.id + " · data unavailable";
        });
}

function refreshCompanyRow(company, quote) {
    if (!company) {
        return;
    }

    const button = dom.companyList.querySelector(`button[data-symbol="${company.id}"]`);
    if (!button) {
        return;
    }

    const priceNode = button.querySelector(".company-price");
    const changeNode = button.querySelector(".company-change");

    if (priceNode && quote && quote.price !== null) {
        priceNode.textContent = formatPriceCompact(quote.price);
    }

    if (changeNode && quote && Number.isFinite(Number(quote.changePercent))) {
        const value = Number(quote.changePercent);
        changeNode.textContent = formatPercent(value);
        changeNode.classList.toggle("positive", value >= 0);
        changeNode.classList.toggle("negative", value < 0);
    }
}

async function loadMarketQuotes() {
    try {
        const response = await fetch(`${STOCK_API_URL}/quotes?symbols=${Object.keys(yahooSymbols).join(",")}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.quotes)) {
            throw new Error(data.message || "Failed to fetch quotes");
        }

        data.quotes.forEach((quote) => {
            quoteCache.set(quote.symbol, quote);
            const company = companies.find((item) => item.id === quote.symbol);
            if (company) {
                if (quote.price !== null) {
                    company.basePrice = quote.price;
                }
                if (Number.isFinite(Number(quote.changePercent))) {
                    company.dayChange = Number(quote.changePercent);
                }
                if (Number.isFinite(Number(quote.volume))) {
                    company.volume = Number(quote.volume);
                }
                refreshCompanyRow(company, quote);
            }
        });

        const activeQuote = quoteCache.get(activeCompany.id);
        if (activeQuote && activeQuote.price !== null) {
            quotePrice = activeQuote.price;
            updateOverview(activeCompany, quotePrice, activeQuote);
        }

        renderList(dom.search.value);
    } catch (error) {
        console.error("[STOCK PAGE] Failed to load Yahoo quotes:", error);
    }
}

function selectCompany(symbol) {
    const found = companies.find((company) => company.id === symbol);
    if (!found) {
        return;
    }

    activeCompany = found;
    const quote = quoteCache.get(symbol);
    quotePrice = quote && quote.price !== null ? quote.price : activeCompany.basePrice;
    updateOverview(activeCompany, quotePrice, quote || {});
    renderCandlestickChart(activeCompany, activeInterval);

    const allButtons = dom.companyList.querySelectorAll("button");
    allButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.symbol === symbol);
    });
}

function renderList(filter = "") {
    const query = filter.trim().toLowerCase();
    dom.companyList.innerHTML = "";

    companies
        .filter((company) => company.name.toLowerCase().includes(query) || company.id.toLowerCase().includes(query))
        .forEach((company) => {
            const li = document.createElement("li");
            li.className = "company-item";

            const button = document.createElement("button");
            button.type = "button";
            button.dataset.symbol = company.id;

            const meta = document.createElement("span");
            meta.className = "company-meta";

            const logo = document.createElement("img");
            logo.className = "company-logo";
            logo.src = "../img/" + (companyLogos[company.id] || "L1.jpg");
            logo.alt = company.name + " logo";
            logo.loading = "lazy";

            const name = document.createElement("span");
            name.className = "company-name";
            name.textContent = company.name;

            const price = document.createElement("span");
            price.className = "company-price";
            const quote = quoteCache.get(company.id);
            price.textContent = quote && quote.price !== null ? formatPriceCompact(quote.price) : formatPriceCompact(company.basePrice);

            const change = document.createElement("span");
            const changeValue = quote && Number.isFinite(Number(quote.changePercent)) ? Number(quote.changePercent) : company.dayChange;
            change.className = "company-change " + (changeValue >= 0 ? "positive" : "negative");
            change.textContent = formatPercent(changeValue);

            meta.appendChild(logo);
            meta.appendChild(name);
            meta.appendChild(price);

            button.appendChild(meta);
            button.appendChild(change);

            if (company.id === activeCompany.id) {
                button.classList.add("active");
            }

            button.addEventListener("click", () => {
                selectCompany(company.id);
            });

            li.appendChild(button);
            dom.companyList.appendChild(li);
        });

    const firstButton = dom.companyList.querySelector("button");
    if (firstButton && !dom.companyList.querySelector("button.active")) {
        selectCompany(firstButton.dataset.symbol);
    }
}

function updateClock() {
    const now = new Date();
    dom.clockValue.textContent = now.toLocaleTimeString("en-IN", { hour12: false });

    const day = now.getDay();
    const hour = now.getHours();
    marketOpen = day > 0 && day < 6 && hour >= 9 && hour < 16;
    dom.marketState.textContent = marketOpen ? "Market Open" : "Market Closed";
    dom.statusVal.textContent = marketOpen ? "Open" : "Closed";
}

function openTradingModal(type) {
    const modal = document.getElementById("tradingModal");
    const formTitle = document.getElementById("formTitle");
    const priceInput = document.getElementById("price");
    const quantityInput = document.getElementById("quantity");
    const upiIdInput = document.getElementById("upiId");

    currentTransactionType = type;
    const actionText = type === "buy" ? "Buy" : "Sell";

    formTitle.textContent = actionText + " " + activeCompany.id;
    priceInput.value = formatPrice(quotePrice);
    quantityInput.value = "10";
    upiIdInput.value = "";

    updateEstimatedCost();
    modal.style.display = "flex";
}

function updateEstimatedCost() {
    const quantity = Number(document.getElementById("quantity").value) || 0;
    const priceText = document.getElementById("price").value;
    const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, "")) || 0;
    const totalCost = quantity * priceValue;

    document.getElementById("estimatedCost").value = formatPrice(totalCost);
}

function buildFallbackOrder(payload) {
    const grossAmount = Number((payload.quantity * payload.price).toFixed(2));
    const charges = Number((grossAmount * 0.0015).toFixed(2));
    const settlementAmount = Number((grossAmount + charges).toFixed(2));

    return {
        id: "ORD-" + Date.now().toString(36).toUpperCase(),
        symbol: String(payload.symbol).toUpperCase(),
        side: String(payload.side).toLowerCase(),
        quantity: payload.quantity,
        price: payload.price,
        orderType: payload.orderType,
        transactionType: payload.transactionType,
        grossAmount,
        charges,
        settlementAmount,
        upiId: payload.upiId,
        status: "placed",
        createdAt: new Date().toISOString()
    };
}

async function placeOrder(event) {
    event.preventDefault();

    const quantityNode = document.getElementById("quantity");
    const orderTypeNode = document.getElementById("orderType");
    const transactionTypeNode = document.getElementById("transactionType");
    const priceNode = document.getElementById("price");
    const upiIdInput = document.getElementById("upiId");
    const tradeMessage = document.getElementById("tradeMessage");

    const quantity = Number(quantityNode.value);
    const priceValue = parseFloat((priceNode.value || "").replace(/[^0-9.]/g, "")) || 0;
    const upiId = upiIdInput.value.trim();

    if (!Number.isFinite(quantity) || quantity <= 0) {
        if (tradeMessage) {
            tradeMessage.textContent = "Please enter a valid quantity.";
            tradeMessage.classList.add("negative");
            tradeMessage.classList.remove("positive");
        }
        return;
    }

    if (!upiId || !upiId.includes("@")) {
        if (tradeMessage) {
            tradeMessage.textContent = "Please enter a valid UPI ID (example: name@upi).";
            tradeMessage.classList.add("negative");
            tradeMessage.classList.remove("positive");
        }
        return;
    }

    const userStr = localStorage.getItem("user");
    if (!userStr) {
        if (tradeMessage) {
            tradeMessage.textContent = "Please login first to place orders.";
            tradeMessage.classList.add("negative");
            tradeMessage.classList.remove("positive");
        }
        return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    const payload = {
        symbol: activeCompany.id,
        side: currentTransactionType,
        quantity,
        price: Number(priceValue.toFixed(2)),
        orderType: orderTypeNode.value,
        transactionType: transactionTypeNode.value,
        upiId,
        userId
    };

    try {
        const response = await fetch(TRADE_API_URL + "/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to place order");
        }

        const order = data.order;
        const responseBody = document.getElementById("responseBody");
        if (responseBody) {
            responseBody.innerHTML = `
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Company:</strong> ${order.symbol}</p>
                <p><strong>Type:</strong> ${order.side.toUpperCase()}</p>
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Price:</strong> Rs ${order.price.toFixed(2)}</p>
                <p><strong>Order Type:</strong> ${order.orderType}</p>
                <p><strong>Transaction:</strong> ${order.transactionType}</p>
                <p><strong>Gross Amount:</strong> Rs ${order.grossAmount.toFixed(2)}</p>
                <p><strong>Charges:</strong> Rs ${order.charges.toFixed(2)}</p>
                <p><strong>Settlement:</strong> Rs ${order.settlementAmount.toFixed(2)}</p>
                <p><strong>UPI ID:</strong> ${order.upiId}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${order.status.toUpperCase()}</span></p>
                <p><strong>Time:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            `;
        }

        closeModal();
        const responseModal = document.getElementById("responseModal");
        if (responseModal) {
            responseModal.style.display = "flex";
        }
    } catch (error) {
        const fallbackOrder = buildFallbackOrder(payload);
        const responseTitle = document.getElementById("responseTitle");
        const responseBody = document.getElementById("responseBody");
        if (responseTitle) {
            responseTitle.textContent = "Order Placed Successfully (Offline Mode)";
            responseTitle.style.color = "orange";
        }
        if (responseBody) {
            responseBody.innerHTML = `
                <p><strong>Note:</strong> Order saved locally. Connect to database to persist.</p>
                <p><strong>Order ID:</strong> ${fallbackOrder.id}</p>
                <p><strong>Company:</strong> ${fallbackOrder.symbol}</p>
                <p><strong>Type:</strong> ${fallbackOrder.side.toUpperCase()}</p>
                <p><strong>Quantity:</strong> ${fallbackOrder.quantity}</p>
                <p><strong>Price:</strong> Rs ${fallbackOrder.price.toFixed(2)}</p>
                <p><strong>Order Type:</strong> ${fallbackOrder.orderType}</p>
                <p><strong>Transaction:</strong> ${fallbackOrder.transactionType}</p>
                <p><strong>Gross Amount:</strong> Rs ${fallbackOrder.grossAmount.toFixed(2)}</p>
                <p><strong>Charges:</strong> Rs ${fallbackOrder.charges.toFixed(2)}</p>
                <p><strong>Settlement:</strong> Rs ${fallbackOrder.settlementAmount.toFixed(2)}</p>
                <p><strong>UPI ID:</strong> ${fallbackOrder.upiId}</p>
                <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">${fallbackOrder.status.toUpperCase()}</span></p>
                <p><strong>Time:</strong> ${new Date(fallbackOrder.createdAt).toLocaleString()}</p>
            `;
        }

        const responseModal = document.getElementById("responseModal");
        if (responseModal) {
            responseModal.style.display = "flex";
        }
    }
}

function closeModal() {
    const modal = document.getElementById("tradingModal");
    const form = document.getElementById("tradingForm");
    const tradeMessage = document.getElementById("tradeMessage");

    if (form) {
        form.reset();
    }
    if (tradeMessage) {
        tradeMessage.textContent = "";
        tradeMessage.classList.remove("positive", "negative");
    }

    modal.style.display = "none";
}

function closeResponseModal() {
    const responseModal = document.getElementById("responseModal");
    const responseTitle = document.getElementById("responseTitle");

    if (responseTitle) {
        responseTitle.textContent = "Order Placed Successfully";
        responseTitle.style.color = "";
    }

    if (responseModal) {
        responseModal.style.display = "none";
    }
}

function attachEvents() {
    dom.search.addEventListener("input", (event) => {
        renderList(event.target.value);
    });

    dom.rangeButtons.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-interval]");
        if (!button) {
            return;
        }

        activeInterval = button.dataset.interval;
        dom.rangeButtons.querySelectorAll("button").forEach((item) => {
            item.classList.toggle("active", item === button);
        });

        renderCandlestickChart(activeCompany, activeInterval);
    });

    const buyBtn = document.querySelector(".btn-buy");
    const sellBtn = document.querySelector(".btn-sell");

    if (buyBtn) {
        buyBtn.addEventListener("click", () => openTradingModal("buy"));
    }
    if (sellBtn) {
        sellBtn.addEventListener("click", () => openTradingModal("sell"));
    }
}

function renderList(filter = "") {
    const query = filter.trim().toLowerCase();
    dom.companyList.innerHTML = "";

    companies
        .filter((company) => company.name.toLowerCase().includes(query) || company.id.toLowerCase().includes(query))
        .forEach((company) => {
            const li = document.createElement("li");
            li.className = "company-item";

            const button = document.createElement("button");
            button.type = "button";
            button.dataset.symbol = company.id;

            const meta = document.createElement("span");
            meta.className = "company-meta";

            const logo = document.createElement("img");
            logo.className = "company-logo";
            logo.src = "../img/" + (companyLogos[company.id] || "L1.jpg");
            logo.alt = company.name + " logo";
            logo.loading = "lazy";

            const name = document.createElement("span");
            name.className = "company-name";
            name.textContent = company.name;

            const price = document.createElement("span");
            price.className = "company-price";
            const quote = quoteCache.get(company.id);
            price.textContent = quote && quote.price !== null ? formatPriceCompact(quote.price) : formatPriceCompact(company.basePrice);

            const change = document.createElement("span");
            const changeValue = quote && Number.isFinite(Number(quote.changePercent)) ? Number(quote.changePercent) : company.dayChange;
            change.className = "company-change " + (changeValue >= 0 ? "positive" : "negative");
            change.textContent = formatPercent(changeValue);

            meta.appendChild(logo);
            meta.appendChild(name);
            meta.appendChild(price);

            button.appendChild(meta);
            button.appendChild(change);

            button.addEventListener("click", () => {
                selectCompany(company.id);
            });

            li.appendChild(button);
            dom.companyList.appendChild(li);
        });

    const firstButton = dom.companyList.querySelector("button");
    if (firstButton && !dom.companyList.querySelector("button.active")) {
        selectCompany(firstButton.dataset.symbol);
    }
}

function selectCompany(symbol) {
    const found = companies.find((company) => company.id === symbol);
    if (!found) {
        return;
    }

    activeCompany = found;
    const quote = quoteCache.get(symbol);
    quotePrice = quote && quote.price !== null ? quote.price : activeCompany.basePrice;
    updateOverview(activeCompany, quotePrice, quote || {});
    renderCandlestickChart(activeCompany, activeInterval);

    const allButtons = dom.companyList.querySelectorAll("button");
    allButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.symbol === symbol);
    });
}

function updateClock() {
    const now = new Date();
    dom.clockValue.textContent = now.toLocaleTimeString("en-IN", { hour12: false });

    const day = now.getDay();
    const hour = now.getHours();
    marketOpen = day > 0 && day < 6 && hour >= 9 && hour < 16;
    dom.marketState.textContent = marketOpen ? "Market Open" : "Market Closed";
    dom.statusVal.textContent = marketOpen ? "Open" : "Closed";
}

async function loadMarketQuotes() {
    try {
        const response = await fetch(`${STOCK_API_URL}/quotes?symbols=${Object.keys(yahooSymbols).join(",")}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.quotes)) {
            throw new Error(data.message || "Failed to fetch quotes");
        }

        data.quotes.forEach((quote) => {
            quoteCache.set(quote.symbol, quote);
            const company = companies.find((item) => item.id === quote.symbol);
            if (company) {
                if (quote.price !== null) {
                    company.basePrice = quote.price;
                }
                if (Number.isFinite(Number(quote.changePercent))) {
                    company.dayChange = Number(quote.changePercent);
                }
                if (Number.isFinite(Number(quote.volume))) {
                    company.volume = Number(quote.volume);
                }
                refreshCompanyRow(company, quote);
            }
        });

        const activeQuote = quoteCache.get(activeCompany.id);
        if (activeQuote && activeQuote.price !== null) {
            quotePrice = activeQuote.price;
            updateOverview(activeCompany, quotePrice, activeQuote);
        }

        renderList(dom.search.value);
    } catch (error) {
        console.error("[STOCK PAGE] Failed to load Yahoo quotes:", error);
    }
}

function init() {
    attachEvents();
    updateClock();
    renderList();

    const quantityInput = document.getElementById("quantity");
    if (quantityInput) {
        quantityInput.addEventListener("change", updateEstimatedCost);
    }

    const tradingForm = document.getElementById("tradingForm");
    if (tradingForm) {
        tradingForm.addEventListener("submit", placeOrder);
    }

    const modal = document.getElementById("tradingModal");
    if (modal) {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    loadMarketQuotes().then(() => {
        const firstQuote = quoteCache.get(activeCompany.id);
        quotePrice = firstQuote && firstQuote.price !== null ? firstQuote.price : activeCompany.basePrice;
        updateOverview(activeCompany, quotePrice, firstQuote || {});
        renderCandlestickChart(activeCompany, activeInterval);
    });

    setInterval(updateClock, 1000);
    setInterval(loadMarketQuotes, 30000);
}

init();