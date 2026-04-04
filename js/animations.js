// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

var _scrollObserver = null;
var _scrollFallbackHandler = null;
var ANIM_SEL = '.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)';
// Element must be this many px above the viewport bottom before it animates.
// Prevents animations firing when element is barely peeking at the bottom edge.
var TRIGGER_INSET = 120;

function initScrollAnimations(){
  var els = document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale');
  if(!els.length) return;

  if(!('IntersectionObserver' in window)){
    setTimeout(function(){ els.forEach(function(el){ el.classList.add('visible'); }); }, 50);
    return;
  }

  if(_scrollObserver){ try{ _scrollObserver.disconnect(); }catch(e){} }

  _scrollObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        _scrollObserver.unobserve(entry.target);
      }
    });
  // threshold 0.15: 15% of element visible in the trigger zone
  // rootMargin: negative bottom = element must be TRIGGER_INSET px into viewport
  }, { threshold: 0.15, rootMargin: '0px 0px -' + TRIGGER_INSET + 'px 0px' });

  els.forEach(function(el){ _scrollObserver.observe(el); });
}

// ——— Scroll-event fallback (iOS IntersectionObserver quirks) ———
// Only fires on actual scroll — no timers, no premature showing.
// Same conservative inset as the observer.
function scrollFallback(){
  var cutoff = window.innerHeight - TRIGGER_INSET;
  document.querySelectorAll(ANIM_SEL).forEach(function(el){
    var rect = el.getBoundingClientRect();
    if(rect.top < cutoff && rect.bottom > 0){
      el.classList.add('visible');
    }
  });
}

function attachScrollFallback(){
  if(_scrollFallbackHandler) window.removeEventListener('scroll', _scrollFallbackHandler);
  _scrollFallbackHandler = scrollFallback;
  window.addEventListener('scroll', _scrollFallbackHandler, {passive:true});
  setTimeout(function(){
    if(_scrollFallbackHandler){ window.removeEventListener('scroll', _scrollFallbackHandler); _scrollFallbackHandler = null; }
  }, 20000);
}

// ——— startObserving: double-rAF guarantees opacity:0 is PAINTED before observer fires ———
function startObserving(){
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      initScrollAnimations();
    });
  });
}

// ——— Swiper ———
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
      breakpoints: { 768: { slidesPerView: 2.2, spaceBetween: 20 } },
      observer: true,
      observeParents: true
    });
  } catch(e){}
}

function destroySwipers(){
  if(_bannerSwiper && _bannerSwiper.destroy){ try{ _bannerSwiper.destroy(true,true); }catch(e){} _bannerSwiper=null; }
  if(_newsSwiper  && _newsSwiper.destroy) { try{ _newsSwiper.destroy(true,true);  }catch(e){} _newsSwiper=null;  }
}

// ——— initHomeAnimations (called by app.js after home page renders) ———
window.initHomeAnimations = function(){
  destroySwipers();

  requestAnimationFrame(function(){
    initBannerSwiper();
    initNewsSwiper();
    setTimeout(function(){
      if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
        initBannerSwiper();
      }
    }, 300);
  });

  startObserving();
  attachScrollFallback();
};

// ——— Route change (hash SPA navigation) ———
window.addEventListener('hashchange', function(){
  destroySwipers();
  startObserving();
  attachScrollFallback();
});

// ——— Initial page load ———
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(startObserving, 200);
});

// window.load: just retry Swiper if needed — NO forced showing
window.addEventListener('load', function(){
  if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
    initBannerSwiper();
  }
});

})();
