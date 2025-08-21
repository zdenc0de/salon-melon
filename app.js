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

// Cache para imágenes precargadas
const imageCache = new Map();
let imagesLoaded = 0;

// Función para crear imagen optimizada con placeholder
function createOptimizedImage(src, alt, className = '') {
  const container = document.createElement('div');
  container.className = `image-container ${className}`;
  container.style.cssText = `
    position: relative;
    background: linear-gradient(45deg, #333, #555);
    background-size: 20px 20px;
    background-image: 
      linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
    animation: loading-pulse 1.5s ease-in-out infinite;
  `;

  const img = document.createElement('img');
  img.alt = alt;
  img.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.5s ease;
  `;

  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'loading-spinner';
  loadingSpinner.innerHTML = '🍈'; // Emoji de melón como spinner
  loadingSpinner.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;
    animation: spin 1s linear infinite;
  `;

  container.appendChild(loadingSpinner);
  container.appendChild(img);

  // Cargar imagen de forma asíncrona
  loadImageAsync(src).then(optimizedSrc => {
    img.src = optimizedSrc;
    img.onload = () => {
      img.style.opacity = '1';
      loadingSpinner.style.display = 'none';
      container.style.background = 'transparent';
    };
  }).catch(() => {
    loadingSpinner.innerHTML = '❌';
    loadingSpinner.style.animation = 'none';
  });

  return container;
}

// Función para cargar imágenes de forma asíncrona con optimización
function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      // Crear canvas para comprimir la imagen si es muy grande
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Determinar el tamaño óptimo
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let { width, height } = img;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen optimizada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con calidad optimizada
      canvas.toBlob((blob) => {
        const optimizedSrc = URL.createObjectURL(blob);
        imageCache.set(src, optimizedSrc);
        resolve(optimizedSrc);
      }, 'image/jpeg', 0.85);
    };
    
    img.onerror = reject;
    img.src = src;
  });
}

// Precargar imágenes críticas (primera imagen y siguientes 2)
function preloadCriticalImages() {
  const criticalImages = images.slice(0, 3);
  criticalImages.forEach(src => {
    loadImageAsync(src).then(() => {
      imagesLoaded++;
      if (imagesLoaded === 1) {
        // Mostrar la primera imagen inmediatamente
        initializeSlider();
      }
    });
  });
}

// Precargar resto de imágenes en segundo plano
function preloadRemainingImages() {
  const remainingImages = images.slice(3);
  let index = 0;
  
  function loadNext() {
    if (index >= remainingImages.length) return;
    
    loadImageAsync(remainingImages[index]).then(() => {
      index++;
      // Cargar siguiente imagen con un pequeño delay para no saturar
      setTimeout(loadNext, 200);
    });
  }
  
  // Comenzar carga después de un segundo para dar prioridad al contenido crítico
  setTimeout(loadNext, 1000);
}

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

// Auto slide con pausa inteligente
let autoSlideInterval;
let isAutoSliding = true;

function startAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(() => {
    if (isAutoSliding && imagesLoaded >= 3) {
      changeSlide(1);
    }
  }, 5000);
}

function pauseAutoSlide() {
  isAutoSliding = false;
  setTimeout(() => { isAutoSliding = true; }, 10000); // Resume after 10 seconds
}

// Lightbox functionality mejorada
function openLightbox(imgSrc, index) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  
  // Pausar auto-slide
  pauseAutoSlide();
  
  lightbox.classList.add('active');
  
  // Mostrar spinner mientras carga
  lightboxImg.style.opacity = '0';
  
  loadImageAsync(imgSrc).then(optimizedSrc => {
    lightboxImg.src = optimizedSrc;
    lightboxImg.onload = () => {
      lightboxImg.style.opacity = '1';
    };
  });
  
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
  lightboxImg.style.opacity = '0';
  
  loadImageAsync(images[slideIndex - 1]).then(optimizedSrc => {
    lightboxImg.src = optimizedSrc;
    lightboxImg.onload = () => {
      lightboxImg.style.opacity = '1';
    };
  });
}

// Intersection Observer para lazy loading
function initializeLazyLoading() {
  if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            loadImageAsync(src).then(optimizedSrc => {
              img.src = optimizedSrc;
              img.onload = () => {
                img.style.opacity = '1';
                img.parentNode.querySelector('.loading-spinner')?.remove();
              };
            });
            
            img.removeAttribute('data-src');
            lazyImageObserver.unobserve(img);
          }
        }
      });
    });

    // Observar todas las imágenes con data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      lazyImageObserver.observe(img);
    });
  }
}

// Inicializar slider cuando las imágenes críticas estén listas
function initializeSlider() {
  showSlide(slideIndex);
  startAutoSlide();
  
  // Event listeners para el slider
  const sliderImages = document.querySelectorAll('.slide img');
  sliderImages.forEach((img, index) => {
    img.addEventListener('click', () => {
      openLightbox(img.src, index + 1);
    });
  });
}

// Optimización de eventos con debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Detectar cuando el usuario está inactivo para pausar animaciones
let userActive = true;
let inactivityTimer;

function resetInactivityTimer() {
  userActive = true;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    userActive = false;
  }, 30000); // 30 segundos de inactividad
}

// Event listeners optimizados
document.addEventListener('DOMContentLoaded', function() {
  // Agregar estilos CSS para animaciones
  const style = document.createElement('style');
  style.textContent = `
    @keyframes loading-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    @keyframes spin {
      from { transform: translate(-50%, -50%) rotate(0deg); }
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .image-container {
      min-height: 200px;
    }
    
    .lightbox img {
      transition: opacity 0.3s ease;
    }
    
    /* Optimizaciones de rendimiento */
    .slide {
      will-change: transform;
    }
    
    .slider-nav, .lightbox-nav {
      will-change: background;
    }
  `;
  document.head.appendChild(style);

  // Inicializar carga de imágenes
  preloadCriticalImages();
  preloadRemainingImages();
  initializeLazyLoading();

  // Close lightbox on outside click
  document.getElementById('lightbox').addEventListener('click', function(e) {
    if (e.target === this) {
      closeLightbox();
    }
  });

  // Smooth scrolling optimizado
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

  // Detectar actividad del usuario
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, debounce(resetInactivityTimer, 100), true);
  });

  // Pausar animaciones cuando la pestaña no está visible
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      isAutoSliding = false;
    } else {
      isAutoSliding = true;
    }
  });
});

// Menú hamburguesa optimizado
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.main-nav');
  const burger = nav.querySelector('.hamburger');

  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });

  // Cerrar menú al clicar un enlace
  nav.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
    });
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      nav.classList.remove('open');
    }
  });
});

// Optimización para conexiones lentas
if ('connection' in navigator) {
  const connection = navigator.connection;
  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    // Reducir calidad de imágenes para conexiones muy lentas
    console.log('Conexión lenta detectada, optimizando carga de imágenes...');
  }
}

