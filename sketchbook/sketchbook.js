// Margarita Gladky Interactive Sketchbook Engine
let pageFlip = null;
let soundEnabled = true;
let loupeEnabled = false;
let audioCtx = null;

// HD Image map for loupe & lightbox
const HD_PAGES = {
    1: 'assets/hd/page_01_henry_context_hd.jpg',
    2: 'assets/hd/page_02_henry_drawing_hd.jpg',
    3: 'assets/hd/page_03_monoprint_title_hd.jpg',
    4: 'assets/hd/page_04_monoprint_technique_hd.jpg'
};

// Web Audio API Synthesized Realistic Paper Turn Sound
function playPaperRustle() {
    if (!soundEnabled) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const bufferSize = audioCtx.sampleRate * 0.35; // 350ms sound
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate filtered white noise with grain
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to simulate paper frequency
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.32);
        filter.Q.setValueAtTime(2.2, audioCtx.currentTime);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.45, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start();
    } catch (e) {
        console.warn('Audio not allowed or supported yet', e);
    }
}

// Initialize Flipbook
window.addEventListener('DOMContentLoaded', () => {
    const bookEl = document.getElementById('flipbook');
    const container = document.querySelector('.book-wrapper');

    // Calculate dynamic base dimensions based on viewport
    const containerWidth = Math.min(container.clientWidth, 1200);
    const containerHeight = Math.min(container.clientHeight, 850);
    const pageBaseWidth = Math.floor(containerWidth / 2);
    const pageBaseHeight = containerHeight;

    pageFlip = new St.PageFlip(bookEl, {
        width: 580,
        height: 800,
        size: "stretch",
        minWidth: 320,
        maxWidth: 1000,
        minHeight: 450,
        maxHeight: 1350,
        maxShadowOpacity: 0.6,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: true,
        swipeDistance: 30,
        flippingTime: 750
    });

    const pages = document.querySelectorAll('.page');
    pageFlip.loadFromHTML(pages);

    // Update Counter & UI
    function updateUI() {
        const current = pageFlip.getCurrentPageIndex();
        const total = pageFlip.getPageCount();
        const counterEl = document.getElementById('pageCounter');

        if (current === 0) {
            counterEl.innerText = 'Cover';
        } else if (current === total - 1) {
            counterEl.innerText = 'Back Cover';
        } else {
            // Two page spread
            const left = current;
            const right = current + 1 < total - 1 ? current + 1 : current;
            if (left === right) {
                counterEl.innerText = `Page ${left}`;
            } else {
                counterEl.innerText = `Pages ${left}-${right}`;
            }
        }
    }

    pageFlip.on('flip', (e) => {
        playPaperRustle();
        updateUI();
    });

    pageFlip.on('init', () => {
        bookEl.style.display = 'block';
        updateUI();
    });

    // Navigation Buttons
    document.getElementById('btnPrev').addEventListener('click', () => {
        pageFlip.flipPrev();
    });
    document.getElementById('btnNext').addEventListener('click', () => {
        pageFlip.flipNext();
    });
    document.getElementById('arrowPrev').addEventListener('click', () => {
        pageFlip.flipPrev();
    });
    document.getElementById('arrowNext').addEventListener('click', () => {
        pageFlip.flipNext();
    });

    // Sound Toggle
    const btnSound = document.getElementById('btnSound');
    btnSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        btnSound.innerText = soundEnabled ? '🔊' : '🔇';
        btnSound.title = soundEnabled ? 'Mute Sound' : 'Enable Sound';
        if (soundEnabled && !audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    });

    // Magnifier / Loupe Tool
    const btnLoupe = document.getElementById('btnLoupe');
    const loupe = document.getElementById('magnifierLoupe');

    btnLoupe.addEventListener('click', () => {
        loupeEnabled = !loupeEnabled;
        btnLoupe.classList.toggle('active', loupeEnabled);
        if (!loupeEnabled) {
            loupe.style.display = 'none';
        }
    });

    // Handle mousemove over artwork for Loupe
    document.addEventListener('mousemove', (e) => {
        if (!loupeEnabled) return;

        // Check if hover is over an image inside an art-page
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const artImg = target && target.tagName === 'IMG' && target.closest('.art-page') ? target : null;

        if (!artImg) {
            loupe.style.display = 'none';
            return;
        }

        const rect = artImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ensure inside bounds
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            loupe.style.display = 'none';
            return;
        }

        const pageEl = artImg.closest('.page');
        const pageIndex = parseInt(pageEl.getAttribute('data-page-id'), 10);
        const hdSrc = HD_PAGES[pageIndex] || artImg.src;

        loupe.style.display = 'block';
        loupe.style.left = `${e.clientX - 110}px`;
        loupe.style.top = `${e.clientY - 110}px`;
        loupe.style.backgroundImage = `url('${hdSrc}')`;

        const zoomLevel = 2.4;
        const bgWidth = rect.width * zoomLevel;
        const bgHeight = rect.height * zoomLevel;
        const bgX = -(x * zoomLevel - 110);
        const bgY = -(y * zoomLevel - 110);

        loupe.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
        loupe.style.backgroundPosition = `${bgX}px ${bgY}px`;
    });

    // Lightbox / HD Zoom Modal
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    function openLightbox(src) {
        lightboxImg.src = src;
        lightboxModal.classList.add('open');
    }

    function closeLightbox() {
        lightboxModal.classList.remove('open');
        lightboxImg.src = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) closeLightbox();
    });

    // Double click on page image opens lightbox
    document.querySelectorAll('.art-page img').forEach(img => {
        img.addEventListener('dblclick', () => {
            const pageEl = img.closest('.page');
            const pageIndex = parseInt(pageEl.getAttribute('data-page-id'), 10);
            openLightbox(HD_PAGES[pageIndex] || img.src);
        });
    });

    // Fullscreen Toggle
    document.getElementById('btnFullscreen').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen().catch(err => console.log(err));
        }
    });

    // Artist Notes Drawer
    const btnNotes = document.getElementById('btnNotes');
    const notesDrawer = document.getElementById('notesDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const drawerClose = document.getElementById('drawerClose');

    function toggleNotes() {
        const isOpen = notesDrawer.classList.contains('open');
        notesDrawer.classList.toggle('open', !isOpen);
        drawerBackdrop.classList.toggle('open', !isOpen);
        btnNotes.classList.toggle('active', !isOpen);
    }

    btnNotes.addEventListener('click', toggleNotes);
    drawerClose.addEventListener('click', toggleNotes);
    drawerBackdrop.addEventListener('click', toggleNotes);

    // Full Spread Modal (View continuous double-spread without spiral center)
    const btnSpread = document.getElementById('btnSpread');
    btnSpread.addEventListener('click', () => {
        const current = pageFlip.getCurrentPageIndex();
        if (current <= 2) {
            openLightbox('assets/hd/sculptures_spread_hd.jpg');
        } else {
            openLightbox('assets/hd/monoprint_spread_hd.jpg');
        }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
            pageFlip.flipNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            pageFlip.flipPrev();
        } else if (e.key === 'Escape') {
            closeLightbox();
            if (notesDrawer.classList.contains('open')) toggleNotes();
            if (loupeEnabled) btnLoupe.click();
        } else if (e.key === 'z' || e.key === 'Z') {
            btnLoupe.click();
        } else if (e.key === 'm' || e.key === 'M') {
            btnSound.click();
        }
    });

    // Responsive resize handler
    window.addEventListener('resize', () => {
        // PageFlip handles its own resize when stretch is enabled
    });
});
