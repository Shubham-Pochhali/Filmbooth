document.addEventListener('DOMContentLoaded', () => {
    // Determine active path
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Helper to check if a link is active
    const isActive = (href) => {
        if (href === 'index.html' && (page === '' || page === 'index.html')) return true;
        if (href.includes(page) && page !== 'index.html' && page !== '') return true;
        return false;
    };

    // Header HTML
    const headerHTML = `
      <div class="w-full max-w-6xl px-6 pt-10 mx-auto">
          <header class="flex justify-between items-center mb-10 md:mb-16 relative z-50 flex-shrink-0">
              <div class="flex items-center gap-2">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <a href="index.html" class="font-bold tracking-[0.2em] text-lg hover:text-red-600 transition-colors text-gray-900">FILMBOOTH</a>
              </div>
              
              <!-- Desktop Nav -->
              <nav class="hidden md:flex gap-10 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                  <a href="index.html" class="${isActive('index.html') ? 'text-black border-b-[1.5px] border-black pb-1' : 'hover:text-red-500 transition-colors'}">Home</a>
                  <a href="how-it-works.html" class="${isActive('how-it-works.html') ? 'text-black border-b-[1.5px] border-black pb-1' : 'hover:text-red-500 transition-colors'}">How it works</a>
                  <a href="our-story.html" class="${isActive('our-story.html') ? 'text-black border-b-[1.5px] border-black pb-1' : 'hover:text-red-500 transition-colors'}">Our Story</a>
                  <a href="index.html#scrapbook" class="hover:text-red-500 transition-colors">Scrapbook</a>
              </nav>

              <!-- Mobile Hamburger -->
              <button id="mobileMenuBtn" class="md:hidden text-gray-900 focus:outline-none z-50 relative cursor-pointer">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
          </header>
      </div>
    `;

    // Drawer HTML
    const drawerHTML = `
      <div id="mobileDrawer" class="fixed inset-0 z-[60] hidden md:hidden">
          <div id="drawerBackdrop" class="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity opacity-0"></div>
          <div id="drawerPane" class="absolute top-0 right-0 h-full w-[280px] bg-[#fafafa] shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col px-12 pt-32 overflow-hidden">
              
              <!-- Vintage Oversized Film Reel Texture -->
              <img class="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-multiply pointer-events-none" src="assets/vertical_film_strip.png" alt="film texture">

              <button id="closeMenuBtn" class="absolute top-10 right-6 text-gray-900 focus:outline-none p-2 z-10 cursor-pointer">
                  <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <nav class="flex flex-col gap-12 text-left text-4xl font-serif italic text-gray-800 tracking-wide z-10">
                  <a href="index.html" class="${isActive('index.html') ? 'text-red-600' : 'hover:text-red-600 transition-colors'}">Home</a>  
                  <a href="how-it-works.html" class="${isActive('how-it-works.html') ? 'text-red-600' : 'hover:text-red-600 transition-colors'}">How it works</a>
                  <a href="our-story.html" class="${isActive('our-story.html') ? 'text-red-600' : 'hover:text-red-600 transition-colors'}">Our Story</a>
                  <a href="index.html#scrapbook" class="hover:text-red-600 transition-colors">Scrapbook</a>
              </nav>
          </div>
      </div>
    `;

    // Inject into DOM
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    // Event Listeners for Mobile Drawer
    const openBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('closeMenuBtn');
    const drawer = document.getElementById('mobileDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const pane = document.getElementById('drawerPane');
    
    if(openBtn && closeBtn && drawer) {
        openBtn.addEventListener('click', () => {
            drawer.classList.remove('hidden');
            setTimeout(() => {
                backdrop.classList.remove('opacity-0');
                pane.classList.remove('translate-x-full');
            }, 10);
            document.body.style.overflow = 'hidden';
        });
        closeBtn.addEventListener('click', () => {
            backdrop.classList.add('opacity-0');
            pane.classList.add('translate-x-full');
            setTimeout(() => {
                drawer.classList.add('hidden');
            }, 300);
            document.body.style.overflow = '';
        });
    }
});
