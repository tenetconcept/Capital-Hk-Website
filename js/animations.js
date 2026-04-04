// ============================================
// ANIMATIONS — Scroll observer + Swiper init
// ============================================
(function(){
"use strict";

var _scrollObserver = null;
var ANIM_SEL = '.anim-fade-up:not(.visible),.anim-fade-left:not(.visible),.anim-fade-right:not(.visible),.anim-scale:not(.visible)';

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
  // threshold 0.1: 10% of element must be visible in the trigger zone
  // rootMargin bottom -80px: element must be 80px INTO the viewport before triggering
  // This prevents animations firing when element is barely peeking at the bottom edge
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  els.forEach(function(el){ _scrollObserver.observe(el); });
}

// Force-show elements clearly within the viewport.
// Uses vh - 60 so elements near the bottom edge are NOT shown prematurely.
function forceShowAll(){
  var vh = window.innerHeight;
  document.querySelectorAll(ANIM_SEL)
    .forEach(function(el){
      var rect = el.getBoundingClientRect();
      if(rect.top < vh - 60 && rect.bottom > -30){
        el.classList.add('visible');
      }
    });
}

// Nuclear fallback — only shows elements the user has ALREADY scrolled well past.
// Conservative: subtracts 40px so elements near the bottom edge are left for the observer.
function forceShowEverything(){
  var scrolledTo = window.pageYOffset + window.innerHeight - 40;
  document.querySelectorAll(ANIM_SEL)
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
function startObserving(){
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
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

  // Periodic fallback: poll every 500ms for 5s (iOS IntersectionObserver quirks).
  // Uses the conservative forceShowAll (vh - 60) so nothing fires prematurely.
  var _animInterval = setInterval(forceShowAll, 500);
  setTimeout(function(){ clearInterval(_animInterval); }, 5000);

  // Nuclear fallback at 6s: show any elements user has scrolled to but observer missed.
  setTimeout(forceShowEverything, 6000);

  // Scroll fallback (iOS quirks) — limited to 15 events over 8s
  var _scrollChecks = 0;
  var _onScroll = function(){
    _scrollChecks++;
    forceShowAll();
    if(_scrollChecks >= 15) window.removeEventListener('scroll', _onScroll);
  };
  window.addEventListener('scroll', _onScroll, {passive:true});
  setTimeout(function(){ window.removeEventListener('scroll', _onScroll); }, 8000);
};

// ——— Route change (hash SPA navigation) ———
window.addEventListener('hashchange', function(){
  destroySwipers();
  startObserving();
  var _i = setInterval(forceShowAll, 500);
  setTimeout(function(){ clearInterval(_i); }, 5000);
  setTimeout(forceShowEverything, 6000);
});

// ——— Initial page load ———
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(startObserving, 200);
});

// window.load: show above-fold elements via observer; Swiper retry
window.addEventListener('load', function(){
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      forceShowAll();
    });
  });
  if(document.querySelector('.banner-swiper') && !document.querySelector('.banner-swiper.swiper-initialized')){
    initBannerSwiper();
  }
});

})();
