/*
  ההתנהגות של העמוד של הד ארצי (hed-artzi.html):
  1. הלשוניות: במעבר בין לשוניות הקו שמימין גולש שמאלה לאורך כל המסך,
     ומביא איתו את הלשונית הבאה (כמו המעבר ל-OVERVIEW).
     אחרי שהקו יוצא משמאל, הוא נכנס בחזרה מימין למקום שלו.
  2. OVERVIEW: הקו גולש שמאלה, וכל החומרים מופיעים בשורה אחת שנגללת הצידה.
     FULL VIEW (משמאל לקו) או Esc מחזירים לתצוגה הרגילה.
  3. החץ לפרויקט הבא.
*/
const eventPage = document.querySelector(".event-page");
const eventTabs = document.querySelectorAll(".event-tabs .project-tab");
const eventPanels = document.querySelectorAll(".event-columns");
const panelsRow = document.querySelector(".event-panels");
const eventLine = document.querySelector(".event-line");

const wipeDuration = 900;       // הקו עובר את כל המסך (מילישניות)
const lineReturnDuration = 500; // הקו נכנס בחזרה מימין
const overviewDuration = 900;   // כמו --duration-overview ב-CSS
const desktopLayout = window.matchMedia("(min-width: 901px) and (orientation: landscape)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const withMotion = () => desktopLayout.matches && !reducedMotion.matches;
const isOverview = () => eventPage.classList.contains("is-overview");

// תנועה רכה: מתחילה לאט, מאיצה ונעצרת לאט (0 עד 1)
const easeInOut = (t) => (1 - Math.cos(Math.PI * t)) / 2;

// אנימציה פשוטה: קוראת ל-onFrame עם ההתקדמות (0 עד 1) בכל פריים
function animate(duration, onFrame, onDone) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    onFrame(progress);
    if (progress < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

// מסמנים איזו לשונית פתוחה (אדומה), ואיזה תוכן שייך לה
function setActiveTab(tabName) {
  eventTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === tabName));
  eventPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.tab === tabName));
}

// כל לשונית נפתחת מההתחלה (למעלה)
function scrollPanelToTop(panel) {
  panel.scrollTop = 0;
  panel.querySelectorAll(".event-column").forEach((column) => (column.scrollTop = 0));
}

/* ---------- 1. מעבר בין לשוניות: כמו המעבר ל-OVERVIEW ----------
   הקו גולש שמאלה לאורך כל המסך, והלשונית החדשה נכנסת מימין, צמודה אליו.
   הלשונית הקודמת גולשת שמאלה ונעלמת (כמו השם ו-OVERVIEW כשנכנסים ל-OVERVIEW).
   אחרי שהקו יוצא משמאל, הוא נכנס בחזרה מימין למקום שלו. */
const easeNext = "cubic-bezier(0.65, 0, 0.35, 1)"; // כמו --ease-next ב-CSS
let isWiping = false;

function switchTab(tabName) {
  const oldPanel = document.querySelector(".event-columns.is-active");
  const newPanel = document.querySelector(`.event-columns[data-tab="${tabName}"]`);
  if (oldPanel === newPanel || isWiping) return;

  setActiveTab(tabName);
  scrollPanelToTop(newPanel);
  if (!withMotion()) return;
  if (eventPage.dataset.tabMotion === "slide") return slideTab(oldPanel, newPanel);

  isWiping = true;
  oldPanel.classList.add("is-leaving"); // הלשונית הקודמת עוד מוצגת בזמן המעבר
  const u = eventPage.clientWidth / 1440;
  const lineTravel = eventLine.getBoundingClientRect().right; // עד שהקו יוצא מהמסך משמאל
  const panelStart = newPanel.getBoundingClientRect().left;
  const panelTravel = eventLine.getBoundingClientRect().right + 40 * u - panelStart; // הלשונית מתחילה ממש מימין לקו

  const lineAway = eventLine.animate([{ transform: "none" }, { transform: `translateX(${-lineTravel}px)` }],
    { duration: wipeDuration, easing: easeNext, fill: "forwards" }); // נשאר בחוץ עד שנכנס מימין
  newPanel.animate([{ transform: `translateX(${panelTravel}px)` }, { transform: "none" }],
    { duration: wipeDuration, easing: easeNext });
  const leaving = oldPanel.animate(
    [{ transform: "none", opacity: 1 }, { transform: `translateX(${(24 - 661) * u}px)`, opacity: 0 }],
    { duration: wipeDuration, easing: easeNext });

  leaving.onfinish = () => {
    oldPanel.classList.remove("is-leaving");
    // הקו נכנס בחזרה מימין למקום שלו
    lineAway.cancel();
    const outsideRight = eventPage.clientWidth - eventLine.getBoundingClientRect().left;
    const back = eventLine.animate([{ transform: `translateX(${outsideRight}px)` }, { transform: "none" }],
      { duration: lineReturnDuration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    back.onfinish = () => (isWiping = false);
  };
}

/* ---------- מעבר פשוט בין לשוניות (בעמוד עם data-tab-motion="slide", למשל VIEW) ----------
   התוכן הנוכחי גולש הצידה, והלשונית החדשה צמודה אליו מהצד השני ונחשפת, בלי שהן עולות זו על זו.
   ללשונית שמימין: הכל זז שמאלה. ללשונית שמשמאל: הכל זז ימינה.
   בזמן המעבר (is-sliding) התוכן נחתך בקו שמימין, כדי שלא יעבור מעליו. */
const slideDuration = 800;

function slideTab(oldPanel, newPanel) {
  const tabNames = [...eventTabs].map((tab) => tab.dataset.tab);
  const forward = tabNames.indexOf(newPanel.dataset.tab) > tabNames.indexOf(oldPanel.dataset.tab);
  const u = eventPage.clientWidth / 1440;
  const distance = (1399 - 33) * u * (forward ? 1 : -1); // מתחילת התוכן ועד הקו

  isWiping = true;
  eventPage.classList.add("is-sliding");
  oldPanel.classList.add("is-leaving"); // הלשונית הקודמת עוד מוצגת בזמן המעבר
  const options = { duration: slideDuration, easing: easeNext };
  newPanel.animate([{ transform: `translateX(${distance}px)` }, { transform: "none" }], options);
  const leaving = oldPanel.animate([{ transform: "none" }, { transform: `translateX(${-distance}px)` }], options);

  leaving.onfinish = () => {
    oldPanel.classList.remove("is-leaving");
    eventPage.classList.remove("is-sliding");
    isWiping = false;
  };
}

eventTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (isOverview()) {
      setActiveTab(tab.dataset.tab);
      scrollRowTo(tab.dataset.tab);
    } else {
      switchTab(tab.dataset.tab);
    }
  });
});

/* ---------- 2. OVERVIEW ---------- */
const overviewButton = document.querySelector(".overview-button");
const fullViewButton = document.querySelector(".full-view");

const tabsNav = document.querySelector(".event-tabs");

// כמה הלשוניות זזות ב-OVERVIEW: מהמקום הרגיל שלהן אל 122 (מימין לקו, כמו בעמוד פרויקט)
function measureTabsShift() {
  const u = eventPage.clientWidth / 1440;
  eventPage.style.setProperty("--overview-tabs-shift", 122 * u - tabsNav.getBoundingClientRect().left + "px");
}

// הקו זז בין הצד הימני (1399) לשמאלי (80), והתוכן זז איתו, כמו העמודה הימנית בעמוד פרויקט
function lineDistance() {
  const u = eventPage.clientWidth / 1440;
  return (1399 - 80) * u;
}

function setOverview(open) {
  if (isWiping || open === isOverview()) return;
  if (open) measureTabsShift();
  eventPage.classList.toggle("is-overview", open);
  if (open) scrollRowTo(document.querySelector(".project-tab.is-active").dataset.tab, "instant");
  else scrollPanelToTop(document.querySelector(".event-columns.is-active"));
  if (!withMotion()) return;
  const easing = "cubic-bezier(0.65, 0, 0.35, 1)"; // כמו --ease-next ב-CSS
  if (open) {
    // השורה נכנסת מימין, צמודה לקו שגולש שמאלה
    panelsRow.animate([{ transform: `translateX(${lineDistance()}px)` }, { transform: "none" }], { duration: overviewDuration, easing });
  } else {
    // הלשונית נכנסת משמאל, אחרי הקו שגולש ימינה
    document.querySelector(".event-columns.is-active").animate(
      [{ transform: `translateX(${-lineDistance()}px)` }, { transform: "none" }],
      { duration: overviewDuration, easing }
    );
  }
}

window.addEventListener("resize", () => {
  if (!isOverview()) return;
  eventPage.classList.remove("is-overview"); // מודדים במקום הרגיל, וחוזרים
  tabsNav.style.transition = "none";
  measureTabsShift();
  eventPage.classList.add("is-overview");
  tabsNav.offsetWidth;
  tabsNav.style.transition = "";
});

// בעמוד בלי OVERVIEW (למשל VIEW) אין את הכפתורים האלה
if (overviewButton) overviewButton.addEventListener("click", () => setOverview(true));
if (fullViewButton) fullViewButton.addEventListener("click", () => setOverview(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isOverview()) setOverview(false);
});

// איפה מתחילים החומרים של לשונית בתוך השורה
function panelStart(panel) {
  return panel.querySelector(".work-item").offsetLeft - parseFloat(getComputedStyle(panelsRow).paddingLeft);
}

// גלילה של השורה אל החומרים של לשונית: בתנועה רכה (או מיד, כשנכנסים ל-OVERVIEW)
let rowScrolling = false;

function scrollRowTo(tabName, behavior = "smooth") {
  const panel = document.querySelector(`.event-columns[data-tab="${tabName}"]`);
  const maxScroll = panelsRow.scrollWidth - panelsRow.clientWidth;
  const target = Math.max(0, Math.min(panelStart(panel), maxScroll));

  if (behavior === "instant") {
    panelsRow.scrollLeft = target;
    return;
  }
  const start = panelsRow.scrollLeft;
  rowScrolling = true;
  animate(overviewDuration, (progress) => {
    panelsRow.scrollLeft = start + (target - start) * easeInOut(progress);
  }, () => (rowScrolling = false));
}

// בזמן הגלילה: הלשונית של החומרים שנמצאים עכשיו בתחילת השורה נהיית אדומה
panelsRow.addEventListener("scroll", () => {
  if (!isOverview() || rowScrolling) return;
  let current = eventPanels[0];
  eventPanels.forEach((panel) => {
    if (panelStart(panel) <= panelsRow.scrollLeft + 40) current = panel;
  });
  // בסוף השורה: הלשונית האחרונה
  if (panelsRow.scrollLeft + panelsRow.clientWidth >= panelsRow.scrollWidth - 2) {
    current = eventPanels[eventPanels.length - 1];
  }
  setActiveTab(current.dataset.tab);
});

// גלגלת רגילה של העכבר (למעלה ולמטה) גוללת את השורה הצידה
panelsRow.addEventListener("wheel", (event) => {
  if (!isOverview() || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  event.preventDefault();
  panelsRow.scrollLeft += event.deltaY;
}, { passive: false });

/* ---------- מצב לחיצה על הלשוניות ועל OVERVIEW: לפחות 150 מילישניות ---------- */
document.querySelectorAll(".event-tabs .project-tab, .overview-button").forEach((button) => {
  button.addEventListener("pointerdown", () => {
    const pressedAt = performance.now();
    button.classList.add("is-pressed");
    const release = () => {
      const wait = Math.max(0, 150 - (performance.now() - pressedAt));
      setTimeout(() => button.classList.remove("is-pressed"), wait);
    };
    window.addEventListener("pointerup", release, { once: true });
  });
});

/* ---------- 3. החץ לפרויקט הבא ----------
   מחשבים כמה הוא צריך להתארך ב-hover, כדי שיגיע בדיוק עד השם של הפרויקט הבא. */
const nextArea = document.querySelector(".project-next");
const nextLabel = document.querySelector(".project-next-label");

function measureNextArrow() {
  const labelEnd = nextLabel.offsetLeft + nextLabel.offsetWidth;
  nextArea.style.setProperty("--next-arrow-long", nextArea.clientWidth - labelEnd + "px");
}

document.fonts.ready.then(measureNextArrow); // אחרי שהפונט נטען, כי הוא קובע את רוחב השם
window.addEventListener("resize", measureNextArrow);

/* ---------- מגיעים מעמוד הבית (הסקריפט הקטן בראש העמוד מוסיף is-entering) ----------
   הקו ממשיך מהאמצע ויורד לגובה שלו, ואז זז ימינה למקום שלו. התוכן עולה מלמטה. */
const enterTotal = 1400; // הירידה (1 שנייה), והתזוזה ימינה שמתחילה אחרי חצי שנייה (0.9)
const root = document.documentElement;

if (root.classList.contains("is-entering")) {
  sessionStorage.removeItem("enter-line"); // ברענון של העמוד המעבר לא חוזר
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add("is-arriving");
    root.classList.remove("is-entering");
  }));
  setTimeout(() => root.classList.remove("is-arriving"), enterTotal);
}

// חזרה לעמוד בכפתורים של הדפדפן: בלי מעבר
sessionStorage.removeItem("enter-line");

/* ---------- בטלפון: כמו בעמוד פרויקט ----------
   INFO ו-GALLERY, סגירה ופתיחה של חלקים בגלריה, והופעה של החומרים בגלילה. */
const mobileLayout = window.matchMedia("(max-width: 900px), (orientation: portrait)");
const sectionButtons = document.querySelector(".section-buttons");
const sectionBar = document.querySelector(".event-header");
const infoButton = document.querySelector(".section-button--info");
const galleryButton = document.querySelector(".section-button--gallery");
const gallery = document.getElementById("gallery");

// נמצאים בגלריה? (הגלריה הגיעה עד מתחת לבר שלמעלה)
function isInGallery() {
  const barBottom = document.querySelector(".event-header").getBoundingClientRect().bottom;
  return gallery.getBoundingClientRect().top <= barBottom + 10;
}

// הכפתור של החלק שבו נמצאים מראה את השם שלו. כשהוא מתחלף, הוא מהבהב לרגע בצבע של הפרויקט
let flashTimer = null;

function updateSectionButtons() {
  const nowInGallery = isInGallery();
  if (sectionButtons.classList.contains("is-in-gallery") === nowInGallery) return;
  sectionButtons.classList.toggle("is-in-gallery", nowInGallery);
  sectionBar.classList.toggle("is-in-gallery", nowInGallery); // בגלריה השם נעלם
  const current = nowInGallery ? galleryButton : infoButton;
  [infoButton, galleryButton].forEach((button) => button.classList.remove("is-flash"));
  current.classList.add("is-flash");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => current.classList.remove("is-flash"), 350);
}

window.addEventListener("scroll", updateSectionButtons, { passive: true });
sectionButtons.classList.toggle("is-in-gallery", isInGallery()); // בטעינה: בלי הבהוב
sectionBar.classList.toggle("is-in-gallery", isInGallery());
/*
  בטלפון: שם הפרויקט בבר (רק למעלה, בטקסט. בגלריה הוא נעלם).
  השם יושב בין הכפתורים לחץ החזרה, עם אותו רווח (12) מכל צד, כמו בין הכפתורים.
  אם אין לו מספיק מקום בגודל 20, הוא מוקטן בדיוק כדי להיכנס (--title-size).
*/
const barTitle = sectionBar.querySelector(".project-header__title");
const titleSize = 20; // הגודל הרגיל של השם
const titleGap = 12;  // הרווח מהכפתורים (כמו הרווח בין הכפתורים)

function measureTitleRoom() {
  // מודדים את הכפתורים במצב של הטקסט (לרגע, בלי תנועה)
  const wasInGallery = sectionButtons.classList.contains("is-in-gallery");
  sectionButtons.classList.remove("is-in-gallery");
  sectionButtons.classList.add("is-measuring");
  const buttonsEnd = sectionButtons.getBoundingClientRect().right;
  sectionButtons.classList.toggle("is-in-gallery", wasInGallery);
  sectionButtons.classList.remove("is-measuring");

  // השם נגמר במקום קבוע (12 לפני החץ), אז המקום שלו: מסוף הכפתורים (ועוד 12) ועד שם
  const titleBox = barTitle.getBoundingClientRect();
  const titleWidth = titleBox.width * titleSize / parseFloat(getComputedStyle(barTitle).fontSize); // הרוחב בגודל 20
  const room = titleBox.right - (buttonsEnd + titleGap);
  sectionBar.style.setProperty("--title-size", Math.min(titleSize, titleSize * room / titleWidth) + "px");
}

document.fonts.ready.then(measureTitleRoom); // אחרי שהפונטים נטענו, כי הם קובעים את הרוחב
window.addEventListener("resize", measureTitleRoom);


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
document.querySelectorAll(".panel-title").forEach((title) => {
  const panel = title.closest(".event-columns");

  title.addEventListener("click", () => {
    const closing = !panel.classList.contains("is-closed");
    const startHeight = panel.offsetHeight;

    // מודדים את הגובה בסוף: סוגרים או פותחים לרגע
    panel.classList.toggle("is-closed", closing);
    const endHeight = panel.offsetHeight;
    title.setAttribute("aria-expanded", String(!closing));
    if (reducedMotion.matches) return;

    // בזמן התנועה החומרים עוד מוצגים, והחלק "מכסה" או "חושף" אותם
    panel.classList.remove("is-closed");
    panel.style.overflow = "hidden";
    const motion = panel.animate(
      [{ height: startHeight + "px" }, { height: endHeight + "px" }],
      { duration: 500, easing: easeNext }
    );
    motion.onfinish = () => {
      panel.classList.toggle("is-closed", closing);
      panel.style.overflow = "";
    };
  });
});

// בגלילה: כל חומר עולה ומופיע בהדרגה (כמו בעמוד פרויקט)
if (mobileLayout.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      entry.target.style.setProperty("--reveal-delay", index * 0.12 + "s"); // כמה יחד: אחד אחרי השני
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target); // מופיע פעם אחת
    });
  });

  document.querySelectorAll(
    ".event-page :is(.project-headline, .event-about__text p, .work-caption, .event-media, .work-crop, .work-collage, .hed-voice)"
  ).forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });
}
