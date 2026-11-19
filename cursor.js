/*
  העכבר של האתר: עיגול לבן במקום החץ הרגיל.
  כשהוא מגיע למשהו לחיץ (קישור, כפתור, לשונית, החץ לפרויקט הבא), הוא נצבע בירוק באנימציה.
  העיגול במצב "exclusion": על רקע שחור הוא לבן, ועל משהו ירוק הוא נהיה שחור.
  פועל רק במחשב עם עכבר (לא בטלפון).
*/
const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (hasMouse) {
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-custom-cursor");

  // מה נחשב לחיץ
  const clickableSelector = "a[href], button, .project-next__arrow, .project-next-label";

  // העיגול זז עם העכבר
  window.addEventListener("mousemove", (event) => {
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    cursor.classList.add("is-shown");

    const target = event.target.closest(clickableSelector);
    cursor.classList.toggle("is-on-clickable", Boolean(target));
  });

  // כשהעכבר יוצא מהחלון, העיגול נעלם
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-shown"));
}
