// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

// Scroll-triggered animations via IntersectionObserver
function initScrollAnimations(){
  if(!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale')
      .forEach(function(el){ el.classList.add('visible'); });
    return;
  }
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale')
    .forEach(function(el){ observer.observe(el); });
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
      spaceBetween: 0
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
  initScrollAnimations();
};

// Re-init on route change
window.addEventListener('hashchange', function(){
  setTimeout(initScrollAnimations, 100);
});

})();
