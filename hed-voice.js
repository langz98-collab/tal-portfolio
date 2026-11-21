/*
  הד ארצי: לוגו שמגיב לקול.
  הלוגו חתוך לפסים, והפסים זזים הצידה. כשמדברים (במיקרופון) הם זזים יותר ומהר יותר.
  לחיצה על אייקון המיקרופון בפינה (או על הלוגו) מבקשת רשות להשתמש במיקרופון.
  הצבעים נלקחים מ-CSS (--voice-color, --voice-background).
*/
(() => {
  // ההגדרות של האנימציה
  const SLICES = 6;            // לכמה פסים הלוגו נחתך
  const ANGLE = 0;             // זווית החיתוך
  const ANGLE_SPREAD = 14;     // כמה הזוויות של הפסים שונות זו מזו
  const ANGLE_RAND = 4;        // קצת אקראיות בזוויות
  const DISPLACE_X = 45;       // כמה הפסים זזים הצידה
  const RANDOMNESS = 1;
  const SPEED = 7;             // מהירות התנועה בשקט
  const SENSITIVITY = 48;      // כמה הקול משפיע (היה 58: קצת פחות רגיש)
  const SMOOTHING = 0.8;       // כמה התגובה לקול רכה (קרוב ל-1 = חלק ואיטי יותר)
  const THRESHOLD = 0.15;      // קול שקט מזה לא משפיע (רעשי רקע)
  const FREQ_SPREAD = 0.6;
  const LOGO_WIDTH = 0.61;     // רוחב הלוגו ביחס לאזור
  const LOGO_SRC = "images/hed-artzi-voice-logo.png";
  const LOGO_ORIGINAL_WIDTH = 976; // רוחב הלוגו בקוד המקורי (לפיו נקבע גודל התזוזה)

  const seeded = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const gate = (v) => (v < THRESHOLD ? 0 : (v - THRESHOLD) / (1 - THRESHOLD));

  // הזוויות של קווי החיתוך בין הפסים
  const tans = [];
  for (let i = 0; i <= SLICES; i++) {
    let angle = ANGLE;
    if (i > 0 && i < SLICES) {
      angle += (i / SLICES - 0.5) * ANGLE_SPREAD;
      angle += (seeded(i * 777) - 0.5) * 2 * ANGLE_RAND;
    }
    tans.push(Math.tan((angle * Math.PI) / 180));
  }

  function mount(box) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "הלוגו של הד ארצי, זז לפי הקול");
    // כפתור קטן בפינה, עם אייקון של מיקרופון: מדליק ומכבה את המיקרופון
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hed-voice__mic";
    button.setAttribute("aria-label", "הפעלת המיקרופון: הלוגו זז לפי הקול");
    // הטקסט ליד האייקון: לפני ההפעלה ALLOW MICROPHONE, ואחריה SPEAK
    const label = document.createElement("span");
    label.className = "hed-voice__label";
    label.textContent = "ALLOW MICROPHONE";
    const icon = document.createElement("span");
    icon.className = "hed-voice__icon";
    button.append(label, icon);
    box.append(canvas);
    // בדרך כלל הכפתור בפינה של האזור. אם יש מקום מיוחד בשבילו (data-mic-slot), הוא שם
    const slot = box.dataset.micSlot && document.querySelector(box.dataset.micSlot);
    (slot || box).append(button);

    const ctx = canvas.getContext("2d");
    const style = getComputedStyle(box);
    const FG = style.getPropertyValue("--voice-color").trim();
    const BG = style.getPropertyValue("--voice-background").trim();

    // גודל הציור לפי גודל האזור (גם כשהמסך משתנה)
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = box.clientWidth;
      H = box.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    new ResizeObserver(resize).observe(box);
    resize();

    // המיקרופון
    let analyser = null, data = null, live = false, stream = null;
    async function startMic() {
      if (live) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === "suspended") await audio.resume();
        analyser = audio.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8; // הקול עצמו מוחלק (היה 0.15)
        audio.createMediaStreamSource(stream).connect(analyser);
        data = new Uint8Array(analyser.frequencyBinCount);
        live = true;
        button.classList.add("is-on");
        label.textContent = "SPEAK";
        box.dispatchEvent(new CustomEvent("voice-live")); // עמודים אחרים יכולים לדעת שהמיקרופון פועל
      } catch (error) {
        button.classList.add("is-blocked"); // אין רשות למיקרופון
        label.textContent = "NO MICROPHONE";
      }
    }

    function stopMic() {
      live = false;
      stream.getTracks().forEach((track) => track.stop());
      button.classList.remove("is-on");
      label.textContent = "ALLOW MICROPHONE";
    }

    button.addEventListener("click", () => (live ? stopMic() : startMic()));
    canvas.addEventListener("click", startMic);

    // מציירים רק כשהאזור נראה במסך
    let visible = true;
    new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(box);

    const logo = document.createElement("canvas");
    const sliceVolume = new Float32Array(SLICES);
    let time = 0;
    let smoothVolume = 0; // עוצמת הקול אחרי החלקה, כדי שהמהירות לא תקפוץ

    function draw() {
      requestAnimationFrame(draw);
      if (!visible || !W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // כמה חזק הקול עכשיו
      let volume = 0;
      if (live) {
        analyser.getByteFrequencyData(data);
        const end = Math.floor(data.length * 0.2);
        let sum = 0;
        for (let k = 0; k < end; k++) sum += data[k];
        volume = gate(sum / end / 255);
      }
      smoothVolume = lerp(smoothVolume, volume, 1 - SMOOTHING);
      box.voiceVolume = volume; // עוצמת הקול עכשיו (0 עד 1), למי שצריך
      time += (SPEED / 1000) * (1 + smoothVolume * (SENSITIVITY / 5));

      // הלוגו באמצע האזור
      const lw = Math.min(W * LOGO_WIDTH, (H * 0.9 * logo.width) / logo.height);
      const lh = (lw * logo.height) / logo.width;
      const lx = (W - lw) / 2, ly = (H - lh) / 2;
      const cx = W / 2, sliceH = H / SLICES, scale = lw / LOGO_ORIGINAL_WIDTH;

      // כל פס זז הצידה לבד
      for (let i = 0; i < SLICES; i++) {
        if (live) {
          const bin = Math.floor((i / SLICES) * data.length * 0.5 * FREQ_SPREAD);
          sliceVolume[i] = lerp(sliceVolume[i], gate((data[bin] || 0) / 255), 1 - SMOOTHING);
        } else {
          sliceVolume[i] *= SMOOTHING; // כשהמיקרופון כבוי: חוזר לאט לתנועה הרגילה
        }
        const dX = DISPLACE_X * scale * (1 + sliceVolume[i] * (SENSITIVITY / 10) * 5);
        const x = Math.sin(time + i * 0.5) * dX + (seeded(i + 1) - 0.5) * 2 * dX * RANDOMNESS;
        const yT = i * sliceH, yB = (i + 1) * sliceH;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, yT + (0 - cx) * tans[i]);
        ctx.lineTo(W, yT + (W - cx) * tans[i]);
        ctx.lineTo(W, yB + (W - cx) * tans[i + 1]);
        ctx.lineTo(0, yB + (0 - cx) * tans[i + 1]);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logo, lx + x, ly, lw, lh);
        ctx.restore();
      }
    }

    // טוענים את הלוגו וצובעים אותו בצבע של הפרויקט
    const image = new Image();
    image.onload = () => {
      logo.width = image.width;
      logo.height = image.height;
      const l = logo.getContext("2d");
      l.drawImage(image, 0, 0);
      l.globalCompositeOperation = "source-in";
      l.fillStyle = FG;
      l.fillRect(0, 0, logo.width, logo.height);
      requestAnimationFrame(draw);
    };
    image.src = LOGO_SRC;
  }

  document.querySelectorAll(".hed-voice").forEach(mount);
})();
