// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

// Scroll-triggered animations via IntersectionObserver
function initScrollAnimations(){
  var els = document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale');
  if(!els.length) return;

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
  }, { threshold: 0.02, rootMargin: '120px 0px 0px 0px' });

  els.forEach(function(el){
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight + 100 && rect.bottom > -50){
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
}

function forceShowAll(){
  document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale').forEach(function(el){
    if(!el.classList.contains('visible')){
      var rect = el.getBoundingClientRect();
      if(rect.top < window.innerHeight + 200 && rect.bottom > -100){
        el.classList.add('visible');
      }
    }
  });
}

// Swiper init with retry logic
var _bannerSwiper = null;
var _newsSwiper = null;

function initBannerSwiper(){
  var el = document.querySelector('.banner-swiper');
  if(!el || el.classList.contains('swiper-initialized')) return;
  if(typeof Swiper === 'undefined') return;
  try {
    _bannerSwiper = new Swiper('.banner-swiper', {
      loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false },
      pagination: { el: '.banner-pagination', clickable: true },
      effect: 'slide',
      speed: 600,
      spaceBetween: 24,
      observer: true,
      observeParents: true
    });
  } catch(e){}
}

function initNewsSwiper(){
  var el = document.querySelector('.news-swiper');
  if(!el || el.classList.contains('swiper-initialized') || window.innerWidth >= 1024) return;
  if(typeof Swiper === 'undefined') return;
  try {
    _newsSwiper = new Swiper('.news-swiper', {
      slidesPerView: 1.15,
      spaceBetween: 16,
      breakpoints: {
        768: { slidesPerView: 2.2, spaceBetween: 20 }
      },
      observer: true,
      observeParents: true
    });
  } catch(e){}
}

function destroySwipers(){
  if(_bannerSwiper && _bannerSwiper.destroy){ try{ _bannerSwiper.destroy(true, true); }catch(e){} _bannerSwiper=null; }
  if(_newsSwiper && _newsSwiper.destroy){ try{ _newsSwiper.destroy(true, true); }catch(e){} _newsSwiper=null; }
}

// Initialize home page animations and swipers
window.initHomeAnimations = function(){
  destroySwipers();

  // Use requestAnimationFrame to ensure DOM is painted
  requestAnimationFrame(function(){
    initBannerSwiper();
    initNewsSwiper();

    // Retry if banner swiper didn't initialize (images not loaded yet)
    setTimeout(function(){
      if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
        initBannerSwiper();
      }
    }, 300);
  });

  // Scroll animations
  initScrollAnimations();
  setTimeout(forceShowAll, 200);
  setTimeout(forceShowAll, 800);
};

// Re-init on route change
window.addEventListener('hashchange', function(){
  destroySwipers();
  setTimeout(initScrollAnimations, 50);
  setTimeout(forceShowAll, 250);
});

// Initial page load
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(initScrollAnimations, 100);
  setTimeout(forceShowAll, 500);
});

// Fallback after full load
window.addEventListener('load', function(){
  setTimeout(forceShowAll, 200);
  // If banner still not initialized, retry
  if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
    initBannerSwiper();
  }
});

})();
