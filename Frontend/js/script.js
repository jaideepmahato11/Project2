function learnMore() {
    window.location.href = "../html/about.html";
}

document.addEventListener('DOMContentLoaded', function() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const navCtaButtons = document.querySelectorAll('.nav-cta');
    
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