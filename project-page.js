/*
  ההתנהגות של עמוד פרויקט (משותף לכל עמודי הפרויקטים):
  הלשוניות, הופעת התוכן, תצוגת OVERVIEW והחץ לפרויקט הבא.

  הלשוניות: בתצוגה הרגילה לחיצה פותחת את התוכן של הלשונית.
  במצב OVERVIEW לחיצה גוללת את השורה אל החומרים של הלשונית.
*/
const projectPage = document.querySelector(".project-page");
const projectTabs = document.querySelectorAll(".project-tab");
const projectPanels = document.querySelectorAll(".project-panel");
const panelsRow = document.querySelector(".project-panels");

const isOverview = () => projectPage.classList.contains("is-overview");

// מסמנים איזו לשונית פתוחה (ירוקה), ואיזה תוכן שייך לה
function setActiveTab(tabName) {
  projectTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === tabName));
  projectPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.tab === tabName));
}

projectTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.tab);
    if (isOverview()) {
      scrollRowTo(tab.dataset.tab);
    } else {
      replayReveal(document.querySelector(".project-panel.is-active").querySelectorAll(".reveal"));
    }
  });
});

/*
  הופעת התוכן: כל אלמנט תוכן (לא הבר העליון) עולה מלמטה ומופיע כשהוא נכנס למסך.
  אלמנטים שנכנסים יחד מופיעים אחד אחרי השני.
*/
const revealItems = document.querySelectorAll(
  ".project-cover, .project-headline, .project-text p, .work-caption, .work-video, .work-image, .work-poster, .work-collage, .work-crop, .hed-voice"
);
const revealStep = 0.12; // כמה שניות בין אלמנט לאלמנט

const revealObserver = new IntersectionObserver((entries) => {
  const entering = entries.filter((entry) => entry.isIntersecting);
  entering.forEach((entry, index) => {
    entry.target.style.setProperty("--reveal-delay", index * revealStep + "s");
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target); // מופיע פעם אחת
  });
});

revealItems.forEach((item) => item.classList.add("reveal"));

function startReveal() {
  revealItems.forEach((item) => revealObserver.observe(item));
}

/*
  מגיעים מעמוד הבית (הסקריפט הקטן בראש העמוד מוסיף is-entering):
  הגלילה ממשיכה. הקו כבר לכל הגובה, איפה שהקו של עמוד הבית נגמר, ונכנס בעדינות למקום שלו,
  והעמודות עולות מלמטה ונעצרות במקום שלהן. התוכן מופיע תוך כדי.
*/
const enterDuration = 1000; // כמו --duration-page-in ב-CSS
const root = document.documentElement;

if (root.classList.contains("is-entering")) {
  sessionStorage.removeItem("enter-line"); // ברענון של העמוד המעבר לא חוזר
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add("is-arriving");
    root.classList.remove("is-entering");
  }));
  setTimeout(startReveal, enterDuration / 4);
  setTimeout(() => root.classList.remove("is-arriving"), enterDuration);
} else {
  startReveal();
}

// כשפותחים לשונית או את OVERVIEW: התוכן מופיע מחדש באותה תנועה
function replayReveal(items) {
  items.forEach((item) => {
    item.style.transition = "none";      // נעלם מיד (בלי אנימציה)...
    item.classList.remove("is-visible");
  });
  document.body.offsetHeight;            // (הדפדפן מעדכן את המסך)
  items.forEach((item) => {
    item.style.transition = "";          // ...ואז עולה ומופיע שוב בעדינות
    revealObserver.observe(item);
  });
}

/*
  OVERVIEW: העמודה השמאלית נעלמת, הקו גולש שמאלה,
  וכל החומרים מופיעים בשורה אחת שנגללת הצידה.
  החץ שמשמאל לקו (או מקש Esc) מחזיר לתצוגה הרגילה.
*/
const overviewButton = document.querySelector(".overview-button");
const fullViewButton = document.querySelector(".full-view");
const overviewDuration = 900; // כמו --duration-overview ב-CSS

// לחיצה: הקו גולש והכל זז איתו (ב-CSS), והחומרים עולים ומופיעים במקום החדש
function setOverview(open) {
  projectPage.classList.toggle("is-overview", open);
  if (open) scrollRowTo(document.querySelector(".project-tab.is-active").dataset.tab, "instant");
  replayReveal(document.querySelectorAll(".project-panel.is-active .reveal, .is-overview .project-panels .reveal"));
  setTimeout(measureNextArrow, overviewDuration); // העמודה הימנית שינתה רוחב
}

overviewButton.addEventListener("click", () => setOverview(true));
fullViewButton.addEventListener("click", () => setOverview(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isOverview()) setOverview(false);
});

// גלילה של השורה אל החומרים של לשונית: בתנועה רכה (או מיד, כשנכנסים ל-OVERVIEW)
const rowScrollDuration = 900; // כמה זמן לוקחת הגלילה, במילישניות
let rowScrollAnimation = null;

function scrollRowTo(tabName, behavior = "smooth") {
  const panel = document.querySelector(`.project-panel[data-tab="${tabName}"]`);
  const rowPadding = parseFloat(getComputedStyle(panelsRow).paddingLeft); // הרווח בתחילת השורה
  const maxScroll = panelsRow.scrollWidth - panelsRow.clientWidth;
  const target = Math.min(panel.offsetLeft - panelsRow.offsetLeft - rowPadding, maxScroll);

  cancelAnimationFrame(rowScrollAnimation);
  if (behavior === "instant") {
    panelsRow.scrollLeft = target;
    return;
  }

  const start = panelsRow.scrollLeft;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / rowScrollDuration, 1);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2; // ease-in-out רך
    panelsRow.scrollLeft = start + (target - start) * eased;
    rowScrollAnimation = progress < 1 ? requestAnimationFrame(step) : null;
  }
  rowScrollAnimation = requestAnimationFrame(step);
}

// בזמן הגלילה: הלשונית של החומרים שנמצאים עכשיו בתחילת השורה נהיית ירוקה
panelsRow.addEventListener("scroll", () => {
  if (!isOverview() || rowScrollAnimation) return; // בזמן גלילה מלחיצה על לשונית, הלשונית כבר ירוקה
  const rowStart = panelsRow.scrollLeft + panelsRow.offsetLeft + 40;
  let current = projectPanels[0];
  projectPanels.forEach((panel) => {
    if (panel.offsetLeft <= rowStart) current = panel;
  });
  // בסוף השורה: הלשונית האחרונה
  if (panelsRow.scrollLeft + panelsRow.clientWidth >= panelsRow.scrollWidth - 2) {
    current = projectPanels[projectPanels.length - 1];
  }
  setActiveTab(current.dataset.tab);
});

// גלגלת רגילה של העכבר (למעלה ולמטה) גוללת את השורה הצידה
panelsRow.addEventListener("wheel", (event) => {
  cancelAnimationFrame(rowScrollAnimation); // אם גוללים בעצמנו, התנועה מהלשונית נעצרת
  rowScrollAnimation = null;
  if (!isOverview() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  event.preventDefault();
  panelsRow.scrollLeft += event.deltaY;
}, { passive: false });


/*
  החץ לפרויקט הבא: מחשבים כמה הוא צריך להתארך ב-hover,
  כדי שיגיע בדיוק עד השם של הפרויקט הבא (הרווח ביניהם הוא חלק מהשם, ב-CSS).
*/
const nextArea = document.querySelector(".project-next");
const nextLabel = document.querySelector(".project-next-label");

function measureNextArrow() {
  const labelEnd = nextLabel.offsetLeft + nextLabel.offsetWidth;
  nextArea.style.setProperty("--next-arrow-long", nextArea.clientWidth - labelEnd + "px");
}

document.fonts.ready.then(measureNextArrow); // אחרי שהפונט נטען, כי הוא קובע את רוחב השם
window.addEventListener("resize", measureNextArrow);

/* ---------- לחיצה על כפתור ----------
   בזמן הלחיצה הכפתור מתמלא בצבע (ב-CSS: .is-pressed).
   המצב נשאר לפחות 150 מילישניות, כדי שגם בלחיצה מהירה רואים אותו. */
const pressMinimum = 150;

document.querySelectorAll(".overview-button, .project-tab").forEach((button) => {
  let pressedAt = 0;

  button.addEventListener("pointerdown", () => {
    pressedAt = performance.now();
    button.classList.add("is-pressed");
  });

  const release = () => {
    const wait = Math.max(0, pressMinimum - (performance.now() - pressedAt));
    setTimeout(() => button.classList.remove("is-pressed"), wait);
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});

/* ---------- חזרה לעמוד הבית ----------
   אותה גלילה כמו בכניסה, רק הפוך (רק במחשב, ורק אם לא ביקשו פחות תנועה):
   העמודות יורדות ויוצאות מהמסך, והקו נמתח לכל הגובה, בדיוק במקום של הקו של עמוד הבית.
   שם הגלילה ממשיכה: הכותרת והקו יורדים למקום שלהם. */
const homeLink = document.querySelector(".project-home");
const exitDuration = 600; // כמו --duration-page-out ב-CSS
const pageDesktopLayout = window.matchMedia("(min-width: 901px) and (orientation: landscape)");
const pageReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

homeLink.addEventListener("click", (event) => {
  if (!pageDesktopLayout.matches || pageReducedMotion.matches) return; // מעבר רגיל
  event.preventDefault();

  // איפה הקו בעמוד הבית: באמצע המסך, ברוחב 6 (u של עמוד הבית: לפי הרוחב או הגובה, הקטן מביניהם)
  const screenWidth = root.clientWidth;
  const homeU = Math.min(screenWidth / 1440, root.clientHeight / 1024);
  const lineWidth = Math.max(2, 6 * homeU);
  root.style.setProperty("--exit-line-left", screenWidth / 2 - lineWidth / 2 + "px");
  root.style.setProperty("--exit-line-width", lineWidth + "px");
  root.classList.add("is-leaving-page");

  setTimeout(() => {
    sessionStorage.setItem("return-home", "yes");
    window.location.href = homeLink.href;
  }, exitDuration);
});

// חזרה לעמוד הזה בכפתור "קדימה" של הדפדפן: העמוד חוזר למצב הרגיל
window.addEventListener("pageshow", (event) => {
  if (event.persisted) root.classList.remove("is-leaving-page");
});

/* ---------- בטלפון: INFO ו-GALLERY, וסגירה ופתיחה של חלקים בגלריה ---------- */
const sectionButtons = document.querySelector(".section-buttons");
const infoButton = document.querySelector(".section-button--info");
const galleryButton = document.querySelector(".section-button--gallery");
const gallery = document.getElementById("gallery");

// נמצאים בגלריה? (הגלריה הגיעה עד מתחת לבר שלמעלה)
function isInGallery() {
  const barBottom = document.querySelector(".project-header").getBoundingClientRect().bottom;
  return gallery.getBoundingClientRect().top <= barBottom + 10;
}

// הכפתור של החלק שבו נמצאים מראה את השם שלו. כשהוא מתחלף, הוא מהבהב לרגע בצבע של הפרויקט
let flashTimer = null;

function updateSectionButtons() {
  const nowInGallery = isInGallery();
  if (sectionButtons.classList.contains("is-in-gallery") === nowInGallery) return;
  sectionButtons.classList.toggle("is-in-gallery", nowInGallery);
  const current = nowInGallery ? galleryButton : infoButton;
  [infoButton, galleryButton].forEach((button) => button.classList.remove("is-flash"));
  current.classList.add("is-flash");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => current.classList.remove("is-flash"), 350);
}

window.addEventListener("scroll", updateSectionButtons, { passive: true });
sectionButtons.classList.toggle("is-in-gallery", isInGallery()); // בטעינה: בלי הבהוב

// INFO: חוזרים לתחילת העמוד. GALLERY: גוללים אל הגלריה
infoButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
galleryButton.addEventListener("click", () => gallery.scrollIntoView({ behavior: "smooth" }));

// לחיצה: הכפתור צבוע כל עוד לוחצים (ולפחות 150 מילישניות, כדי שיראו את זה גם בהקשה מהירה)
[infoButton, galleryButton].forEach((button) => {
  button.addEventListener("pointerdown", () => {
    const pressedAt = performance.now();
    button.classList.add("is-pressed");
    const release = () => {
      const wait = Math.max(0, 150 - (performance.now() - pressedAt));
      setTimeout(() => button.classList.remove("is-pressed"), wait);
    };
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
  });
});

// הקשה על השם של חלק בגלריה: החלק נסגר (נשאר רק השם) או נפתח, בתנועה רכה
const panelDuration = 500;
const panelEasing = "cubic-bezier(0.65, 0, 0.35, 1)"; // כמו --ease-next ב-CSS

document.querySelectorAll(".panel-title").forEach((title) => {
  const panel = title.closest(".project-panel");

  title.addEventListener("click", () => {
    const closing = !panel.classList.contains("is-closed");
    const startHeight = panel.offsetHeight;

    // מודדים את הגובה בסוף: סוגרים או פותחים לרגע
    panel.classList.toggle("is-closed", closing);
    const endHeight = panel.offsetHeight;
    title.setAttribute("aria-expanded", String(!closing));
    if (pageReducedMotion.matches) return;

    // בזמן התנועה החומרים עוד מוצגים, והחלק "מכסה" או "חושף" אותם
    panel.classList.remove("is-closed");
    panel.style.overflow = "hidden";
    const motion = panel.animate(
      [{ height: startHeight + "px" }, { height: endHeight + "px" }],
      { duration: panelDuration, easing: panelEasing }
    );
    motion.onfinish = () => {
      panel.classList.toggle("is-closed", closing);
      panel.style.overflow = "";
    };
  });
});
