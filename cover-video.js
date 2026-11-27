/*
  סרטון שרץ לבד בלי סאונד, כמה פעמים (data-plays), ואז נעצר על הפריים האחרון.
  (בעמוד DAROM FILM FESTIVAL: הסרטון של האייקונים, פעמיים)
*/
document.querySelectorAll(".cover-video").forEach((video) => {
  const plays = Number(video.dataset.plays) || 1;
  let played = 0;

  video.muted = true; // בלי סאונד, תמיד

  video.addEventListener("ended", () => {
    played += 1;
    if (played < plays) video.play(); // עוד פעם מההתחלה
    // אחרי הפעם האחרונה: נשאר על הפריים האחרון
  });
});
