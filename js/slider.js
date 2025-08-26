// slider.js
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slider .slide');
  let current = 0;

  if (slides.length > 0) {
    // Hide all but the first
    slides.forEach((slide, i) => {
      slide.style.display = i === 0 ? 'block' : 'none';
    });

    setInterval(() => {
      slides[current].style.display = 'none';
      current = (current + 1) % slides.length;
      slides[current].style.display = 'block';
    }, 4000);
  }
});
