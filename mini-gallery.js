/*
  הגלריות הקטנות (בעמוד DAROM FILM FESTIVAL: הפוסטרים, והחוברת ב-PROGRAM):
  למטה רואים רק את התמונות שלא מוצגות למעלה.
  לחיצה על תמונה קטנה מקפיצה אותה למעלה בגדול (התמונה הקודמת נעלמת בהדרגה),
  והתמונה שהייתה למעלה חוזרת לשורה של הקטנות.
  אם יש כיתוב מעל התמונה הגדולה, הוא מתעדכן: המספר (1\5 >) והשם (data-caption).
  אם לתמונה יש data-ratio (בעמוד ILLUSTRATION & OTHER), המסגרת מקבלת את הפרופורציות שלה.
*/
document.querySelectorAll(".mini-gallery").forEach((gallery) => {
  const bigImages = gallery.querySelectorAll(".mini-gallery__main img");
  const thumbs = gallery.querySelectorAll(".mini-gallery__thumb");
  const count = gallery.querySelector(".mini-gallery__count");
  const text = gallery.querySelector(".mini-gallery__text");

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      bigImages.forEach((image, i) => image.classList.toggle("is-active", i === index));
      thumbs.forEach((other, i) => other.classList.toggle("is-active", i === index)); // is-active: מוסתרת מהשורה
      if (count) count.textContent = `${index + 1}\\${bigImages.length} >`;
      if (text) text.textContent = bigImages[index].dataset.caption;
      // תמונה עם data-ratio: המסגרת (והעבודה כולה) מקבלת את הפרופורציות שלה, לרוחב או לגובה
      const ratio = bigImages[index].dataset.ratio;
      if (ratio) (gallery.closest(".gallery-item") || gallery).style.setProperty("--ratio", ratio);
    });
  });
});
