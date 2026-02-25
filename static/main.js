/**
 * 우드티켓 - main.js
 * 모든 인터랙션, 애니메이션, 실시간 피드 처리
 */

/* ============================================
   로딩 오버레이 — 실제 로딩 진행값 기반
============================================ */
(function () {
  'use strict';

  var loader   = document.getElementById('wt-loader');
  var bar      = document.getElementById('wtl-bar');
  var pct      = document.getElementById('wtl-percent');
  var statusEl = document.getElementById('wtl-status');
  var arc      = loader ? loader.querySelector('.wtl-ring-arc') : null;

  if (!loader) return;

  // 링 원둘레: 2π × 34 ≈ 213.6
  var CIRC = 213.6;
  var currentPct = 0;

  function setProgress(val, text) {
    var v = Math.min(Math.max(Math.round(val), 0), 100);
    if (v <= currentPct) return; // 역행 방지
    currentPct = v;

    if (bar)  bar.style.width = v + '%';
    if (pct)  pct.textContent  = v + '%';
    if (arc)  arc.style.strokeDashoffset = (CIRC * (1 - v / 100)).toFixed(2);
    if (statusEl && text) statusEl.textContent = text;
  }

  function hideLoader() {
    setProgress(100, '완료!');
    setTimeout(function () {
      loader.classList.add('wtl-hidden');
      // 완전히 사라진 뒤 DOM에서 제거
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 550);
    }, 280);
  }

  // ── 1단계: DOM 준비 직후 20%
  setProgress(20, 'DOM 파싱 완료');

  // ── 2단계: PerformanceResourceTiming 으로 리소스 로딩 추적
  function checkResources() {
    if (!window.performance || !window.performance.getEntriesByType) return;
    var entries = window.performance.getEntriesByType('resource');
    var total = entries.length || 1;
    var done  = entries.filter(function (e) { return e.responseEnd > 0; }).length;
    var ratio = done / total;
    // 20~70% 구간 매핑
    setProgress(20 + Math.round(ratio * 50), '리소스 로딩 중... (' + done + '/' + total + ')');
  }

  // ── 3단계: 이미지 로딩 추적
  function trackImages() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
    if (!imgs.length) { setProgress(80, '이미지 준비 완료'); return; }

    var loaded = 0;
    function onLoad() {
      loaded++;
      var ratio = loaded / imgs.length;
      setProgress(70 + Math.round(ratio * 20), '이미지 로딩 중... (' + loaded + '/' + imgs.length + ')');
    }
    imgs.forEach(function (img) {
      if (img.complete) { onLoad(); }
      else {
        img.addEventListener('load',  onLoad);
        img.addEventListener('error', onLoad); // 실패도 카운트
      }
    });
  }

  // ── 4단계: 폰트 로딩 추적
  function trackFonts() {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        setProgress(92, '폰트 로딩 완료');
      }).catch(function () {
        setProgress(92, '폰트 로딩 완료');
      });
    } else {
      setProgress(92, '폰트 로딩 완료');
    }
  }

  // ── 리소스 체크 타이머 (100ms 간격)
  var resourceTimer = setInterval(function () {
    checkResources();
    if (currentPct >= 70) clearInterval(resourceTimer);
  }, 100);

  // ── DOMContentLoaded: 40% → 이미지/폰트 추적 시작
  function onDOMReady() {
    setProgress(40, '페이지 구조 완료');
    trackImages();
    trackFonts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }

  // ── window load: 실제 모든 리소스 완료
  window.addEventListener('load', function () {
    clearInterval(resourceTimer);
    setProgress(98, '거의 완료...');
    setTimeout(hideLoader, 200);
  });

  // ── 안전망: 최대 4초 안에 강제 종료
  setTimeout(function () {
    clearInterval(resourceTimer);
    hideLoader();
  }, 4000);

})();

(function () {
  'use strict';

  /* ============================================
     헤더 스크롤 효과
  ============================================ */
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 20) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ============================================
     모바일 네비게이션
  ============================================ */
  function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-overlay');
    const closeBtn = document.getElementById('mobile-nav-close');

    function openNav() {
      mobileNav && mobileNav.classList.add('active');
      overlay && overlay.classList.add('active');
      hamburger && hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeNav() {
      mobileNav && mobileNav.classList.remove('active');
      overlay && overlay.classList.remove('active');
      hamburger && hamburger.classList.remove('active');
       document.body.style.overflow = '';
    }

    hamburger && hamburger.addEventListener('click', openNav);
    overlay && overlay.addEventListener('click', closeNav);
    closeBtn && closeBtn.addEventListener('click', closeNav);

    // 모바일 링크 클릭 시 닫기
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeNav);
      });
    }
  }

  /* ============================================
     숫자 카운트업 애니메이션
  ============================================ */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (target >= 1000) {
        el.textContent = current.toLocaleString('ko-KR') + suffix;
      } else {
        el.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (target >= 1000) {
          el.textContent = target.toLocaleString('ko-KR') + suffix;
        } else {
          el.textContent = target + suffix;
        }
      }
    }
    requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCount(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach(function (c) { observer.observe(c); });
  }

  /* ============================================
     스크롤 애니메이션 (Fade In) — 안전 버전
     · 이미 뷰포트 안에 있는 요소는 즉시 표시
     · transform 없이 opacity만 사용 → 레이아웃 흔들림 방지
  ============================================ */
  function initScrollAnimations() {
    var selectors = [
      '.sv-card', '.why-card', '.rv-card', '.faq-item',
      '.step-card', '.up-card', '.rt-stat-card',
      '.contact-left', '.contact-right',
      '.section-hd', '.how-tips', '.how-cta-box',
      '.unpaid-bottom', '.sv-notice'
    ];

    // CSS: transform 제거, opacity만 사용 → 스크롤 위치 변동 없음
    var style = document.createElement('style');
    style.textContent =
      selectors.join(', ') + ' { opacity: 0; transition: opacity 0.5s ease; }\n' +
      selectors.join('.visible, ') + '.visible { opacity: 1; }';
    document.head.appendChild(style);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // 한 번만 실행
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        // 이미 뷰포트 안에 있으면 즉시 표시 (초기 깜빡임 방지)
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('visible');
          return;
        }
        el.style.transitionDelay = (i % 3) * 0.06 + 's';
        observer.observe(el);
      });
    });
  }

  /* ============================================
     FAQ 아코디언
  ============================================ */
  function initFAQ() {
    document.querySelectorAll('.faq-q').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('open');

        // 전체 FAQ 리스트에서 다른 열린 항목 닫기
        var list = item.closest('.faq-list') || item.closest('.faq-col');
        if (list) {
          list.querySelectorAll('.faq-item.open').forEach(function (openItem) {
            if (openItem !== item) openItem.classList.remove('open');
          });
        }

        item.classList.toggle('open', !isOpen);
      });
    });
  }

  /* ============================================
     스무스 스크롤
  ============================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (href === '#') return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var headerH = document.getElementById('site-header')
            ? document.getElementById('site-header').offsetHeight
            : 64;
          var top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ============================================
     실시간 입금 피드 (동적 업데이트)
  ============================================ */
  var feedData = [
    { name: '김*수', type: '소액결제', amount: '35만원' },
    { name: '이*영', type: '정보이용료', amount: '100만원' },
    { name: '박*준', type: '신용카드', amount: '120만원' },
    { name: '최*민', type: '소액결제', amount: '5만원' },
    { name: '정*우', type: '정보이용료', amount: '25만원' },
    { name: '강*준', type: '소액결제', amount: '50만원' },
    { name: '윤*서', type: '신용카드', amount: '200만원' },
    { name: '한*진', type: '소액결제', amount: '45만원' },
    { name: '서*아', type: '신용카드', amount: '80만원' },
    { name: '배*원', type: '정보이용료', amount: '70만원' },
    { name: '조*현', type: '소액결제', amount: '30만원' },
    { name: '임*지', type: '정보이용료', amount: '60만원' },
    { name: '오*석', type: '신용카드', amount: '150만원' },
    { name: '황*영', type: '소액결제', amount: '20만원' },
    { name: '유*나', type: '정보이용료', amount: '85만원' },
  ];

  var feedIndex = 4;

  function initHeroFeed() {
    /* hero-feed 요소가 제거되었으므로 비활성화 */
  }

  /* ============================================
     실시간 처리현황 새 항목 추가
  ============================================ */
  var rtData = [
    { name: '김*수', type: '소액결제', tp: 'tp-mobile', amount: '35만원', done: true,  color: 'linear-gradient(135deg,#00C8D7,#00897B)' },
    { name: '이*영', type: '정보이용료', tp: 'tp-info', amount: '100만원', done: true,  color: 'linear-gradient(135deg,#3DE0D6,#00C8D7)' },
    { name: '박*준', type: '신용카드', tp: 'tp-card', amount: '120만원', done: false, color: 'linear-gradient(135deg,#00897B,#004D40)' },
    { name: '최*민', type: '소액결제', tp: 'tp-mobile', amount: '5만원',  done: true,  color: 'linear-gradient(135deg,#00C8D7,#00ADB8)' },
    { name: '조*현', type: '소액결제', tp: 'tp-mobile', amount: '30만원', done: true,  color: 'linear-gradient(135deg,#2DD4BF,#00897B)' },
    { name: '임*지', type: '정보이용료', tp: 'tp-info', amount: '60만원', done: true,  color: 'linear-gradient(135deg,#00ADB8,#007A6E)' },
    { name: '오*석', type: '신용카드', tp: 'tp-card', amount: '150만원', done: false, color: 'linear-gradient(135deg,#00897B,#00C8D7)' },
    { name: '황*영', type: '소액결제', tp: 'tp-mobile', amount: '20만원', done: true,  color: 'linear-gradient(135deg,#3DE0D6,#00897B)' },
    { name: '유*나', type: '정보이용료', tp: 'tp-info', amount: '85만원', done: true,  color: 'linear-gradient(135deg,#00C8D7,#00695C)' },
    { name: '권*호', type: '신용카드', tp: 'tp-card', amount: '300만원', done: false, color: 'linear-gradient(135deg,#00ADB8,#004D40)' },
    { name: '장*아', type: '소액결제', tp: 'tp-mobile', amount: '15만원', done: true,  color: 'linear-gradient(135deg,#2DD4BF,#00C8D7)' },
    { name: '심*철', type: '정보이용료', tp: 'tp-info', amount: '45만원', done: true,  color: 'linear-gradient(135deg,#00897B,#3DE0D6)' },
  ];
  var rtIndex = 0;
  var MAX_ROWS = 6;

  function makeRtRow(data) {
    var row = document.createElement('div');
    row.className = 'rt-row ' + (data.done ? 'done-row' : 'ing-row');
    var firstChar = data.name.charAt(0);
    row.innerHTML = [
      '<div class="rt-ava" style="background:' + data.color + '">' + firstChar + '</div>',
      '<div class="rt-detail">',
      '  <div class="rt-ntype"><strong>' + data.name + '</strong>님 · <span class="rt-tp ' + data.tp + '">' + data.type + '</span></div>',
      '  <div class="rt-amount">' + data.amount + '</div>',
      '</div>',
      data.done
        ? '<div class="rt-st done-st"><i class="fas fa-check-circle"></i> 입금완료</div>'
        : '<div class="rt-st ing-st"><i class="fas fa-spinner fa-spin"></i> 처리중</div>'
    ].join('');
    return row;
  }

  function initRtFeed() {
    var rtList = document.getElementById('rt-list');
    if (!rtList) return;

    // ── 1. 초기 행 렌더링 (MAX_ROWS개, 애니메이션 없이 즉시) ──
    rtList.innerHTML = '';
    for (var i = 0; i < MAX_ROWS; i++) {
      rtList.appendChild(makeRtRow(rtData[i % rtData.length]));
    }
    rtIndex = MAX_ROWS;

    // ── 2. 높이 고정 (렌더 완료 후 측정) ──
    requestAnimationFrame(function() {
      var h = rtList.scrollHeight;
      rtList.style.height = h + 'px';
      rtList.style.minHeight = h + 'px';
      rtList.style.maxHeight = h + 'px';
    });

    // ── 3. 주기적으로 맨 아래에 새 행 추가, 맨 위 오래된 행 exit ──
    setInterval(function () {
      var data = rtData[rtIndex % rtData.length];
      rtIndex++;

      // 새 행 생성 후 enter 상태로 맨 아래 추가
      var newRow = makeRtRow(data);
      newRow.classList.add('rt-row-enter');
      rtList.appendChild(newRow);

      // 맨 위 오래된 행 슬라이드-아웃
      var rows = rtList.querySelectorAll('.rt-row');
      if (rows.length > MAX_ROWS) {
        var oldRow = rows[0];
        oldRow.classList.add('rt-row-exit');
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            oldRow.classList.add('rt-row-exit-active');
          });
        });
        setTimeout(function() {
          if (oldRow.parentNode) oldRow.parentNode.removeChild(oldRow);
        }, 460);
      }

      // 새 행 슬라이드-인 시작
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          newRow.classList.remove('rt-row-enter');
          newRow.classList.add('rt-row-enter-active');
          setTimeout(function() {
            newRow.classList.remove('rt-row-enter-active');
          }, 460);
        });
      });

    }, 3800);
  }

  /* ============================================
     실시간 팝업 알림 - 비활성화
  ============================================ */
  function createPopup(data) { /* 팝업 제거됨 */ }
  function initPopups() { /* 팝업 제거됨 */ }

  /* ============================================
     티커 복제 (무한 스크롤 보장)
  ============================================ */
  function initTicker() {
    var track = document.getElementById('ticker-track');
    if (!track) return;
    // 이미 HTML에 2세트 있으므로 바로 사용
  }

  /* ============================================
     네비게이션 활성 상태
  ============================================ */
  function initNavActive() {
    var sections = document.querySelectorAll('section[id], div[id]');
    var navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    if (!navLinks.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (link) {
            link.style.color = '';
            link.style.background = '';
          });
          var active = document.querySelector('.main-nav a[href="#' + entry.target.id + '"]');
          if (active) {
            active.style.color = '#C0392B';
            active.style.background = '#FDEDEC';
          }
        }
      });
    }, { threshold: 0.4 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ============================================
     스티키 CTA 표시 조건
  ============================================ */
  function initStickyCTA() {
    var cta = document.getElementById('sticky-cta');
    if (!cta) return;
    // 히어로 지나면 표시 (모바일)
    var hero = document.querySelector('.hero-section');
    if (!hero) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // hero가 화면을 벗어나면 CTA 활성화는 CSS가 처리
      });
    });
    observer.observe(hero);
  }

  /* ============================================
     초기화
  ============================================ */
  function init() {
    initHeader();
    initMobileNav();
    initCounters();
    initFAQ();
    initSmoothScroll();
    initHeroFeed();

    // ★ rt-list 높이 고정: 초기 렌더 후 실제 높이를 측정해 style로 잠금
    //   → 이후 행 추가/삭제해도 컨테이너 높이가 절대 변하지 않음
    var rtList = document.getElementById('rt-list');
    if (rtList) {
      // 초기 행들이 렌더된 직후 높이 측정
      requestAnimationFrame(function () {
        var h = rtList.scrollHeight;
        if (h > 0) {
          rtList.style.height = h + 'px';
          rtList.style.minHeight = h + 'px';
          rtList.style.maxHeight = h + 'px';
        }
      });
    }

    initRtFeed();
    initPopups();
    initTicker();
    initNavActive();
    initStickyCTA();

    // 약간의 딜레이 후 스크롤 애니메이션 (DOMContentLoaded 이후)
    setTimeout(initScrollAnimations, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
