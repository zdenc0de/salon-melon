let slideIndex = 1;
const images = [
  'images/i1.jpg',
  'images/i2.jpg',
  'images/i3.jpg',
  'images/i4.jpg',
  'images/i5.jpg',
  'images/i6.jpg',
  'images/i7.jpg',
  'images/i8.jpg',
  'images/i9.jpg',
  'images/i10.jpg',
  'images/i11.jpg',
  'images/i12.jpg',
  'images/i14.jpg'
];

function showSlide(n) {
  const slides = document.querySelectorAll('.slide');
  const indicators = document.querySelectorAll('.indicator');
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  slides.forEach(slide => slide.classList.remove('active'));
  indicators.forEach(indicator => indicator.classList.remove('active'));
  slides[slideIndex - 1].classList.add('active');
  indicators[slideIndex - 1].classList.add('active');
}

function changeSlide(n) {
  showSlide(slideIndex += n);
}

function currentSlide(n) {
  showSlide(slideIndex = n);
}

// Auto slide (opcional)
setInterval(() => {
  changeSlide(1);
}, 5000);

// Lightbox functionality
function openLightbox(imgSrc, index) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  lightbox.classList.add('active');
  lightboxImg.src = imgSrc;
  slideIndex = index;
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
}

function lightboxSlide(n) {
  slideIndex += n;
  if (slideIndex > images.length) slideIndex = 1;
  if (slideIndex < 1) slideIndex = images.length;
  const lightboxImg = document.getElementById('lightbox-img');
  lightboxImg.src = images[slideIndex - 1];
}

// Add click event to slider images for lightbox
document.addEventListener('DOMContentLoaded', function() {
  const sliderImages = document.querySelectorAll('.slide img');
  sliderImages.forEach((img, index) => {
    img.addEventListener('click', () => {
      openLightbox(img.src, index + 1);
    });
  });

  // Close lightbox on outside click
  document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
      closeLightbox();
    }
  });

  // Smooth scrolling for navigation
  document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Initialize first slide
showSlide(slideIndex);

// Menú hamburguesa
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.main-nav');
  const burger = nav.querySelector('.hamburger');

  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // opcional: cerrar menú al clicar un enlace
  nav.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
    });
  });
});

