/* ==========================================================================
   Yauza Store — vanilla JS, без зависимостей и сборки.
   1) Мобильное меню
   2) Форма предзаказа -> формирование ссылки wa.me и открытие в новой вкладке
   3) Плавное закрытие меню при переходе по якорю
   ========================================================================== */

(function () {
  "use strict";

  var WHATSAPP_PHONE = "79670888169"; // +7 967 088-81-69 в международном формате без "+"

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

  /* ------------------------- Год копирайта (страховка) ------------------------- */
  // Год в подвале зафиксирован в HTML (2026) согласно текущей дате запуска сайта.
})();
