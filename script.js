const weddingDate = new Date("2026-07-17T17:00:00+03:00");
const targetEmail = "metkau22@gmail.com";
const formEndpoint = `https://formsubmit.co/ajax/${targetEmail}`;

const countdownRoot = document.querySelector("[data-countdown]");
const countdownUnits = {
  days: countdownRoot?.querySelector('[data-unit="days"]'),
  hours: countdownRoot?.querySelector('[data-unit="hours"]'),
  minutes: countdownRoot?.querySelector('[data-unit="minutes"]'),
  seconds: countdownRoot?.querySelector('[data-unit="seconds"]'),
};

function formatValue(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdownRoot) {
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

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  items.forEach((item) => observer.observe(item));
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

function initRsvpForm() {
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-form-status]");
  const submitButton = form?.querySelector('button[type="submit"]');
  const initialButtonLabel = submitButton?.textContent ?? "";

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
    const allergies = (formData.get("allergies") || "").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();
    const honey = (formData.get("_honey") || "").toString().trim();

    const payload = new FormData();
    payload.append("Имя гостя", guestName || "Не указано");
    payload.append("Присутствие", attendance || "Не указано");
    payload.append("Спутник или спутница", plusOne || "Не указано");
    payload.append("Напитки", drinks.length ? drinks.join(", ") : "Не указано");
    payload.append("Аллергии и ограничения", allergies || "Нет");
    payload.append("Комментарий", notes || "Нет");
    payload.append("_subject", `Анкета гостя: ${guestName || "без имени"}`);
    payload.append("_template", "table");
    payload.append("_url", window.location.href);
    payload.append("_honey", honey);

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      form.reset();

      if (status) {
        status.textContent = "Анкета отправлена. Спасибо, мы всё получили.";
      }
    } catch (error) {
      if (status) {
        status.textContent =
          window.location.protocol === "file:"
            ? "Автоотправка не сработала из локального файла. Откройте сайт через хостинг или локальный сервер и подтвердите первое письмо от FormSubmit на metkau22@gmail.com."
            : "Не получилось отправить анкету автоматически. Проверьте подключение к интернету и подтвердите первое письмо от FormSubmit на metkau22@gmail.com.";
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
initCalendarButtons();
initReveal();
initMobileMenu();
initRsvpForm();
