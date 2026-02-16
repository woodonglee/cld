/* ===== 스무스 스크롤 & 네비게이션 활성화 ===== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__list a');

// 스크롤 위치에 따라 현재 섹션 네비게이션 활성화
const onScroll = () => {
  const scrollY = window.scrollY + 80;
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const height = sec.offsetHeight;
    const id = sec.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav__list a[href="#${id}"]`);
      if (active) active.classList.add('active');
    }
  });
};
window.addEventListener('scroll', onScroll, { passive: true });

/* ===== 모바일 메뉴 토글 ===== */
const toggle = document.querySelector('.nav__toggle');
const navList = document.querySelector('.nav__list');

toggle.addEventListener('click', () => {
  navList.classList.toggle('open');
});

// 메뉴 항목 클릭 시 닫기
navLinks.forEach(a => {
  a.addEventListener('click', () => navList.classList.remove('open'));
});

/* ===== 스크롤 페이드인 (Intersection Observer) ===== */
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
fadeEls.forEach(el => observer.observe(el));
