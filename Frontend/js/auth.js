const API_URL = 'http://localhost:4002/api/auth';

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
        const response = await fetch(`${API_URL}/signup`, {
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
        
        if (!response.ok) {
            messageDiv.className = 'message error';
            messageDiv.textContent = `Server error: ${response.status}`;
            console.error('Response status:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data && data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Account created successfully';
            document.getElementById('signupForm').reset();
            
            setTimeout(() => {
                closeSignupModal();
                alert('Account created successfully! Please login.');
                openLoginModal();
            }, 2000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data && data.message ? data.message : 'Signup failed. Please try again.';
            console.error('Signup response:', data);
        }
    } catch (error) {
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
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (!response.ok) {
            messageDiv.className = 'message error';
            messageDiv.textContent = `Server error: ${response.status}`;
            console.error('Response status:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data && data.success) {
            messageDiv.className = 'message success';
            messageDiv.textContent = data.message || 'Login successful';
            document.getElementById('loginForm').reset();
            
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            setTimeout(() => {
                closeLoginModal();
                alert('Welcome ' + data.user.fullName + '!');
                window.location.href = '/stock.html';
            }, 2000);
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data && data.message ? data.message : 'Login failed. Please try again.';
            console.error('Login response:', data);
        }
    } catch (error) {
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
