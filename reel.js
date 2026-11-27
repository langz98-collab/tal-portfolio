/*
  ה-Reel (בעמוד DAROM FILM FESTIVAL):
  לחיצה על PLAY מפעילה את הסרטון עם הסאונד, והכפתור נעלם.
  לחיצה על ה-Reel בזמן שהוא רץ עוצרת אותו, והכפתור חוזר. בסוף הסרטון הכפתור חוזר.
  כשה-Reel יוצא מהמסך (למשל עוברים ללשונית אחרת), הוא נעצר.
*/
document.querySelectorAll(".reel").forEach((reel) => {
  const video = reel.querySelector(".reel__video");
  const playButton = reel.querySelector(".reel__play");

  playButton.addEventListener("click", (event) => {
    event.stopPropagation();
    video.play();
  });

  reel.addEventListener("click", () => {
    if (!video.paused) video.pause();
  });

  video.addEventListener("play", () => reel.classList.add("is-playing"));
  video.addEventListener("pause", () => reel.classList.remove("is-playing"));
  video.addEventListener("ended", () => reel.classList.remove("is-playing"));

  // לא ממשיכים לנגן (עם סאונד) כשלא רואים את ה-Reel
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) video.pause();
  }).observe(reel);
});
