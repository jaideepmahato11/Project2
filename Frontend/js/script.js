function learnMore() {
    window.location.href = "../html/about.html";
}

const LOCAL_API_URL = 'http://localhost:4002';
const REMOTE_API_URL = 'https://project2-vhg7.vercel.app';
const isLocalHost = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    !window.location.hostname ||
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
);
const API_URL = isLocalHost ? LOCAL_API_URL : REMOTE_API_URL;
const CONTACT_API_URL = `${API_URL}/api/contact`;

function getStoredUser() {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        return null;
    }
}

function setContactStatus(message, isError) {
    const status = document.getElementById('contactMessage');

    if (!status) {
        return;
    }

    status.textContent = message;
    status.className = `message ${isError ? 'error' : 'success'}`;
}

async function handleContactSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    if (!token) {
        setContactStatus('Please login first to send a message.', true);
        return;
    }

    const fullName = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!fullName || !email || !message) {
        setContactStatus('Name, email, and message are required.', true);
        return;
    }

    try {
        const response = await fetch(`${CONTACT_API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fullName,
                email,
                message
            })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data && data.success) {
            setContactStatus(data.message || 'Your message was saved.', false);
            if (messageInput) {
                messageInput.value = '';
            }
            return;
        }

        const backendMessage = data && typeof data.message === 'string' ? data.message : 'Failed to save your message.';
        setContactStatus(backendMessage, true);
    } catch (error) {
        setContactStatus('Cannot connect to server. Is the backend running?', true);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const navCtaButtons = document.querySelectorAll('.nav-cta');
    const contactForm = document.getElementById('contactForm');
    const storedUser = getStoredUser();

    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    if (storedUser) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        if (nameInput && !nameInput.value) {
            nameInput.value = storedUser.fullName || '';
        }

        if (emailInput && !emailInput.value) {
            emailInput.value = storedUser.email || '';
        }
    }
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.nextElementSibling;
            menu.classList.toggle('active');
        });
    });
    
    document.addEventListener('click', function(e) {
        dropdownToggles.forEach(toggle => {
            const dropdown = toggle.parentElement;
            if (!dropdown.contains(e.target)) {
                const menu = toggle.nextElementSibling;
                menu.classList.remove('active');
            }
        });
    });

    navCtaButtons.forEach(button => {
        button.addEventListener('click', function() {
            window.location.href = 'stock.html';
        });
    });

    // FAQ Toggle
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');
        });
    });
});