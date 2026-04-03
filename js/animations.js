// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

// Scroll-triggered animations via IntersectionObserver
var _scrollObserver = null;

function initScrollAnimations(){
  var els = document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale');
  if(!els.length) return;

  if(!('IntersectionObserver' in window)){
    els.forEach(function(el){ el.classList.add('visible'); });
    return;
  }

  // Clean up old observer
  if(_scrollObserver){ try{ _scrollObserver.disconnect(); }catch(e){} }

  _scrollObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        _scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '50px 0px 50px 0px' });

  els.forEach(function(el){
    // Elements already in or near viewport — show immediately
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight + 80 && rect.bottom > -80){
      el.classList.add('visible');
    } else {
      _scrollObserver.observe(el);
    }
  });
}

// Force-show all animation elements currently visible in viewport
function forceShowAll(){
  var els = document.querySelectorAll('.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)');
  els.forEach(function(el){
    var rect = el.getBoundingClientRect();
    if(rect.top < window.innerHeight + 300 && rect.bottom > -200){
      el.classList.add('visible');
    }
  });
}

// Nuclear option: show absolutely everything after timeout
function forceShowEverything(){
  document.querySelectorAll('.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)').forEach(function(el){
    el.classList.add('visible');
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

    // Retry if banner swiper didn't initialize
    setTimeout(function(){
      if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
        initBannerSwiper();
      }
    }, 300);
  });

  // Scroll animations — multiple attempts for reliability
  requestAnimationFrame(function(){
    initScrollAnimations();
    setTimeout(forceShowAll, 50);
  });
  setTimeout(forceShowAll, 300);
  setTimeout(forceShowAll, 800);
  // Absolute failsafe — show everything after 2.5s
  setTimeout(forceShowEverything, 2500);

  // Also catch on first scroll
  var _scrolled = false;
  var _onScroll = function(){
    if(!_scrolled){
      _scrolled = true;
      forceShowAll();
    }
  };
  window.addEventListener('scroll', _onScroll, {passive:true});
  // Cleanup after 10s
  setTimeout(function(){ window.removeEventListener('scroll', _onScroll); }, 10000);
};

// Re-init on route change
window.addEventListener('hashchange', function(){
  destroySwipers();
  requestAnimationFrame(function(){
    initScrollAnimations();
    setTimeout(forceShowAll, 100);
  });
  setTimeout(forceShowAll, 400);
  setTimeout(forceShowEverything, 2500);
});

// Initial page load
document.addEventListener('DOMContentLoaded', function(){
  requestAnimationFrame(function(){
    initScrollAnimations();
    setTimeout(forceShowAll, 100);
  });
});

// Fallback after full load
window.addEventListener('load', function(){
  forceShowAll();
  setTimeout(forceShowAll, 300);
  if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
    initBannerSwiper();
  }
});

})();
