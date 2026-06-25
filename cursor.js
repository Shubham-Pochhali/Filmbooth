(function() {
    function initCursor() {
        // Disable custom cursor on smartphones/touch devices
        if (window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 768) return;

        if (document.getElementById('custom-cursor-style')) return;

        const style = document.createElement('style');
        style.id = 'custom-cursor-style';
        style.innerHTML = `
            * {
                cursor: none !important;
            }
            body {
                cursor: none !important;
            }
            #custom-cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 14px;
                height: 14px;
                background-color: white;
                border: 1.5px solid transparent;
                border-radius: 50%;
                pointer-events: none;
                z-index: 2147483647;
                mix-blend-mode: difference;
                transition: width 0.3s cubic-bezier(0.19, 1, 0.22, 1), 
                            height 0.3s cubic-bezier(0.19, 1, 0.22, 1), 
                            background-color 0.2s ease, 
                            border-color 0.2s ease;
                /* Start hidden until first mouse move */
                opacity: 0;
            }
            #custom-cursor.hover {
                width: 48px;
                height: 48px;
                background-color: transparent;
                border-color: white;
            }
        `;
        document.head.appendChild(style);

        const cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        document.body.appendChild(cursor);

        let isMoving = false;

        document.addEventListener('mousemove', (e) => {
            if (!isMoving) {
                cursor.style.opacity = '1';
                isMoving = true;
            }
            // Snappy instant tracking to avoid lag
            cursor.style.transform = "translate3d(calc(" + e.clientX + "px - 50%), calc(" + e.clientY + "px - 50%), 0)";
        });

        const interactiveElements = 'a, button, input, [role="button"], label, select, textarea';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveElements)) {
                cursor.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveElements)) {
                cursor.classList.remove('hover');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursor);
    } else {
        initCursor();
    }
})();
