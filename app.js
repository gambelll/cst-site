/**
 * CST (CHAN'S SUPPORTER TEAM) - APP CORE JAVASCRIPT
 * Optimized, fast, robust helper for banners, modals, mobile drawer, YouTube, and Firebase
 */

(function () {
  'use strict';

  // --- Toast Notification Helper ---
  function showToast(message, duration = 2500) {
    let toast = document.getElementById('cstToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cstToast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
  window.showToast = showToast;

  // --- Copy to Clipboard Helper ---
  function copyText(text, successMsg = '클립보드에 복사되었습니다!') {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }
  function fallbackCopy(text, successMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch (err) {
      showToast('복사에 실패했습니다.');
    }
    document.body.removeChild(textArea);
  }
  window.copyText = copyText;

  // --- Include HTML Component Loader ---
  function includeHTML(callback) {
    const elements = document.querySelectorAll('[include-html]');
    let count = elements.length;
    if (count === 0) {
      if (typeof callback === 'function') callback();
      return;
    }

    elements.forEach(el => {
      const file = el.getAttribute('include-html');
      if (file) {
        fetch(file)
          .then(res => {
            if (!res.ok) throw new Error('Failed to load ' + file);
            return res.text();
          })
          .then(data => {
            el.innerHTML = data;
            el.removeAttribute('include-html');
            count--;
            if (count === 0 && typeof callback === 'function') callback();
          })
          .catch(err => {
            console.warn('includeHTML error:', err);
            count--;
            if (count === 0 && typeof callback === 'function') callback();
          });
      }
    });
  }
  window.includeHTML = includeHTML;

  // --- Initialize Mobile Navigation Drawer ---
  function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const sideMenu = document.getElementById('sideMenu');
    let backdrop = document.querySelector('.side-menu-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'side-menu-backdrop';
      document.body.appendChild(backdrop);
    }

    function openMenu() {
      if (sideMenu) sideMenu.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (sideMenu) sideMenu.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (hamburger) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        openMenu();
      });
    }

    const closeBtn = document.getElementById('closeBtn') || document.querySelector('.side-menu .close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    backdrop.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sideMenu && sideMenu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Highlight current active link in menu
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.side-menu a, .nav-links-desktop a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
        link.classList.add('active');
      }
    });
  }

  // --- Initialize Banner Slider ---
  function initBannerSlider() {
    const slider = document.querySelector('.banner-slider');
    if (!slider) return;

    const track = slider.querySelector('.banner-track');
    const banners = slider.querySelectorAll('.banner');
    const prevBtn = slider.querySelector('.banner-prev');
    const nextBtn = slider.querySelector('.banner-next');
    const dotsContainer = slider.querySelector('.banner-indicators');
    if (!track || banners.length <= 1) return;

    let index = 0;
    let autoPlayTimer = null;

    // Build or sync indicators
    let dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    if (dotsContainer && dots.length === 0) {
      dotsContainer.innerHTML = '';
      banners.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      });
      dots = dotsContainer.querySelectorAll('.dot');
    }

    function updateBanner() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function goToSlide(i) {
      index = (i + banners.length) % banners.length;
      updateBanner();
      resetAutoPlay();
    }

    function nextSlide() {
      goToSlide(index + 1);
    }

    function prevSlide() {
      goToSlide(index - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => goToSlide(i));
    });

    // Touch swipe support
    let startX = 0;
    let isTouching = false;

    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isTouching = true;
      clearInterval(autoPlayTimer);
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      if (!isTouching) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) nextSlide();
        else prevSlide();
      }
      isTouching = false;
      startAutoPlay();
    }, { passive: true });

    function startAutoPlay() {
      clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(nextSlide, 4000);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayTimer);
      startAutoPlay();
    }

    slider.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
    slider.addEventListener('mouseleave', () => startAutoPlay());

    startAutoPlay();
  }

  // --- Universal Modal Manager ---
  function initModalSystem() {
    const modal = document.getElementById('myModal');
    if (!modal) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const closeModalBtn = modal.querySelector('.close-btn') || modal.querySelector('.close');

    function openModal(title, content) {
      if (modalTitle) modalTitle.textContent = title || '';
      if (modalText) modalText.innerHTML = content || '';
      modal.style.display = 'flex';
      // Trigger animation frame for transition
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 200);
    }

    window.cstOpenModal = openModal;
    window.cstCloseModal = closeModal;

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    // Auto-bind openModalBtn clicks
    document.querySelectorAll('.openModalBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.getAttribute('data-title') || btn.innerText;
        const text = btn.getAttribute('data-text') || '';
        const buttons = btn.getAttribute('data-buttons') || '';
        
        let fullContent = '';
        if (text) {
          fullContent += `<p style="margin-bottom:12px; font-weight:600; color:#555;">${text}</p>`;
        }
        if (buttons) {
          fullContent += `<div class="modal-buttons">${buttons}</div>`;
        }
        
        openModal(title, fullContent);

        // Bind interactive sub-buttons inside modal if any (e.g., samsungBtn)
        const samsungBtn = modalText.querySelector('.samsungBtn');
        if (samsungBtn && btn.hasAttribute('data-samsung-flow')) {
          // Flow handled in specific pages
        }
      });
    });
  }

  // --- Lightbox Image Zoom Preview ---
  function initImageLightbox() {
    let lightbox = document.getElementById('imageLightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'imageLightbox';
      lightbox.className = 'modal';
      lightbox.innerHTML = `
        <div class="modal-content" style="max-width:90vw; max-height:90vh; padding:16px; background:transparent; border:none; box-shadow:none;">
          <button class="close-btn" style="position:fixed; top:20px; right:20px; z-index:3010; background:rgba(255,255,255,0.9);">&times;</button>
          <img id="lightboxImg" src="" style="max-width:100%; max-height:85vh; margin:auto; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.5);" alt="가이드 이미지">
        </div>
      `;
      document.body.appendChild(lightbox);

      const closeBtn = lightbox.querySelector('.close-btn');
      const close = () => {
        lightbox.classList.remove('show');
        setTimeout(() => {
          lightbox.style.display = 'none';
          document.body.style.overflow = '';
        }, 200);
      };

      closeBtn.addEventListener('click', close);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.id === 'lightboxImg') close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('show')) close();
      });
    }

    // Attach click listener to all guide images with class guide-img or inside main
    document.querySelectorAll('main img:not(.album-cover)').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const lbImg = document.getElementById('lightboxImg');
        if (lbImg) lbImg.src = img.src;
        lightbox.style.display = 'flex';
        requestAnimationFrame(() => lightbox.classList.add('show'));
        document.body.style.overflow = 'hidden';
      });
    });
  }

  // --- Top bar scroll effect ---
  function initScrollEffects() {
    const topBar = document.querySelector('.top-bar');
    if (!topBar) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        topBar.classList.add('scrolled');
      } else {
        topBar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- YouTube API Statistics Fetcher ---
  window.fetchYouTubeStats = async function (apiKey, videoId) {
    if (!apiKey || !videoId) return;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response not ok');
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const stats = data.items[0].statistics;
        const viewEl = document.getElementById('yt-views');
        const likeEl = document.getElementById('yt-likes');
        if (viewEl && stats.viewCount) {
          viewEl.innerText = Number(stats.viewCount).toLocaleString('ko-KR');
        }
        if (likeEl && stats.likeCount) {
          likeEl.innerText = Number(stats.likeCount).toLocaleString('ko-KR');
        }
      }
    } catch (e) {
      console.warn('YouTube API stats fetch failed:', e);
    }
  };

  // --- Auto Initialization On DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', () => {
    includeHTML(() => {
      initNavigation();
    });
    initNavigation();
    initBannerSlider();
    initModalSystem();
    initImageLightbox();
    initScrollEffects();
  });

})();
