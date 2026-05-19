const enableRevealAnimations = true;
const revealInitDelayMs = 1800;

const weddingDate = new Date("2026-07-17T17:00:00+03:00");
// EmailJS configuration
// Service ID (provided by the user)
const emailjsServiceId = "service_el8jd7e";
// TODO: replace the placeholders below with your actual EmailJS template ID and public key.
// You can obtain them in the EmailJS dashboard after creating a service and a template.
// Replace with your actual EmailJS template ID and public key.
const emailjsTemplateId = "template_849m5yd"; // provided by user
const emailjsPublicKey = "K0dTjgHHXCK_EuvQf";   // provided by user

// Note: FormSubmit fallback removed. EmailJS is now the primary submission method.

// Initialize EmailJS SDK once (SDK v4 expects an object with publicKey)
if (typeof emailjs !== "undefined" && emailjs.init) {
  emailjs.init({ publicKey: emailjsPublicKey });
} else {
  console.error("EmailJS SDK not loaded. Include the EmailJS script in index.html.");
  throw new Error("EmailJS SDK not loaded");
}

const countdownRoot = document.querySelector("[data-countdown]");
const countdownUnits = {
  days: countdownRoot ? countdownRoot.querySelector('[data-unit="days"]') : null,
  hours: countdownRoot ? countdownRoot.querySelector('[data-unit="hours"]') : null,
  minutes: countdownRoot ? countdownRoot.querySelector('[data-unit="minutes"]') : null,
  seconds: countdownRoot ? countdownRoot.querySelector('[data-unit="seconds"]') : null,
};

function formatValue(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdownRoot) {
    return;
  }

  if (!countdownUnits.days || !countdownUnits.hours || !countdownUnits.minutes || !countdownUnits.seconds) {
    return;
  }

  const diff = weddingDate.getTime() - Date.now();

  if (diff <= 0) {
    countdownRoot.innerHTML =
      '<p class="hero__text">Этот день уже наступил. Ждём вас на празднике!</p>';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  countdownUnits.days.textContent = formatValue(days);
  countdownUnits.hours.textContent = formatValue(hours);
  countdownUnits.minutes.textContent = formatValue(minutes);
  countdownUnits.seconds.textContent = formatValue(seconds);
}

function buildCalendarFile() {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invite//RU",
    "BEGIN:VEVENT",
    "UID:wedding-evgeniy-darya-20260717@example.com",
    "DTSTAMP:20260409T000000Z",
    "DTSTART:20260717T140000Z",
    "DTEND:20260717T200000Z",
    "SUMMARY:Свадьба Евгения и Дарьи",
    "DESCRIPTION:Будем счастливы разделить этот день вместе с вами.",
    "LOCATION:Бережки Холл, Московская область, Егорьевск, Касимовское шоссе, 45А",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
}

function downloadCalendar() {
  const file = buildCalendarFile();
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);

  link.href = url;
  link.download = "evgeniy-darya-wedding.ics";
  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function initCalendarButtons() {
  document.querySelectorAll("[data-calendar-button]").forEach((button) => {
    button.addEventListener("click", downloadCalendar);
  });
}

function initBackgroundVideo() {
  const video = document.querySelector("[data-background-video]");

  if (!video) {
    return;
  }

  const container = video.closest(".video-background");

  const safePlay = () => {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const restartVideo = () => {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = 0;
    }

    safePlay();
  };

  const markPlaying = () => {
    if (container) {
      container.classList.add("is-playing");
    }
  };

  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;

  video.addEventListener("ended", restartVideo);
  video.addEventListener("loadeddata", markPlaying, { once: true });
  video.addEventListener("playing", markPlaying);
  video.addEventListener("canplay", safePlay);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      safePlay();
    }
  });

  safePlay();
}

function initReveal() {
  if (document.documentElement.classList.contains("reveal-ready")) {
    return;
  }

  const autoRevealGroups = [
    ["#location .section-head > *", 50],
    ["#schedule .timeline__item", 60],
    [".dresscode-card", 80],
    ["#details .details-card", 80],
    ["#details .contact-card", 100],
    ["#rsvp .rsvp-form", 80],
    [".site-footer", 100],
  ];

  autoRevealGroups.forEach(([selector, step]) => {
    document.querySelectorAll(selector).forEach((item, index) => {
      if (item.matches(".reveal, [data-reveal]")) {
        return;
      }

      item.setAttribute("data-reveal", "");
      item.style.setProperty("--reveal-delay", `${index * step}ms`);
    });
  });

  const items = Array.from(document.querySelectorAll(".reveal, [data-reveal]"))
    .filter((item) => !item.closest(".hero") && !item.closest("#welcome"));

  function showItem(item) {
    item.classList.add("is-visible");
  }

  function isAlreadyInView(item) {
    const rect = item.getBoundingClientRect();

    return rect.top < window.innerHeight * 0.88;
  }

  items.forEach((item) => {
    if (isAlreadyInView(item)) {
      showItem(item);
    }
  });

  document.documentElement.classList.add("reveal-ready");

  if (!("IntersectionObserver" in window)) {
    items.forEach(showItem);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showItem(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -60px 0px",
    },
  );

  items.forEach((item) => {
    if (!item.classList.contains("is-visible")) {
      observer.observe(item);
    }
  });
}

function scheduleRevealAnimations() {
  if (!enableRevealAnimations) {
    return;
  }

  window.setTimeout(() => {
    const startReveal = () => initReveal();

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(startReveal, { timeout: 1200 });
      return;
    }

    startReveal();
  }, revealInitDelayMs);
}

function initMobileMenu() {
  const details = document.querySelector(".mobile-menu");

  if (!details) {
    return;
  }

  details.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      details.removeAttribute("open");
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Sends the RSVP payload using EmailJS.
 * The function aborts if EmailJS configuration is missing.
 */
async function sendRsvpPayload(payload) {
  if (emailjsTemplateId === "YOUR_TEMPLATE_ID" || emailjsPublicKey === "YOUR_PUBLIC_KEY") {
    console.warn(
      "EmailJS integration is not configured. Please set emailjsTemplateId and emailjsPublicKey.",
    );
    throw new Error("EmailJS configuration missing");
  }

  // Convert FormData to plain object for EmailJS using the variable names expected by the template
  const templateParams = {
    guest_name: guestName || "Не указано",
    attendance: attendance || "Не указано",
    plus_one: plusOne || "Не указано",
    drinks: drinks.length ? drinks.join(", ") : "Не указано",
    with_child: withChild || "Не указано",
    second_day: secondDay || "Не указано",
    // Optional fields that EmailJS may use
    _subject: `Анкета гостя: ${guestName || "без имени"}`,
    _template: "table",
    _captcha: "false",
    _url: window.location.href,
    _honey: honey,
  };

  if (typeof emailjs !== "undefined" && emailjs.init) {
    // For EmailJS SDK v4, init expects an object with publicKey.
    emailjs.init({ publicKey: emailjsPublicKey });
  } else {
    console.error("EmailJS SDK not loaded. Include the EmailJS script in index.html.");
    throw new Error("EmailJS SDK not loaded");
  }

  try {
    const result = await emailjs.send(emailjsServiceId, emailjsTemplateId, templateParams);
    console.log("EmailJS send result:", result);
    return;
  } catch (error) {
    console.error("EmailJS send error:", error);
    throw error;
  }
}

function initRsvpForm() {
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-form-status]");
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const initialButtonLabel = submitButton ? submitButton.textContent : "";

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (status) {
      status.textContent = "Отправляем анкету...";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Отправляем...";
    }

    const formData = new FormData(form);
    const guestName = (formData.get("guest_name") || "").toString().trim();
    const attendance = (formData.get("attendance") || "").toString().trim();
    const plusOne = (formData.get("plus_one") || "").toString().trim();
    const drinks = formData.getAll("drinks");
    const withChild = (formData.get("with_child") || "").toString().trim();
    const secondDay = (formData.get("second_day") || "").toString().trim();
    const honey = (formData.get("_honey") || "").toString().trim();

    // Build the object that matches the EmailJS template variable names
    const templateParams = {
      guest_name: guestName || "Не указано",
      attendance: attendance || "Не указано",
      plus_one: plusOne || "Не указано",
      drinks: drinks.length ? drinks.join(", ") : "Не указано",
      with_child: withChild || "Не указано",
      second_day: secondDay || "Не указано",
      _subject: `Анкета гостя: ${guestName || "без имени"}`,
      _template: "table",
      _captcha: "false",
      _url: window.location.href,
      _honey: honey,
    };

    try {
      // Directly send the prepared parameters to EmailJS
      await emailjs.send(emailjsServiceId, emailjsTemplateId, templateParams);

      form.reset();

      if (status) {
        status.textContent = "Анкета отправлена. Спасибо, мы всё получили.";
      }
    } catch (error) {
      if (status) {
        const baseMessage =
          window.location.protocol === "file:"
            ? "Автоотправка не сработала из локального файла. Откройте сайт через хостинг или локальный сервер и проверьте настройки EmailJS."
            : "Не удалось отправить анкету через EmailJS. Проверьте подключение к интернету и настройки EmailJS.";
        const errorInfo = error && error.text ? error.text : error.message || String(error);
        status.textContent = `${baseMessage} Ошибка: ${errorInfo}`;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = initialButtonLabel;
      }
    }
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);
initBackgroundVideo();
initCalendarButtons();
scheduleRevealAnimations();
initMobileMenu();
initRsvpForm();
