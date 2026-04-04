// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

var _scrollObserver = null;

function initScrollAnimations(){
  var els = document.querySelectorAll('.anim-fade-up,.anim-fade-left,.anim-fade-right,.anim-scale');
  if(!els.length) return;

  if(!('IntersectionObserver' in window)){
    // Old browser: small delay so opacity:0 is painted first
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
  // threshold 0.05: element needs 5% visible to trigger
  // rootMargin: no pre-loading — animate exactly when entering viewport
  }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

  els.forEach(function(el){ _scrollObserver.observe(el); });
}

// Force-show elements that are in or near the current viewport.
// Small margin (+30px) so elements just offscreen also trigger.
function forceShowAll(){
  var vh = window.innerHeight;
  document.querySelectorAll('.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)')
    .forEach(function(el){
      var rect = el.getBoundingClientRect();
      if(rect.top < vh + 30 && rect.bottom > -30){
        el.classList.add('visible');
      }
    });
}

// Nuclear fallback — only shows elements the user has ALREADY scrolled to.
// Never force-shows elements below the current scroll position (that would skip their animation).
function forceShowEverything(){
  var scrolledTo = window.pageYOffset + window.innerHeight + 100;
  document.querySelectorAll('.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)')
    .forEach(function(el){
      var rect = el.getBoundingClientRect();
      var elAbsTop = rect.top + window.pageYOffset;
      if(elAbsTop < scrolledTo){ el.classList.add('visible'); }
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

// ——— startObserving: double-rAF guarantees opacity:0 is PAINTED before we add .visible ———
// Frame 1 (rAF1): browser computes styles — elements exist at opacity:0 but not yet on screen
// Frame 2 (rAF2): browser paints frame 1 — opacity:0 is ON SCREEN
// rAF2 callback: we attach observer — next time .visible is added, transition plays correctly
function startObserving(){
  requestAnimationFrame(function(){         // frame 1 queued
    requestAnimationFrame(function(){       // fires AFTER frame 1 is painted
      initScrollAnimations();
    });
  });
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

  // Periodic fallback: poll every 300ms for 8s.
  // Handles iOS IntersectionObserver quirks — only shows elements already in viewport.
  var _animInterval = setInterval(forceShowAll, 300);
  setTimeout(function(){ clearInterval(_animInterval); }, 8000);

  // Nuclear fallback at 8s: show any elements user has scrolled to but observer missed.
  setTimeout(forceShowEverything, 8000);

  // First-scroll + recurring scroll fallback (iOS IntersectionObserver quirks)
  var _scrollChecks = 0;
  var _onScroll = function(){
    _scrollChecks++;
    forceShowAll();
    if(_scrollChecks >= 20) window.removeEventListener('scroll', _onScroll);
  };
  window.addEventListener('scroll', _onScroll, {passive:true});
  setTimeout(function(){ window.removeEventListener('scroll', _onScroll); }, 10000);
};

// ——— Route change (hash SPA navigation) ———
window.addEventListener('hashchange', function(){
  destroySwipers();
  startObserving();
  var _i = setInterval(forceShowAll, 300);
  setTimeout(function(){ clearInterval(_i); }, 8000);
  setTimeout(forceShowEverything, 8000);
});

// ——— Initial page load ———
// Delay 200ms so the SPA has time to render home content before we query elements
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(startObserving, 200);
});

// window.load: elements are in DOM — use rAF so opacity:0 is painted before showing
window.addEventListener('load', function(){
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      forceShowAll();
    });
  });
  setTimeout(forceShowAll, 500);
  if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
    initBannerSwiper();
  }
});

})();
