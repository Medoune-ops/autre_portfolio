// Navigation background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('bg-black/80');
        header.classList.remove('glass');
    } else {
        header.classList.remove('bg-black/80');
        header.classList.add('glass');
    }
});

// Mobile menu toggle (simple version for now)
const mobileMenuBtn = document.querySelector('button');
mobileMenuBtn?.addEventListener('click', () => {
    alert('Menu mobile en cours de développement !');
});

// Smooth scroll for links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
