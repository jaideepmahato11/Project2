const LOCAL_API_URL = 'http://localhost:4002';
const REMOTE_API_URL = 'https://project2-ckif.vercel.app';
const isLocalHost = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    !window.location.hostname ||
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
);
const buildTimeApiUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';
const API_URL = isLocalHost ? LOCAL_API_URL : (buildTimeApiUrl || REMOTE_API_URL);
console.log('[AUTH] Using API URL:', API_URL, 'isLocalHost:', isLocalHost);
const LOCAL_USERS_KEY = 'stocksphereUsers';

function getStoredUsers() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
    } catch (error) {
        console.warn('[AUTH] Failed to parse local users cache:', error);
        return [];
    }
}

function saveStoredUsers(users) {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function getNormalizedEmail(email) {
    return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getLocalAuthError(response, data) {
    if (!response || response.status === 503 || response.status >= 500) {
        return true;
    }

    return Boolean(data && data.message && /connect to server|backend/i.test(data.message));
}

function createLocalUser(fullName, email, password) {
    const normalizedEmail = getNormalizedEmail(email);
    const users = getStoredUsers();

    if (users.some((user) => user.email === normalizedEmail)) {
        return { success: false, message: 'Email already registered locally' };
    }

    const user = {
        id: `local-${Date.now()}`,
        fullName: fullName.trim(),
        email: normalizedEmail,
        password
    };

    users.push(user);
    saveStoredUsers(users);
    localStorage.setItem('user', JSON.stringify({ id: user.id, fullName: user.fullName, email: user.email }));

    return {
        success: true,
        message: 'Account created locally. Backend is unavailable right now.',
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email
        }
    };
}

function loginLocalUser(email, password) {
    const normalizedEmail = getNormalizedEmail(email);
    const users = getStoredUsers();
    const user = users.find((entry) => entry.email === normalizedEmail && entry.password === password);

    if (!user) {
        return { success: false, message: 'Invalid email or password' };
    }

    const sessionUser = {
        id: user.id,
        fullName: user.fullName,
        email: user.email
    };

    localStorage.setItem('user', JSON.stringify(sessionUser));

    return {
        success: true,
        message: 'Login successful (local mode)',
        user: sessionUser
    };
}
const AUTH_API_URL = `${API_URL}/api/auth`;

async function fetchAuthJson(endpoint, options) {
    const candidateBases = [API_URL]
    if (API_URL !== LOCAL_API_URL) {
        candidateBases.push(LOCAL_API_URL)
    }

    let lastResponse = null
    let lastData = null

    for (const baseUrl of candidateBases) {
        try {
            const response = await fetch(`${baseUrl}/api/auth${endpoint}`, options)
            const data = await response.json().catch(() => ({}))

            lastResponse = response
            lastData = data

            if (response.ok) {
                return { response, data, baseUrl }
            }

            if (response.status !== 503 || baseUrl === LOCAL_API_URL) {
                return { response, data, baseUrl }
            }
        } catch (error) {
            if (baseUrl === LOCAL_API_URL) {
                throw error
            }
        }
    }

    return { response: lastResponse, data: lastData, baseUrl: candidateBases[candidateBases.length - 1] }
}

// Open Signup Modal
function openSignupModal() {
    document.getElementById('signupModal').classList.add('show');
}

// Close Signup Modal
function closeSignupModal() {
    document.getElementById('signupModal').classList.remove('show');
    document.getElementById('signupForm').reset();
    document.getElementById('signupMessage').textContent = '';
}

// Open Login Modal
function openLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

// Close Login Modal
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('loginForm').reset();
    document.getElementById('loginMessage').textContent = '';
}

// Switch to Signup
function switchToSignup(event) {
    if (event) event.preventDefault();
    closeLoginModal();
    openSignupModal();
}

// Switch to Login
function switchToLogin(event) {
    if (event) event.preventDefault();
    closeSignupModal();
    openLoginModal();
}

// Handle Signup
async function handleSignup(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    const messageDiv = document.getElementById('signupMessage');
    
    try {
        const { response, data } = await fetchAuthJson('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                confirmPassword
            })
        });

        if (response && response.ok && data && data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Account created successfully';
            document.getElementById('signupForm').reset();
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                closeSignupModal();
                alert('Account created successfully! Please login.');
                openLoginModal();
            }, 2000);
            return;
        }
        
        if (getLocalAuthError(response, data)) {
            const localResult = createLocalUser(fullName, email, password);

            if (localResult.success) {
                messageDiv.className = 'message success';
                messageDiv.textContent = localResult.message;
                document.getElementById('signupForm').reset();
                setTimeout(() => {
                    closeSignupModal();
                    alert('Account created locally. You can now log in.');
                    openLoginModal();
                }, 2000);
                return;
            }

            messageDiv.className = 'message error';
            messageDiv.textContent = localResult.message;
            return;
        }
        
        messageDiv.className = 'message error';
        messageDiv.textContent = data && data.message ? data.message : `Server error: ${response ? response.status : 'unknown'}`;
        console.error('Signup response:', data);
    } catch (error) {
        const localResult = createLocalUser(fullName, email, password);

        if (localResult.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = localResult.message;
            document.getElementById('signupForm').reset();
            setTimeout(() => {
                closeSignupModal();
                alert('Account created locally. You can now log in.');
                openLoginModal();
            }, 2000);
            return;
        }

        messageDiv.className = 'message error';
        messageDiv.textContent = 'Cannot connect to server. Is the backend running?';
        console.error('Signup error:', error);
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const messageDiv = document.getElementById('loginMessage');
    
    try {
        const { response, data } = await fetchAuthJson('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (response && response.ok && data && data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Login successful';
            document.getElementById('loginForm').reset();
            localStorage.setItem('user', JSON.stringify(data.user));
            setTimeout(() => {
                closeLoginModal();
                alert('Welcome ' + data.user.fullName + '!');
                window.location.href = 'stock.html';
            }, 2000);
            return;
        }
        
        if (getLocalAuthError(response, data)) {
            const localResult = loginLocalUser(email, password);

            if (localResult.success) {
                messageDiv.className = 'message success';
                messageDiv.textContent = localResult.message;
                document.getElementById('loginForm').reset();
                setTimeout(() => {
                    closeLoginModal();
                    alert('Welcome ' + localResult.user.fullName + '!');
                    window.location.href = 'stock.html';
                }, 2000);
                return;
            }

            messageDiv.className = 'message error';
            messageDiv.textContent = localResult.message;
            return;
        }
        
        messageDiv.className = 'message error';
        messageDiv.textContent = data && data.message ? data.message : `Server error: ${response ? response.status : 'unknown'}`;
        try {
            console.error('Login response:', JSON.stringify(data));
        } catch (e) {
            console.error('Login response (object):', data);
        }
    } catch (error) {
        const localResult = loginLocalUser(email, password);

        if (localResult.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = localResult.message;
            document.getElementById('loginForm').reset();
            setTimeout(() => {
                closeLoginModal();
                alert('Welcome ' + localResult.user.fullName + '!');
                window.location.href = 'stock.html';
            }, 2000);
            return;
        }

        messageDiv.className = 'message error';
        messageDiv.textContent = 'Cannot connect to server. Is the backend running?';
        console.error('Login error:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const signupModal = document.getElementById('signupModal');
    const loginModal = document.getElementById('loginModal');
    
    if (event.target == signupModal) {
        closeSignupModal();
    }
    if (event.target == loginModal) {
        closeLoginModal();
    }
}

window.openSignupModal = openSignupModal;
window.closeSignupModal = closeSignupModal;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
