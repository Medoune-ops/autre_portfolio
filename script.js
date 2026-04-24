document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

    // Ouvrir le menu
    mobileMenuBtn?.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Empêche le scroll quand le menu est ouvert
    });

    // Fermer le menu
    const close = () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    closeMenuBtn?.addEventListener('click', close);

    // Fermer le menu lors du clic sur un lien
    mobileLinks.forEach(link => {
        link.addEventListener('click', close);
    });

    // Défilement fluide (Smooth Scroll)
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
});
