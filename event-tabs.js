/*
  הלשוניות בעמוד החדש של הד ארצי (hed-artzi.html).
  לחיצה על לשונית: היא נהיית אדומה (is-active), והתוכן שלה (אותו data-tab) מופיע במקום הקודם.
  כמו בעמודי הפרויקטים, הלחיצה נשארת קצת על המסך (is-pressed), גם בלחיצה מהירה.
*/
const eventTabs = document.querySelectorAll(".event-tabs .project-tab");
const eventPanels = document.querySelectorAll(".event-columns");

eventTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    eventTabs.forEach((other) => other.classList.toggle("is-active", other === tab));
    eventPanels.forEach((panel) => {
      const isOpen = panel.dataset.tab === tab.dataset.tab;
      panel.classList.toggle("is-active", isOpen);
      // כל לשונית נפתחת מההתחלה (למעלה)
      if (isOpen) panel.querySelectorAll(".event-column").forEach((column) => (column.scrollTop = 0));
    });
  });

  // מצב לחיצה: לפחות 150 מילישניות
  tab.addEventListener("pointerdown", () => {
    const pressedAt = performance.now();
    tab.classList.add("is-pressed");
    const release = () => {
      const wait = Math.max(0, 150 - (performance.now() - pressedAt));
      setTimeout(() => tab.classList.remove("is-pressed"), wait);
    };
    window.addEventListener("pointerup", release, { once: true });
  });
});

/*
  החץ לפרויקט הבא (כמו בעמוד פרויקט): מחשבים כמה הוא צריך להתארך ב-hover,
  כדי שיגיע בדיוק עד השם של הפרויקט הבא.
*/
const nextArea = document.querySelector(".project-next");
const nextLabel = document.querySelector(".project-next-label");

function measureNextArrow() {
  const labelEnd = nextLabel.offsetLeft + nextLabel.offsetWidth;
  nextArea.style.setProperty("--next-arrow-long", nextArea.clientWidth - labelEnd + "px");
}

document.fonts.ready.then(measureNextArrow); // אחרי שהפונט נטען, כי הוא קובע את רוחב השם
window.addEventListener("resize", measureNextArrow);

// מגיעים מעמוד הבית: המעבר עם הקו לא קיים בעמוד הזה (עדיין), אז מוחקים את מה שעמוד הבית שמר
sessionStorage.removeItem("enter-line");
