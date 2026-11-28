/*
  עמוד About & Contact: OVERVIEW.
  לחיצה על OVERVIEW: מימין לקו מופיעות עבודות נבחרות (is-works-open). לחיצה נוספת או Esc סוגרות.
  לחיצה על עבודה: העמוד יורד ויוצא מהמסך, הקו נמתח לכל הגובה,
  ועמוד הפרויקט ממשיך מאותו קו (כמו במעבר מעמוד הבית).
*/
const aboutPage = document.querySelector(".about-page");
const overviewButton = document.querySelector(".about-overview");
const works = document.querySelector(".about-works");
const workVideos = works.querySelectorAll("video");
const divider = document.querySelector(".project-divider");

/*
  המספרים (1 >) והסדר של הכניסה: משמאל לימין, ואז שורה למטה
  (הראשונה בעמודה השמאלית, הראשונה בימנית, השנייה בשמאלית...).
  כל עבודה נכנסת קצת אחרי הקודמת.
*/
const workStep = 0.09; // שניות בין עבודה לעבודה
const columns = [...works.querySelectorAll(".about-works__column")].map((column) => [...column.children]);
const longestColumn = Math.max(...columns.map((column) => column.length));
let workNumber = 0;

for (let row = 0; row < longestColumn; row++) {
  for (const column of columns) {
    const work = column[row];
    if (!work) continue;
    work.querySelector(".about-work__number").textContent = `${workNumber + 1} >`;
    work.style.setProperty("--work-delay", workNumber * workStep + "s");
    workNumber++;
  }
}

// פתיחה וסגירה. הסרטונים רצים רק כשרואים אותם
function setWorksOpen(open) {
  aboutPage.classList.toggle("is-works-open", open);
  overviewButton.setAttribute("aria-expanded", open);
  workVideos.forEach((video) => (open ? video.play().catch(() => {}) : video.pause()));
}

overviewButton.addEventListener("click", () => {
  setWorksOpen(!aboutPage.classList.contains("is-works-open"));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setWorksOpen(false);
});

/* ---------- לחיצה על עבודה: מעבר לעמוד של הפרויקט ---------- */
const root = document.documentElement;
const exitDuration = 600; // כמו --duration-page-out ב-CSS
const desktopLayout = window.matchMedia("(min-width: 901px) and (orientation: landscape)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

works.querySelectorAll(".about-work").forEach((work) => {
  work.addEventListener("click", (event) => {
    if (!desktopLayout.matches || reducedMotion.matches) return; // מעבר רגיל
    event.preventDefault();

    // הקו נשאר במקום שלו ונמתח לכל הגובה
    const lineBox = divider.getBoundingClientRect();
    root.style.setProperty("--exit-line-left", lineBox.left + "px");
    root.style.setProperty("--exit-line-width", lineBox.width + "px");
    root.classList.add("is-leaving-page");

    // עמוד הפרויקט ימשיך מאותו קו (כמו כשמגיעים מעמוד הבית)
    setTimeout(() => {
      sessionStorage.setItem("enter-line", JSON.stringify({ left: lineBox.left, width: lineBox.width }));
      window.location.href = work.href;
    }, exitDuration);
  });
});

// חזרה לעמוד הזה בכפתור "אחורה" של הדפדפן: העמוד חוזר למצב הרגיל
window.addEventListener("pageshow", (event) => {
  if (event.persisted) root.classList.remove("is-leaving-page");
});
