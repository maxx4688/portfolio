document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;

    /* ── Theme toggle ───────────────────────────────────────────── */
    const themeBtn = document.querySelector('.theme-toggle-btn');
    const syncThemeBtn = () => {
        if (!themeBtn) return;
        const dark = root.getAttribute('data-theme') === 'dark';
        themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        themeBtn.setAttribute('aria-pressed', String(dark));
    };
    syncThemeBtn();
    themeBtn?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncThemeBtn();
    });

    /* ── Header state on scroll ─────────────────────────────────── */
    const header = document.querySelector('.site-header');
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ── Reveal on scroll ───────────────────────────────────────── */
    const revealTargets = document.querySelectorAll(
        '.reveal, .content-panel, .poster-item, .project-hero, .project-nav-footer, .theme-preview-frame'
    );
    const reveal = (el) => {
        el.classList.add('visible');
        el.querySelectorAll('.skill-bar-fill').forEach((bar) => {
            bar.style.width = bar.dataset.width || '0%';
        });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    reveal(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        // Stagger siblings that enter together
        const groups = new Map();
        revealTargets.forEach((el) => {
            el.classList.add('reveal');
            const parent = el.parentElement;
            const i = groups.get(parent) || 0;
            groups.set(parent, i + 1);
            el.style.setProperty('--stagger', `${Math.min(i, 5) * 0.07}s`);
            io.observe(el);
        });
    } else {
        revealTargets.forEach(reveal);
    }

    /* ── Motion: button fill origin, magnetic pull, card tilt + spotlight ── */
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Buttons: fill grows from where the cursor enters / leaves
    const buttonSel = '.btn, .cta-button, .icon-btn, .theme-toggle-btn, .theme-corner-btn, .back-link, .filter-button, .nav-link, .topic span';
    const magneticSel = '.btn, .cta-button, .icon-btn, .theme-toggle-btn, .theme-corner-btn';
    const setOrigin = (el, e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--x', `${e.clientX - r.left}px`);
        el.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    document.querySelectorAll(buttonSel).forEach((el) => {
        el.addEventListener('pointerenter', (e) => setOrigin(el, e));
        el.addEventListener('pointerleave', (e) => {
            setOrigin(el, e);
            el.style.translate = '';
        });
        if (finePointer && !reducedMotion && el.matches(magneticSel)) {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
                const dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
                el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
            });
        }
    });

    // Cards: spotlight that follows the cursor, plus a gentle 3D tilt
    const spotSel = '.project-card, .service, .channel, .interest, .timeline-item, .content-panel > .card-frame, .email-card, .project-nav-footer a';
    const tiltSel = '.project-card, .service, .channel, .interest, .work-media, .project-nav-footer a, .whats-new-card > .card-frame';
    document.querySelectorAll(spotSel).forEach((el) => el.classList.add('spot'));
    if (finePointer && !reducedMotion) {
        document.querySelectorAll(tiltSel).forEach((el) => el.classList.add('tilt'));
    }
    document.querySelectorAll('.spot, .tilt').forEach((el) => {
        const isTilt = el.classList.contains('tilt');
        const max = el.matches('.work-media') ? 4 : 6;
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
            el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
            if (isTilt) {
                el.classList.add('is-tracking');
                el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
                el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
            }
        });
        el.addEventListener('pointerleave', () => {
            if (!isTilt) return;
            el.classList.remove('is-tracking');
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--ry', '0deg');
        });
    });

    /* ── Project filters ────────────────────────────────────────── */
    const filterButtons = document.querySelectorAll('.filter-button');
    const projectCards = document.querySelectorAll('.project-card');
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach((btn) => {
                const active = btn === button;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', String(active));
            });
            projectCards.forEach((card) => {
                const match = filter === 'all' || card.dataset.category === filter;
                card.hidden = !match;
                if (match) {
                    card.classList.remove('visible');
                    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('visible')));
                }
            });
        });
    });

    /* ── App light / dark preview (project pages) ───────────────── */
    const themeSection = document.querySelector('.project-theme-section');
    if (themeSection) {
        const btn = themeSection.querySelector('.theme-corner-btn');
        const icon = themeSection.querySelector('.theme-corner-icon');
        const lightImg = themeSection.querySelector('.theme-preview-img--light');
        const darkImg = themeSection.querySelector('.theme-preview-img--dark');
        let isDark = false;
        btn?.addEventListener('click', () => {
            isDark = !isDark;
            lightImg?.classList.toggle('is-active', !isDark);
            darkImg?.classList.toggle('is-active', isDark);
            if (icon) icon.textContent = isDark ? '☾' : '☀';
        });
    }

    /* ── Showreel mute toggle ───────────────────────────────────── */
    const video = document.querySelector('.home-video-el');
    const muteBtn = document.querySelector('.home-video-mute');
    if (video && muteBtn) {
        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            if (!video.muted) video.play().catch(() => {});
            muteBtn.setAttribute('aria-pressed', String(!video.muted));
            muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        });
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
    }

    /* ── Copy to clipboard ──────────────────────────────────────── */
    document.querySelectorAll('[data-copy]').forEach((btn) => {
        const label = btn.textContent;
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.copy);
                btn.textContent = 'Copied ✓';
                btn.classList.add('is-copied');
            } catch (e) {
                window.location.href = `mailto:${btn.dataset.copy}`;
                return;
            }
            setTimeout(() => {
                btn.textContent = label;
                btn.classList.remove('is-copied');
            }, 1800);
        });
    });

    /* ── Contact form (Formspree) ───────────────────────────────── */
    const form = document.querySelector('.contact-form');
    if (form) {
        const status = form.querySelector('.form-status');
        const submitBtn = form.querySelector('.form-submit');
        const submitLabel = form.querySelector('.form-submit-label');
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const setStatus = (msg, type = '') => {
            status.textContent = msg;
            status.className = `form-status${type ? ` is-${type}` : ''}`;
        };

        const fieldError = (input) => {
            const value = input.value.trim();
            if (input.required && !value) return 'This field is required.';
            if (input.type === 'email' && !emailRe.test(value)) return 'Please enter a valid email address.';
            if (input.minLength > 0 && value.length < input.minLength) return `Please write at least ${input.minLength} characters.`;
            return '';
        };

        const showError = (input) => {
            const msg = fieldError(input);
            const field = input.closest('.field');
            field.classList.toggle('has-error', !!msg);
            field.querySelector('.field-error').textContent = msg;
            input.setAttribute('aria-invalid', String(!!msg));
            return !msg;
        };

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach((input) => {
            input.addEventListener('blur', () => { if (input.value) showError(input); });
            input.addEventListener('input', () => {
                if (input.closest('.field').classList.contains('has-error')) showError(input);
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const results = [...inputs].map(showError);
            if (results.includes(false)) {
                form.querySelector('[aria-invalid="true"]')?.focus();
                setStatus('Please fix the highlighted fields.', 'error');
                return;
            }

            const data = new FormData(form);
            data.set('_subject', `Portfolio message: ${data.get('topic')} — ${data.get('name')}`);

            submitBtn.disabled = true;
            submitLabel.textContent = 'Sending…';
            setStatus('');

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: data,
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    form.reset();
                    setStatus("Thanks! Your message is on its way — I'll reply by email soon.", 'success');
                } else {
                    const body = await res.json().catch(() => ({}));
                    const msg = body.errors?.map((er) => er.message).join(' ') || 'Something went wrong. Please try again.';
                    setStatus(msg, 'error');
                }
            } catch (err) {
                setStatus('Network error — please check your connection or email me directly.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitLabel.textContent = 'Send message';
            }
        });
    }

    /* ── Image lightbox ─────────────────────────────────────────── */
    const zoomables = document.querySelectorAll('.poster-item > img, .project-poster-main img, .browser-viewport img, .whats-new-shot img');
    if (zoomables.length) {
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
            </div>`;
        document.body.appendChild(dialog);

        const dImg = dialog.querySelector('.image-dialog__img');
        const dCap = dialog.querySelector('.image-dialog__caption');
        const closeBtn = dialog.querySelector('.image-dialog__close');
        let lastFocus = null;

        const open = (img) => {
            const caption =
                img.closest('.poster-item')?.querySelector('.poster-caption')?.textContent?.trim() ||
                img.closest('figure')?.querySelector('figcaption')?.textContent?.trim() ||
                img.alt || '';
            lastFocus = document.activeElement;
            dImg.src = img.currentSrc || img.src;
            dImg.alt = img.alt || caption;
            dCap.textContent = caption;
            dialog.classList.add('is-open');
            document.body.classList.add('dialog-open');
            closeBtn.focus();
        };
        const close = () => {
            dialog.classList.remove('is-open');
            document.body.classList.remove('dialog-open');
            lastFocus?.focus?.();
        };

        zoomables.forEach((img) => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => { e.preventDefault(); open(img); });
        });
        closeBtn.addEventListener('click', close);
        dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dialog.classList.contains('is-open')) close();
        });
    }
});
