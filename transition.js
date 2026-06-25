// page transitions
const transitionStyle = document.createElement('style');
transitionStyle.innerHTML = `
    body {
        opacity: 0;
        transition: opacity 0.4s ease-out;
    }
    body.page-loaded {
        opacity: 1;
    }
`;
document.head.appendChild(transitionStyle);

window.addEventListener("pageshow", (e) => {
    document.body.classList.add("page-loaded");
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
            document.body.classList.remove("page-loaded");
            
            setTimeout(() => {
                window.location.href = link.href;
            }, 400);
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
