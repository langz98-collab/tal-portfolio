/*
  השער של הד ארצי (hed-artzi-gate.html).
  1. מגיעים מעמוד הבית: הקו ממשיך מהקו של עמוד הבית וזז שמאלה למקום שלו, והתוכן עולה מלמטה.
  2. מדליקים את המיקרופון ואומרים INDUSTRIAL PEACE. הדפדפן מזהה את המילים (זיהוי דיבור).
     בדפדפן בלי זיהוי דיבור מספיק לדבר קצת (משפט קצר).
  3. הסיסמה נכונה: הסיסמה נצבעת, התוכן נעלם, והקו "דוחף" לתוך עמוד הפרויקט.
  החץ שלמעלה מימין נכנס בלי סיסמה, והחץ שמשמאל חוזר לעמוד הבית (באותה גלילה כמו בעמוד פרויקט).
*/
const root = document.documentElement;
const gate = document.querySelector(".gate");
const gateLine = document.querySelector(".gate-line");
const voiceBox = document.querySelector(".gate-voice");
const skipLink = document.querySelector(".gate-skip");
const homeLink = document.querySelector(".project-home");

// הסיסמה: INDUSTRIAL PEACE. הזיהוי לפעמים שומע "piece" או "peas", אז גם הם נחשבים
const PASSWORD = /industrial\s+(peace|piece|peas|pease)/;
const projectAddress = "hed-artzi.html";
const enterDuration = 1000; // כמו --duration-page-in ב-CSS
const exitDuration = 600;   // כמו --duration-page-out ב-CSS
const fadeDuration = 500;   // התוכן של השער נעלם לפני שהקו דוחף
const passPause = 1000;     // הסיסמה מהבהבת בכתום ולבן (כמו --duration-gate-flash × 6 ב-CSS), ואז נכנסים
const desktopLayout = window.matchMedia("(min-width: 901px) and (orientation: landscape)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const withMotion = () => desktopLayout.matches && !reducedMotion.matches;

// למי שביקש פחות תנועה: המרקם של הסיסמה לא זז (נשאר במצב העדין)
if (reducedMotion.matches) {
  document.querySelectorAll("#gate-texture animate").forEach((animation) => animation.remove());
}

/* ---------- 1. הגעה מעמוד הבית ---------- */
if (root.classList.contains("is-entering")) {
  sessionStorage.removeItem("enter-line"); // ברענון של העמוד המעבר לא חוזר
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add("is-arriving");
    root.classList.remove("is-entering");
  }));
  setTimeout(() => root.classList.remove("is-arriving"), enterDuration);
}

/* ---------- 2. הסיסמה ---------- */
let passed = false;

function passGate() {
  if (passed) return;
  passed = true;
  gate.classList.add("is-passed"); // הסיסמה מהבהבת בכתום ולבן
  setTimeout(enterProject, passPause);
}

// מתחילים להקשיב כשהמיקרופון פועל (hed-voice.js שולח voice-live)
voiceBox.addEventListener("voice-live", () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Recognition) {
    listenForPassword(Recognition);
  } else {
    listenForAnySpeech();
  }
});

// זיהוי דיבור: מחכים שהסיסמה תופיע במה שנאמר
function listenForPassword(Recognition) {
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true; // מגיב כבר תוך כדי דיבור

  recognition.onresult = (event) => {
    for (const result of event.results) {
      if (PASSWORD.test(result[0].transcript.toLowerCase())) {
        recognition.stop();
        passGate();
      }
    }
  };
  // אם הזיהוי נעצר (שקט ארוך), מתחילים שוב
  recognition.onend = () => {
    if (!passed) recognition.start();
  };
  // אם הזיהוי לא עובד (למשל בלי אינטרנט), מספיק לדבר
  recognition.onerror = (event) => {
    if (event.error !== "no-speech" && event.error !== "aborted") {
      recognition.onend = null;
      listenForAnySpeech();
    }
  };
  recognition.start();
}

// בלי זיהוי דיבור: מספיק לדבר בסך הכל שנייה וקצת
function listenForAnySpeech() {
  let spokenTime = 0;
  let lastTime = performance.now();
  function check(now) {
    if (passed) return;
    if ((voiceBox.voiceVolume || 0) > 0.05) spokenTime += now - lastTime;
    lastTime = now;
    if (spokenTime > 1200) passGate();
    else requestAnimationFrame(check);
  }
  requestAnimationFrame(check);
}

/* ---------- 3. כניסה לפרויקט: התוכן נעלם, והקו ממשיך לדחוף בעמוד הפרויקט ---------- */
function enterProject() {
  if (!withMotion()) {
    window.location.href = projectAddress;
    return;
  }
  root.classList.add("is-leaving-gate");
  setTimeout(() => {
    // עמוד הפרויקט מתחיל עם הקו בדיוק כאן
    const lineBox = gateLine.getBoundingClientRect();
    sessionStorage.setItem("push-line", JSON.stringify({
      left: lineBox.left, top: lineBox.top, width: lineBox.width, height: lineBox.height,
    }));
    window.location.href = projectAddress;
  }, fadeDuration);
}

skipLink.addEventListener("click", (event) => {
  event.preventDefault();
  enterProject();
});

/* ---------- חזרה לעמוד הבית: כמו בעמוד פרויקט (התוכן יורד, והקו עובר למקום של הקו של עמוד הבית) ---------- */
homeLink.addEventListener("click", (event) => {
  if (!withMotion()) return; // מעבר רגיל
  event.preventDefault();
  const screenWidth = root.clientWidth;
  const homeU = Math.min(screenWidth / 1440, root.clientHeight / 1024);
  const lineWidth = Math.max(2, 6 * homeU);
  root.style.setProperty("--exit-line-left", screenWidth / 2 - lineWidth / 2 + "px");
  root.style.setProperty("--exit-line-width", lineWidth + "px");
  root.classList.add("is-leaving-home");
  setTimeout(() => {
    sessionStorage.setItem("return-home", "yes");
    window.location.href = homeLink.href;
  }, exitDuration);
});

// חזרה לשער בכפתורים של הדפדפן: העמוד חוזר למצב הרגיל
window.addEventListener("pageshow", (event) => {
  if (event.persisted) root.classList.remove("is-leaving-gate", "is-leaving-home");
});
