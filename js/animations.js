// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

// Scroll-triggered animations via IntersectionObserver
function initScrollAnimations(){
  var els = document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale');
  if(!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('visible'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '80px 0px -10px 0px' });

  els.forEach(function(el){
    // Elements already in viewport: show immediately
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight + 50 && rect.bottom > 0){
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}

// Initialize Swiper carousels for home page
window.initHomeAnimations = function(){
  // Banner carousel
  if(document.querySelector('.banner-swiper')){
    new Swiper('.banner-swiper', {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.banner-pagination', clickable: true },
      effect: 'slide',
      speed: 600,
      spaceBetween: 24
    });
  }
  // News carousel (mobile only)
  if(document.querySelector('.news-swiper') && window.innerWidth < 1024){
    new Swiper('.news-swiper', {
      slidesPerView: 1.15,
      spaceBetween: 16,
      breakpoints: {
        768: { slidesPerView: 2.2, spaceBetween: 20 }
      }
    });
  }
  // Run scroll animations immediately, then again after images settle
  initScrollAnimations();
  setTimeout(initScrollAnimations, 300);
};

// Re-init on route change
window.addEventListener('hashchange', function(){
  setTimeout(initScrollAnimations, 80);
});

})();
