// page transitions
const transitionStyle = document.createElement('style');
transitionStyle.innerHTML = `
    #global-loader {
        position: fixed;
        inset: 0;
        z-index: 9999999;
        background-color: #f4f4f2;
        background-image: url('data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100" height="100" filter="url(%23noise)" opacity="0.03"/%3E%3C/svg%3E');
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 400ms ease-in-out;
        pointer-events: none;
    }
    #global-loader.hidden {
        opacity: 0;
    }
    #global-loader .loader-text {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        color: #111;
        font-size: 1.125rem;
        letter-spacing: 0.05em;
        opacity: 0.7;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    #global-loader .loader-reel {
        color: #111;
        opacity: 0.7;
        animation: spin-reel 3s linear infinite;
    }
    @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.3; }
    }
    @keyframes spin-reel {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(transitionStyle);

const loaderDiv = document.createElement('div');
loaderDiv.id = 'global-loader';
loaderDiv.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 1.25rem;">
        <svg class="loader-reel" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="2" x2="12" y2="9"></line>
            <line x1="22" y1="12" x2="15" y2="12"></line>
            <line x1="12" y1="22" x2="12" y2="15"></line>
            <line x1="2" y1="12" x2="9" y2="12"></line>
        </svg>
        <span class="loader-text">Winding...</span>
    </div>
`;

// Append to html before body exists, or to body if it does
if (document.body) {
    document.body.appendChild(loaderDiv);
} else {
    document.documentElement.appendChild(loaderDiv);
}

// Move to body once it's created to avoid validation issues
document.addEventListener('DOMContentLoaded', () => {
    if (loaderDiv.parentNode !== document.body) {
        document.body.appendChild(loaderDiv);
    }
});

window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
        loaderDiv.classList.remove("hidden");
        // Force reflow
        void loaderDiv.offsetWidth;
    }
    setTimeout(() => {
        loaderDiv.classList.add("hidden");
    }, 50); // slight delay to ensure first paint happens
});

function playSoftShutter() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const playTick = (time, freq, duration) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + duration);
        };
        playTick(ctx.currentTime, 400, 0.04);
        playTick(ctx.currentTime + 0.08, 300, 0.04);
    } catch(e) {}
}

document.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link || !link.href) return;
    
    try {
        const url = new URL(link.href, window.location.href);
        const isLocal = url.protocol === 'file:' || url.origin === window.location.origin;
        const isSamePage = url.pathname === window.location.pathname;
        const hasHash = url.hash.length > 0;
        const targetAttr = link.getAttribute('target');
        
        if (isLocal && !isSamePage && targetAttr !== '_blank') {
            e.preventDefault();
            playSoftShutter();
            loaderDiv.classList.remove("hidden");
            
            setTimeout(() => {
                window.location.href = link.href;
            }, 200);
        } else if (isLocal && isSamePage && hasHash) {
            e.preventDefault();
            const targetId = url.hash.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (err) {}
});
