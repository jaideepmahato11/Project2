function getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('token');
        if (!user || !token) {
            return null;
        }

        return user;
    } catch (error) {
        return null;
    }
}

function getInitials(fullName) {
    const name = typeof fullName === 'string' ? fullName.trim() : '';
    if (!name) {
        return 'U';
    }

    const parts = name.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    return initials || 'U';
}

function ensureBadge() {
    const user = getCurrentUser();
    const existing = document.getElementById('user-status-badge');

    if (!user) {
        if (existing) {
            existing.remove();
        }
        return;
    }

    const label = user.fullName || user.email || 'User';

    if (existing) {
        const nameNode = existing.querySelector('.user-badge-name');
        if (nameNode) {
            nameNode.textContent = label;
        }
        const avatarNode = existing.querySelector('.user-badge-avatar');
        if (avatarNode) {
            avatarNode.textContent = getInitials(label);
        }
        existing.title = `Signed in as ${label}`;
        return;
    }

    const badge = document.createElement('a');
    badge.id = 'user-status-badge';
    badge.href = 'portfolio.html';
    badge.title = `Signed in as ${label}`;
    badge.setAttribute('aria-label', `Open portfolio for ${label}`);
    badge.style.position = 'fixed';
    badge.style.top = '16px';
    badge.style.right = '16px';
    badge.style.zIndex = '9999';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '10px';
    badge.style.padding = '10px 14px';
    badge.style.borderRadius = '999px';
    badge.style.border = '1px solid rgba(255, 255, 255, 0.18)';
    badge.style.background = 'linear-gradient(135deg, rgba(10, 31, 68, 0.96) 0%, rgba(0, 201, 115, 0.92) 100%)';
    badge.style.color = '#ffffff';
    badge.style.textDecoration = 'none';
    badge.style.boxShadow = '0 14px 30px rgba(10, 31, 68, 0.24)';
    badge.style.backdropFilter = 'blur(10px)';

    const avatar = document.createElement('span');
    avatar.className = 'user-badge-avatar';
    avatar.textContent = getInitials(label);
    avatar.style.width = '34px';
    avatar.style.height = '34px';
    avatar.style.borderRadius = '50%';
    avatar.style.display = 'inline-flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontWeight = '800';
    avatar.style.fontSize = '0.85rem';
    avatar.style.background = 'rgba(255, 255, 255, 0.18)';
    avatar.style.border = '1px solid rgba(255, 255, 255, 0.22)';

    const textWrap = document.createElement('span');
    textWrap.style.display = 'inline-flex';
    textWrap.style.flexDirection = 'column';
    textWrap.style.lineHeight = '1.1';

    const nameNode = document.createElement('span');
    nameNode.className = 'user-badge-name';
    nameNode.textContent = label;
    nameNode.style.fontSize = '0.92rem';
    nameNode.style.fontWeight = '700';

    const subNode = document.createElement('span');
    subNode.textContent = 'Portfolio';
    subNode.style.fontSize = '0.72rem';
    subNode.style.opacity = '0.9';
    subNode.style.letterSpacing = '0.04em';
    subNode.style.textTransform = 'uppercase';

    textWrap.appendChild(nameNode);
    textWrap.appendChild(subNode);
    badge.appendChild(avatar);
    badge.appendChild(textWrap);

    document.body.appendChild(badge);
}

document.addEventListener('DOMContentLoaded', ensureBadge);
window.updateUserBadge = ensureBadge;