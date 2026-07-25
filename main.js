document.addEventListener('DOMContentLoaded', () => {
    const tiltStrength = 10;
    const liftAmount = 8;
    const tiltSelectors = '.section-card, .content-panel, .project-card, .contact-card';

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('skill-bar-fill')) {
                    entry.target.style.width = entry.target.getAttribute('data-width');
                }
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(`${tiltSelectors}, .skill-bar-fill, .poster-item`).forEach((el, index) => {
        if (el.matches(tiltSelectors) || el.matches('.poster-item')) {
            el.style.setProperty('--stagger', `${(index % 6) * 0.08}s`);
        }
        revealObserver.observe(el);
    });

    document.querySelectorAll(tiltSelectors).forEach(card => {
        const frame = card.querySelector('.card-frame');
        if (!frame) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const px = (x / rect.width) * 100;
            const py = (y / rect.height) * 100;
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -tiltStrength;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * tiltStrength;

            card.style.setProperty('--mx', `${px}%`);
            card.style.setProperty('--my', `${py}%`);
            frame.style.transform =
                `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${liftAmount}px) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            frame.style.transform = '';
            card.style.removeProperty('--mx');
            card.style.removeProperty('--my');
        });
    });

    document.querySelectorAll('.cta-button, .nav-link, .filter-button, .socials').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--bx', `${x}%`);
            el.style.setProperty('--by', `${y}%`);
        });
    });

    const filterButtons = document.querySelectorAll('.filter-button');
    const projectCards = document.querySelectorAll('.project-card');
    const projectsGrid = document.querySelector('.projects-grid');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (projectsGrid) {
                projectsGrid.setAttribute('data-filter', filter);
            }

            projectCards.forEach(card => {
                const match = filter === 'all' || card.getAttribute('data-category') === filter;
                card.style.display = match ? '' : 'none';
                if (match) {
                    card.classList.remove('visible');
                    requestAnimationFrame(() => card.classList.add('visible'));
                }
            });
        });
    });

    /* Image preview dialog for gallery posters */
    const posterImages = document.querySelectorAll('.poster-item img, .project-poster-main img');
    if (posterImages.length) {
        const dialog = document.createElement('div');
        dialog.className = 'image-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Image preview');
        dialog.innerHTML = `
            <div class="image-dialog__panel">
                <button type="button" class="image-dialog__close" aria-label="Close preview">&times;</button>
                <img class="image-dialog__img" alt="">
                <p class="image-dialog__caption"></p>
            </div>
        `;
        document.body.appendChild(dialog);

        const dialogImg = dialog.querySelector('.image-dialog__img');
        const dialogCaption = dialog.querySelector('.image-dialog__caption');
        const closeBtn = dialog.querySelector('.image-dialog__close');

        const openDialog = (img) => {
            const caption =
                img.closest('.poster-item')?.querySelector('.poster-caption')?.textContent?.trim() ||
                img.alt ||
                '';

            dialogImg.src = img.currentSrc || img.src;
            dialogImg.alt = img.alt || caption;
            dialogCaption.textContent = caption;
            dialog.classList.add('is-open');
            document.body.classList.add('dialog-open');
            closeBtn.focus();
        };

        const closeDialog = () => {
            dialog.classList.remove('is-open');
            document.body.classList.remove('dialog-open');
            dialogImg.removeAttribute('src');
        };

        posterImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openDialog(img);
            });
        });

        closeBtn.addEventListener('click', closeDialog);
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dialog.classList.contains('is-open')) {
                closeDialog();
            }
        });
    }
});
