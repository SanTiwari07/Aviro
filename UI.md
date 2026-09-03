# Razorpay-Inspired Design System

A complete design system inspired by razorpay.com and razorpay.com/buildathon/ featuring typography, colors, animations, and UI components.

## 🎨 Color Palette

### Primary Colors
```css
:root {
  /* Brand Colors */
  --razorpay-blue: #305EFF;
  --razorpay-blue-dark: #192839;
  --razorpay-blue-light: #4A90FF;
  
  /* Background Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F4F8FF;
  --bg-tertiary: #F5F8FE;
  
  /* Text Colors */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #64748B;
  
  /* Accent Colors */
  --accent-green: #00D09C;
  --accent-purple: #8B5CF6;
  --gradient-start: #305EFF;
  --gradient-end: #00D09C;
}
```

## 📝 Typography

### Font Families
- **Headings**: TASA Orbiter Display (or Inter SemiBold as fallback)
- **Body**: Inter
- **Monospace**: JetBrains Mono / Fira Code

### Font Setup
```html
<!-- Add to your HTML head -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=TASA+Orbiter+Display:wght@600;700&display=swap" rel="stylesheet">
```

### Typography Scale
```css
:root {
  --font-heading: 'TASA Orbiter Display', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 2rem;      /* 32px */
  --text-4xl: 2.5rem;    /* 40px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.5rem;    /* 56px */
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-primary);
}

h1 {
  font-family: var(--font-heading);
  font-size: var(--text-6xl);
  font-weight: 600;
  line-height: 1.14;
  letter-spacing: -0.02em;
}

h2 {
  font-family: var(--font-heading);
  font-size: var(--text-5xl);
  font-weight: 600;
  line-height: 1.17;
}

h3 {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: 600;
  line-height: 1.15;
}
```

## ✨ Animations

### Fade In Animation
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.fade-in-delay-1 {
  animation: fadeIn 0.6s ease-out 0.2s forwards;
  opacity: 0;
}

.fade-in-delay-2 {
  animation: fadeIn 0.6s ease-out 0.4s forwards;
  opacity: 0;
}
```

### Gradient Animation
```css
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(
    -45deg,
    var(--gradient-start),
    var(--razorpay-blue-light),
    var(--accent-green),
    var(--gradient-start)
  );
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

### Float Animation
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float {
  animation: float 3s ease-in-out infinite;
}
```

### Pulse Animation
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Slide In Animations
```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-in-left {
  animation: slideInLeft 0.6s ease-out forwards;
}

.slide-in-right {
  animation: slideInRight 0.6s ease-out forwards;
}
```

### Scale Animation
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 0.4s ease-out forwards;
}
```

## 🎯 UI Components

### Buttons
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: #FFFFFF;
  background-color: var(--razorpay-blue);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(48, 94, 255, 0.2);
}

.btn-primary:hover {
  background-color: #2649D9;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px -1px rgba(48, 94, 255, 0.3);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--razorpay-blue);
  background-color: transparent;
  border: 2px solid var(--razorpay-blue);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: rgba(48, 94, 255, 0.08);
}
```

### Cards
```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
              0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 1px solid rgba(48, 94, 255, 0.1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(48, 94, 255, 0.15),
              0 6px 12px -4px rgba(48, 94, 255, 0.1);
}

.card-gradient {
  background: linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 100%);
}
```

### Gradient Background Sections
```css
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #F4F8FF 0%, #FFFFFF 100%);
  overflow: hidden;
  padding: 6rem 2rem;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 80%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(48, 94, 255, 0.08) 0%,
    transparent 70%
  );
  animation: float 8s ease-in-out infinite;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -10%;
  width: 60%;
  height: 150%;
  background: radial-gradient(
    circle,
    rgba(0, 208, 156, 0.06) 0%,
    transparent 70%
  );
  animation: float 10s ease-in-out infinite reverse;
}
```

### Feature Cards with Icons
```css
.feature-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 2rem;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid rgba(48, 94, 255, 0.08);
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: var(--razorpay-blue);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(48, 94, 255, 0.12);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--razorpay-blue) 0%, var(--razorpay-blue-light) 100%);
  border-radius: 10px;
  color: #FFFFFF;
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
}
```

### Navigation Bar
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 3rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(48, 94, 255, 0.08);
  z-index: 1000;
  transition: all 0.3s ease;
}

.navbar.scrolled {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.nav-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--text-sm);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--razorpay-blue);
  background: rgba(48, 94, 255, 0.06);
}
```

## 🌊 Advanced Effects

### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 24px -8px rgba(48, 94, 255, 0.15);
}
```

### Animated Border
```css
@keyframes borderRotate {
  0% {
    border-image-source: linear-gradient(0deg, var(--razorpay-blue), var(--accent-green));
  }
  50% {
    border-image-source: linear-gradient(90deg, var(--razorpay-blue), var(--accent-green));
  }
  100% {
    border-image-source: linear-gradient(0deg, var(--razorpay-blue), var(--accent-green));
  }
}

.animated-border {
  border: 2px solid transparent;
  border-image-slice: 1;
  animation: borderRotate 3s linear infinite;
}
```

### Shimmer Effect
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer {
  background: linear-gradient(
    90deg,
    rgba(48, 94, 255, 0.05) 0%,
    rgba(48, 94, 255, 0.15) 50%,
    rgba(48, 94, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

### Blob Animation
```css
@keyframes blob {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  }
  50% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
}

.blob {
  position: absolute;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, var(--razorpay-blue) 0%, var(--accent-green) 100%);
  opacity: 0.1;
  filter: blur(60px);
  animation: blob 8s ease-in-out infinite;
}
```

## 📱 Responsive Utilities

```css
/* Container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Grid System */
.grid {
  display: grid;
  gap: 2rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1024px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
  
  h1 {
    font-size: var(--text-4xl);
  }
  
  h2 {
    font-size: var(--text-3xl);
  }
}

/* Flex Utilities */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-4 {
  gap: 1rem;
}

.gap-8 {
  gap: 2rem;
}
```

## 🎭 Scroll Animations

```css
/* Reveal on Scroll */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger Animation */
.stagger-1 {
  transition-delay: 0.1s;
}

.stagger-2 {
  transition-delay: 0.2s;
}

.stagger-3 {
  transition-delay: 0.3s;
}

.stagger-4 {
  transition-delay: 0.4s;
}
```

## 🔧 JavaScript for Scroll Animations

```javascript
// Scroll reveal animation
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    
    reveals.forEach((reveal) => {
      const elementTop = reveal.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('active');
      }
    });
  };
  
  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Trigger once on load
}

// Navbar scroll effect
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initNavbar();
});
```

## 📦 Complete Example

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <div class="logo">Your Logo</div>
    <div class="nav-links">
      <a href="#" class="nav-link">Features</a>
      <a href="#" class="nav-link">Pricing</a>
      <a href="#" class="nav-link">About</a>
      <button class="btn-primary">Get Started</button>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="grid grid-2 items-center">
        <div class="reveal">
          <h1>Build Something Amazing</h1>
          <p class="text-lg text-secondary">
            Create beautiful, responsive websites with modern animations and clean design.
          </p>
          <div class="flex gap-4 mt-8">
            <button class="btn-primary">Get Started</button>
            <button class="btn-secondary">Learn More</button>
          </div>
        </div>
        <div class="reveal stagger-2">
          <!-- Hero Image/Illustration -->
          <div class="card card-gradient float">
            <div class="feature-icon">🚀</div>
            <h3>Lightning Fast</h3>
            <p>Optimized for performance</p>
          </div>
        </div>
      </div>
    </div>
    <div class="blob" style="top: 10%; left: 5%;"></div>
    <div class="blob" style="bottom: 10%; right: 5%; animation-delay: -4s;"></div>
  </section>

  <!-- Features Section -->
  <section class="py-20">
    <div class="container">
      <div class="text-center mb-16 reveal">
        <h2>Powerful Features</h2>
        <p class="text-secondary">Everything you need to build great products</p>
      </div>
      <div class="grid grid-3">
        <div class="feature-card reveal stagger-1">
          <div class="feature-icon">⚡</div>
          <h3>Fast Performance</h3>
          <p class="text-secondary">Optimized for speed and efficiency</p>
        </div>
        <div class="feature-card reveal stagger-2">
          <div class="feature-icon">🎨</div>
          <h3>Beautiful Design</h3>
          <p class="text-secondary">Modern, clean aesthetics</p>
        </div>
        <div class="feature-card reveal stagger-3">
          <div class="feature-icon">🔒</div>
          <h3>Secure</h3>
          <p class="text-secondary">Enterprise-grade security</p>
        </div>
      </div>
    </div>
  </section>

  <script src="script.js"></script>
</body>
</html>
```

## 🎯 Additional Tips

1. **Use CSS Variables**: All colors and spacing use CSS variables for easy theming
2. **Performance**: Animations use `transform` and `opacity` for GPU acceleration
3. **Accessibility**: Add `prefers-reduced-motion` media query for users who prefer no animations
4. **Dark Mode**: Extend CSS variables with dark mode variants
5. **Icons**: Use libraries like Lucide, Heroicons, or Phosphor Icons

## 📚 Resources

- **Blade Design System**: https://github.com/razorpay/blade
- **Inter Font**: https://fonts.google.com/specimen/Inter
- **TASA Orbiter**: https://github.com/localremotetw/TASA-Typeface-Collection
- **Animation Inspiration**: https://razorpay.com/buildathon/

---

*This design system is inspired by Razorpay's official design language. For production use, consider reviewing their open-source Blade Design System for complete component documentation.*