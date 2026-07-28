/* ==========================================================================
   Yauza Store — vanilla JS, без зависимостей и сборки.
   1) Мобильное меню
   2) Форма предзаказа -> формирование ссылки wa.me и открытие в новой вкладке
   3) Плавное закрытие меню при переходе по якорю
   4) 3D-наклон карточек каталога при наведении курсора
   5) Параллакс декоративного фона hero при скролле
   ========================================================================== */

(function () {
  "use strict";

  var WHATSAPP_PHONE = "79670888169"; // +7 967 088-81-69 в международном формате без "+"

  /* Общий флаг: пользователь просит уменьшить движение — полностью
     отключаем наклон карточек, параллакс и любые JS-анимации ниже. */
  var reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = reduceMotionQuery.matches;

  /* Читаем числовой дизайн-токен из :root, чтобы JS и CSS не расходились. */
  function readRootNumber(varName, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(varName);
    var value = parseFloat(raw);
    return isNaN(value) ? fallback : value;
  }

  /* ------------------------------ Мобильное меню ------------------------------ */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("main-nav");

  function closeNav() {
    if (!mainNav || !navToggle) return;
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ------------------------------ Форма заказа ------------------------------ */
  var orderForm = document.getElementById("orderForm");
  var formStatus = document.getElementById("formStatus");

  if (orderForm) {
    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = (document.getElementById("name") || {}).value || "";
      var phone = (document.getElementById("phone") || {}).value || "";
      var category = (document.getElementById("category") || {}).value || "";
      var message = (document.getElementById("message") || {}).value || "";
      var consent = document.getElementById("consent");

      name = name.trim();
      phone = phone.trim();
      message = message.trim();

      if (!name || !phone) {
        if (formStatus) {
          formStatus.textContent = "Пожалуйста, укажите имя и телефон.";
        }
        return;
      }

      if (consent && !consent.checked) {
        if (formStatus) {
          formStatus.textContent = "Пожалуйста, подтвердите согласие на обработку данных.";
        }
        return;
      }

      var lines = [
        "Здравствуйте! Хочу оформить заявку на Yauza Store.",
        "Имя: " + name,
        "Телефон: " + phone,
        "Категория: " + category
      ];

      if (message) {
        lines.push("Комментарий: " + message);
      }

      var text = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + text;

      if (formStatus) {
        formStatus.textContent = "Открываем WhatsApp в новой вкладке…";
      }

      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  /* ------------------------ 3D-наклон карточек каталога ------------------------ */
  /* На каждой .catalog-card вычисляем позицию курсора относительно центра и
     превращаем её в rotateX/rotateY (±--tilt-max-deg, из :root). Одновременно
     двигаем световой блик (--tilt-glow-x/--tilt-glow-y/--tilt-glow-o) в сторону
     наклона — эффект игры света на грани украшения. */
  var catalogCards = document.querySelectorAll(".catalog-card");

  if (catalogCards.length && !prefersReducedMotion) {
    var TILT_MAX_DEG = readRootNumber("--tilt-max-deg", 7);

    catalogCards.forEach(function (card) {
      function handlePointerMove(e) {
        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var relX = (e.clientX - rect.left) / rect.width;   // 0..1 слева направо
        var relY = (e.clientY - rect.top) / rect.height;   // 0..1 сверху вниз
        var clampedX = Math.min(Math.max(relX, 0), 1);
        var clampedY = Math.min(Math.max(relY, 0), 1);

        var rotateY = (clampedX - 0.5) * 2 * TILT_MAX_DEG;   // курсор справа -> наклон вправо
        var rotateX = (0.5 - clampedY) * 2 * TILT_MAX_DEG;   // курсор сверху -> наклон "к нам"
        var glowStrength = Math.min(
          1,
          (Math.abs(rotateX) + Math.abs(rotateY)) / (TILT_MAX_DEG * 2)
        );

        card.style.transform =
          "rotateX(" + rotateX.toFixed(2) + "deg) " +
          "rotateY(" + rotateY.toFixed(2) + "deg) " +
          "translateY(-6px)";
        card.style.setProperty("--tilt-glow-x", (clampedX * 100).toFixed(1) + "%");
        card.style.setProperty("--tilt-glow-y", (clampedY * 100).toFixed(1) + "%");
        card.style.setProperty("--tilt-glow-o", (0.35 + glowStrength * 0.4).toFixed(2));
      }

      function resetTilt() {
        card.style.transform = "";
        card.style.setProperty("--tilt-glow-o", "0");
      }

      card.addEventListener("mousemove", handlePointerMove);
      card.addEventListener("mouseleave", resetTilt);
      card.addEventListener("blur", resetTilt);
    });
  }

  /* --------------------- Параллакс декоративного фона hero --------------------- */
  /* Двигаем .hero-bg (линии «нити бисера» + свечения) на скролле медленнее, чем
     остальной контент, через requestAnimationFrame — без background-attachment:fixed,
     который плохо ведёт себя на мобильных браузерах. */
  var heroSection = document.querySelector(".hero");
  var heroBg = heroSection ? heroSection.querySelector(".hero-bg") : null;

  if (heroSection && heroBg && !prefersReducedMotion) {
    var PARALLAX_FACTOR = readRootNumber("--parallax-factor", 0.16);
    var PARALLAX_MAX = readRootNumber("--parallax-max", 90);
    var parallaxTicking = false;

    function updateParallax() {
      parallaxTicking = false;

      var rect = heroSection.getBoundingClientRect();
      // Двигаем фон, только пока hero хотя бы частично виден — экономим кадры.
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      var offset = Math.min(window.scrollY * PARALLAX_FACTOR, PARALLAX_MAX);
      heroBg.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
    }

    function onScroll() {
      if (!parallaxTicking) {
        parallaxTicking = true;
        window.requestAnimationFrame(updateParallax);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateParallax();
  }

  /* --------------------------- «Живая» нить бисера --------------------------- */
  /* Сигнатурная нить (.strand) не просто мерцает синхронно (это уже делает CSS-keyframe
     strand-shimmer) — здесь каждая бусина по очереди «вспыхивает» лёгким случайным бликом,
     как будто на неё падает свет витрины. Три источника вспышек:
       1) случайный фоновый мерцающий блик — по одной бусине, с произвольной паузой;
       2) волна блика слева направо, когда нить впервые появляется во вьюпорте при скролле;
       3) та же волна — при наведении курсора на нить.
     Всё отключается при prefers-reduced-motion. */
  var strands = document.querySelectorAll(".strand");

  if (strands.length && !prefersReducedMotion) {
    var FLARE_DURATION = 480; // мс, должно быть меньше паузы между случайными вспышками

    function flareBead(bead) {
      bead.classList.add("flare");
      window.setTimeout(function () {
        bead.classList.remove("flare");
      }, FLARE_DURATION);
    }

    function waveFlare(beads) {
      beads.forEach(function (bead, i) {
        window.setTimeout(function () {
          flareBead(bead);
        }, i * 110);
      });
    }

    strands.forEach(function (strand) {
      var beads = Array.prototype.slice.call(strand.querySelectorAll("span"));
      if (!beads.length) return;

      /* 1) Случайный фоновый блик: рекурсивный setTimeout со случайной паузой,
         чтобы бусины на разных нитях никогда не мигали синхронно/механически. */
      (function scheduleRandomFlare() {
        var delay = 900 + Math.random() * 1900;
        window.setTimeout(function () {
          var bead = beads[Math.floor(Math.random() * beads.length)];
          flareBead(bead);
          scheduleRandomFlare();
        }, delay);
      })();

      /* 2) Волна при первом появлении нити во вьюпорте */
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                waveFlare(beads);
                observer.unobserve(strand);
              }
            });
          },
          { threshold: 0.4 }
        );
        observer.observe(strand);
      }

      /* 3) Волна при наведении курсора — с небольшим троттлингом, чтобы частые
         mouseenter (например, при скролле мышью над нитью) не запускали волну слишком часто. */
      var lastHoverWave = 0;
      strand.addEventListener("mouseenter", function () {
        var now = Date.now();
        if (now - lastHoverWave < FLARE_DURATION + beads.length * 110) return;
        lastHoverWave = now;
        waveFlare(beads);
      });
    });
  }

  /* ------------------- Витринный эффект на фото украшений ------------------- */
  /* «Прожектор» и лёгкие искры на фотографиях (галерея + фото в блоке «О шоуруме»):
     курсор двигает световое пятно (--spot-x/--spot-y/--spot-o из CSS), а рядом с ним
     иногда рождается и гаснет маленькая искра-блик — имитация игры света на украшении. */
  var showcasePhotos = document.querySelectorAll(".gallery-tile:not(.cta), .about-photo");

  if (showcasePhotos.length && !prefersReducedMotion) {
    var SPARKLE_MIN_GAP = 130; // мс между искрами на одном фото
    var SPARKLE_MAX_LIVE = 6; // не более N одновременных искр на одном фото

    showcasePhotos.forEach(function (photo) {
      var lastSparkleAt = 0;

      function spawnSparkle(x, y) {
        if (photo.querySelectorAll(".sparkle").length >= SPARKLE_MAX_LIVE) return;

        var sparkle = document.createElement("span");
        sparkle.className = "sparkle";
        sparkle.setAttribute("aria-hidden", "true");

        var jitterX = (Math.random() - 0.5) * 18;
        var jitterY = (Math.random() - 0.5) * 18;
        var size = 6 + Math.random() * 8;

        sparkle.style.left = (x + jitterX) + "px";
        sparkle.style.top = (y + jitterY) + "px";
        sparkle.style.width = size + "px";
        sparkle.style.height = size + "px";

        photo.appendChild(sparkle);
        window.setTimeout(function () {
          if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
        }, 700);
      }

      function handleMove(e) {
        var rect = photo.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var relX = Math.min(Math.max(x / rect.width, 0), 1);
        var relY = Math.min(Math.max(y / rect.height, 0), 1);

        photo.style.setProperty("--spot-x", (relX * 100).toFixed(1) + "%");
        photo.style.setProperty("--spot-y", (relY * 100).toFixed(1) + "%");
        photo.style.setProperty("--spot-o", "1");

        var now = Date.now();
        if (now - lastSparkleAt > SPARKLE_MIN_GAP) {
          lastSparkleAt = now;
          spawnSparkle(x, y);
        }
      }

      function resetSpotlight() {
        photo.style.setProperty("--spot-o", "0");
      }

      photo.addEventListener("mousemove", handleMove);
      photo.addEventListener("mouseleave", resetSpotlight);
      photo.addEventListener("blur", resetSpotlight);
    });
  }

  /* ------------------------- Год копирайта (страховка) ------------------------- */
  // Год в подвале зафиксирован в HTML (2026) согласно текущей дате запуска сайта.
})();
