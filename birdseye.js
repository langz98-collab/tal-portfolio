/*
  OVERVIEW במבט מעוף הציפור (בכל עמודי הפרויקטים):
  כל החומרים של הפרויקט יחד, בשתי שורות שנגללות הצידה, בלי כפתורים.
  מעל כל חומר רק המספר שלו. ב-hover על חומר: כל השאר נהיים חצי שקופים,
  וליד המספר מופיעה הקטגוריה שלו (הלשונית), בצבע של הפרויקט.
  לחיצה על חומר: הוא גדל לאמצע המסך, כל השאר מוחשכים, והתיאור שלו מופיע בלבן. לחיצה נוספת (או Esc) מחזירה.
  הסדר של החומרים אקראי, ומשתנה בכל כניסה. חומרים רחבים קצת יותר קטנים, כדי שהשורות ייראו מאוזנות.

  אפשר לשנות לכל חומר (ב-HTML, על התמונה או הסרטון עצמם):
  data-be-label: מה שמופיע ב-hover במקום שם הלשונית (ריק: בלי כלום)
  data-be-text: התיאור שמופיע בלחיצה במקום הכיתוב (ריק: בלי תיאור)
  data-be-size="small": החומר קטן יותר

  בעמוד About (data-birdseye-sources): כל החומרים מכל הפרויקטים, וב-hover השם של הפרויקט בצבע שלו.

  הסקריפט בונה את התצוגה מהחומרים שכבר יש בעמוד (העתקים שלהם), ומראה אותה כשלעמוד יש is-overview.
  (הקו, FULL VIEW והמעבר עצמו נשארים כמו שהיו, ב-project-page.js / event-tabs.js וב-CSS)
*/
(async function () {
  const page = document.querySelector(".project-page, .event-page");
  if (!page) return;

  // ---------- 1. אוספים את החומרים, לפי הסדר של הלשוניות ----------
  const materials = []; // לכל חומר: מה שמופיע ב-hover, התיאור, והאלמנט שמוצג

  // הצבע של כל פרויקט (לפי ה-theme של העמוד שלו)
  function projectColor(body) {
    if (body.classList.contains("theme-hed-artzi")) return "var(--color-hed-artzi)";
    if (body.classList.contains("theme-darom")) return "var(--color-darom)";
    return "var(--color-football)";
  }

  // התיאור של חומר: הכיתוב שלו, בלי המספר
  function captionText(item) {
    const caption = item.querySelector(".work-caption");
    return caption ? caption.textContent.trim() : "";
  }

  // העתק של סרטון: עם אותן מחלקות ואותו חיתוך כמו המקור, ורץ לבד בלי סאונד
  function silentCopy(video) {
    const copy = document.createElement("video");
    copy.className = video.className;
    copy.setAttribute("style", video.getAttribute("style") || "");
    copy.src = video.currentSrc || video.src;
    if (video.poster) copy.poster = video.poster;
    copy.muted = true;
    copy.loop = true;
    copy.autoplay = true;
    copy.playsInline = true;
    return copy;
  }

  // חומר אחד: מה שמופיע ב-hover, התיאור, והאלמנט שמוצג (source: המקור, שממנו נלקחות ההגדרות)
  function addMaterial(source, title, text, element, extra = {}) {
    materials.push({
      label: extra.project ? title : source.dataset.beLabel ?? title,
      color: extra.project?.color,
      text: source.dataset.beText ?? text,
      small: source.dataset.beSize === "small",
      element,
      ...extra,
    });
  }

  /*
    אוספים את החומרים מעמוד (root: העמוד הזה, או עמוד של פרויקט אחר).
    project: בעמוד About, ב-hover מופיע השם של הפרויקט (ולא הלשונית), בצבע שלו.
  */
  function collect(root, project) {
    // השם של הלשונית (בלי מספר הפריטים)
    function tabName(panel) {
      const tab = root.querySelector(`.project-tab[data-tab="${panel.dataset.tab}"]`);
      return tab ? tab.firstChild.textContent.trim() : "";
    }

  root.querySelectorAll(".project-panel, .event-columns").forEach((panel) => {
    const title = project ? project.name : tabName(panel);
    panel.querySelectorAll(".work-item").forEach((item) => {
      if (item.querySelector(".hed-voice")) return; // הלוגו שמגיב לקול לא נכנס לכאן

      // גלריה קטנה: כל תמונה בה היא חומר בפני עצמו
      const gallery = item.querySelector(".mini-gallery");
      if (gallery) {
        const frameRatio = gallery.classList.contains("mini-gallery--posters") ? "567 / 810" : "668 / 701"; // כמו ב-CSS
        gallery.querySelectorAll(".mini-gallery__main img").forEach((image) => {
          const copy = image.cloneNode();
          copy.style.aspectRatio = frameRatio; // אותו חיתוך כמו במסגרת של הגלריה
          addMaterial(image, title, image.dataset.caption || captionText(item), copy, { project });
        });
        return;
      }

      // ה-Reel: בתוך המסגרת של אינסטגרם, רץ בלי סאונד (כמו כל הסרטונים כאן)
      const reel = item.querySelector(".reel");
      if (reel) {
        const copy = reel.cloneNode(true);
        copy.querySelector(".reel__play")?.remove();
        const video = copy.querySelector("video");
        video.replaceWith(silentCopy(reel.querySelector("video")));
        addMaterial(reel, title, captionText(item), copy, { reel, project }); // בלחיצה: ה-Reel האמיתי, שמתנגן
        return;
      }

      // כל חומר אחר: הסרטון, התמונה או הקולאז' (כמה תמונות באותו חומר: כל אחת לבד)
      const media = item.querySelectorAll(":scope > :is(video, img, .work-crop, .work-collage, .work-poster)");
      media.forEach((element) => {
        const copy = element.tagName === "VIDEO" ? silentCopy(element) : element.cloneNode(true);
        addMaterial(element, title, captionText(item), copy, { project });
      });
    });
  });
  }

  // בעמוד About: החומרים מכל הפרויקטים (טוענים את העמודים שלהם). בעמוד פרויקט: החומרים שלו
  const sources = page.dataset.birdseyeSources;
  if (sources) {
    const parser = new DOMParser();
    for (const address of sources.split(" ")) {
      const html = await fetch(address).then((response) => response.text());
      const other = parser.parseFromString(html, "text/html");
      collect(other, {
        name: other.querySelector(".project-header__name").textContent.replace(/\s+/g, " ").trim(),
        color: projectColor(other.body),
      });
    }
  } else {
    collect(page);
  }

  // ---------- 2. בונים את התצוגה ----------
  const view = document.createElement("div");
  view.className = "birdseye";
  view.setAttribute("aria-hidden", "true");
  const rows = [document.createElement("div"), document.createElement("div")];
  rows.forEach((row) => {
    row.className = "birdseye__row";
    view.append(row);
  });

  const materialOf = new Map(); // לכל חומר בתצוגה: המידע שלו
  const items = materials.map((material) => {
    const item = document.createElement("figure");
    item.className = "birdseye__item";
    item.classList.toggle("is-small", material.small);
    item.innerHTML = `
      <figcaption class="birdseye__caption">
        <span class="birdseye__number"></span>
        <span class="birdseye__text birdseye__title"></span>
      </figcaption>
      <div class="birdseye__media"></div>`;
    item.querySelector(".birdseye__title").textContent = material.label; // ב-hover: רק הקטגוריה
    if (material.color) item.style.setProperty("--be-label-color", material.color); // בעמוד About: הצבע של הפרויקט
    materialOf.set(item, material);
    material.element.classList.remove("reveal", "is-visible", "is-active"); // ההעתק כבר מוצג, בלי האנימציה של העמוד
    item.querySelector(".birdseye__media").append(material.element);
    return item;
  });

  page.append(view);

  // ---------- 3. מחלקים לשתי שורות באורך דומה ----------
  /*
    הסדר: אקראי לגמרי, ומשתנה בכל כניסה ל-OVERVIEW. המספרים לפי המקום החדש.
    בעמוד About (חומרים מכמה פרויקטים): מערבבים כך ששני חומרים מאותו פרויקט כמעט אף פעם
    לא יהיו אחד ליד השני, כדי שתמיד יהיו כמה שיותר צבעים על המסך.
  */
  let order = [...items];

  function randomized(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function shuffle() {
    // קבוצה לכל פרויקט (בעמוד פרויקט יש רק קבוצה אחת)
    const groups = new Map();
    randomized(items).forEach((item) => {
      const key = materialOf.get(item).color || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    if (groups.size < 2) {
      order = randomized(items);
      return;
    }
    /*
      כל פעם לוקחים חומר מפרויקט אחר מהקודם, ומהפרויקט שנשארו לו הכי הרבה חומרים
      (בין כמה פרויקטים קרובים: אחד מהם באקראי). כך הפרויקט הגדול מתפזר לאורך כל השורות,
      ולא נשאר לבד בסוף.
    */
    order = [];
    let last = null;
    while (order.length < items.length) {
      const options = [...groups.entries()].filter(([key, list]) => list.length && key !== last);
      const pool = options.length ? options : [...groups.entries()].filter(([, list]) => list.length);
      const most = Math.max(...pool.map(([, list]) => list.length));
      const close = pool.filter(([, list]) => list.length >= most - 1);
      const [key, list] = close[Math.floor(Math.random() * close.length)];
      order.push(list.pop());
      last = key;
    }
  }

  function layout() {
    order.forEach((item, index) => {
      rows[0].append(item); // מודדים את כולם בשורה אחת
      item.querySelector(".birdseye__number").textContent = `${index + 1} >`;
      item.classList.remove("is-wide");
    });
    // חומר רחב (יותר מפי 1.6 מהגובה שלו) קצת יותר קטן, כדי שלא ישתלט על השורה
    order.forEach((item) => {
      const box = item.querySelector(".birdseye__media > *").getBoundingClientRect();
      if (box.height && box.width / box.height > 1.6) item.classList.add("is-wide");
    });
    const widths = order.map((item) => item.getBoundingClientRect().width);
    const gap = parseFloat(getComputedStyle(rows[0]).columnGap) || 0;
    const total = widths.reduce((sum, width) => sum + width + gap, 0);

    let best = order.length;
    let bestDifference = Infinity;
    let first = 0;
    for (let split = 0; split <= order.length; split++) {
      const difference = Math.abs(total - 2 * first);
      if (difference < bestDifference) {
        bestDifference = difference;
        best = split;
      }
      if (split < order.length) first += widths[split] + gap;
    }
    order.slice(best).forEach((item) => rows[1].append(item));
  }

  // כל פעם שתמונה או סרטון נטענים (ומשנים את הרוחב שלהם), מחלקים מחדש
  let layoutTimer = null;
  function scheduleLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layout, 50);
  }
  view.querySelectorAll("img").forEach((image) => image.addEventListener("load", scheduleLayout));
  view.querySelectorAll("video").forEach((video) => video.addEventListener("loadedmetadata", scheduleLayout));
  window.addEventListener("resize", scheduleLayout);
  layout();

  // ---------- 4. גלגלת רגילה (למעלה ולמטה) גוללת הצידה ----------
  view.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    view.scrollLeft += event.deltaY;
  }, { passive: false });

  // ---------- 5. לחיצה על חומר: הוא גדל לאמצע המסך, השאר מוחשכים, והתיאור שלו מופיע בלבן ----------
  const focus = document.createElement("div");
  focus.className = "birdseye-focus";
  focus.innerHTML = `
    <div class="birdseye-focus__shade"></div>
    <div class="birdseye-focus__frame">
      <p class="birdseye-focus__caption"><span class="birdseye__number"></span> <span class="birdseye-focus__text"></span></p>
      <div class="birdseye-focus__media"></div>
    </div>`;
  page.append(focus);
  const focusFrame = focus.querySelector(".birdseye-focus__frame");
  const focusMedia = focus.querySelector(".birdseye-focus__media");
  const focusDuration = 650;
  const focusEasing = "cubic-bezier(0.65, 0, 0.35, 1)"; // מתחיל לאט ונעצר לאט (כמו --ease-next)
  let focusedItem = null;

  // המקום והגודל של החומר הגדול: באמצע האזור שמימין לקו, כמה שיותר גדול, בלי לצאת מהמסך
  function targetBox(ratio) {
    const u = page.clientWidth / 1440;
    const area = { left: 86 * u, right: page.clientWidth, top: 71 * u, bottom: page.clientHeight - 40 * u };
    const captionSpace = 50 * u;
    const maxWidth = area.right - area.left - 2 * 120 * u;
    const maxHeight = area.bottom - area.top - captionSpace;
    const width = Math.min(maxWidth, maxHeight * ratio);
    const height = width / ratio;
    return {
      width,
      height,
      left: area.left + (area.right - area.left - width) / 2,
      top: area.top + captionSpace + (maxHeight - height) / 2,
    };
  }

  function openFocus(item) {
    const source = item.querySelector(".birdseye__media > *");
    const from = source.getBoundingClientRect();
    const pageBox = page.getBoundingClientRect();
    const to = targetBox(from.width / from.height);

    // העתק של החומר, בגודל ובמקום הסופי
    const material = materialOf.get(item);
    let copy;
    if (material.reel) {
      // ה-Reel: העתק של ה-Reel האמיתי, שמתנגן (עם סאונד) מההתחלה
      copy = material.reel.cloneNode(true);
      copy.querySelector(".reel__play")?.remove();
      copy.classList.add("is-playing");
      copy.style.setProperty("--reel-width", to.width + "px");
    } else {
      copy = source.tagName === "VIDEO" ? silentCopy(source) : source.cloneNode(true);
    }
    focusMedia.replaceChildren(copy);
    const reelVideo = material.reel && copy.querySelector("video");
    if (reelVideo) {
      reelVideo.currentTime = 0;
      reelVideo.play().catch(() => {});
    }
    Object.assign(focusFrame.style, {
      left: to.left + "px",
      top: to.top + "px",
      width: to.width + "px",
      height: to.height + "px",
    });
    focus.querySelector(".birdseye__number").textContent = item.querySelector(".birdseye__number").textContent;
    focus.querySelector(".birdseye-focus__text").textContent = material.text;

    // התנועה: מתחיל בדיוק במקום של החומר הקטן, וגדל למקום החדש
    const scale = from.width / to.width;
    const dx = from.left - pageBox.left - to.left;
    const dy = from.top - pageBox.top - to.top;
    focusedItem = item;
    item.classList.add("is-focused"); // החומר המקורי מוסתר בזמן שההעתק גדול
    focus.classList.add("is-open");
    focusMedia.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "none" }],
      { duration: focusDuration, easing: focusEasing }
    );
  }

  function closeFocus() {
    if (!focusedItem) return;
    const item = focusedItem;
    focusedItem = null;
    const source = item.querySelector(".birdseye__media > *");
    const from = source.getBoundingClientRect();
    const pageBox = page.getBoundingClientRect();
    const to = focusMedia.getBoundingClientRect();
    const scale = from.width / to.width;
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    focusMedia.querySelectorAll("video").forEach((video) => video.pause());
    focus.classList.remove("is-open");
    const back = focusMedia.animate(
      [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
      { duration: focusDuration, easing: focusEasing, fill: "forwards" }
    );
    back.onfinish = () => {
      item.classList.remove("is-focused");
      focusMedia.replaceChildren();
      back.cancel();
    };
  }

  items.forEach((item) => item.addEventListener("click", () => openFocus(item)));
  focus.addEventListener("click", closeFocus);
  // Esc: קודם סוגרים את החומר הגדול (ורק בלחיצה נוספת יוצאים מ-OVERVIEW)
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && focusedItem) {
      event.stopImmediatePropagation();
      closeFocus();
    }
  }, true);

  /*
    ---------- 6. "אחורה" (החלקה אחורה בעכבר, או הכפתור של הדפדפן) ----------
    כשנכנסים ל-OVERVIEW מוסיפים צעד להיסטוריה של הדפדפן. כך "אחורה" לא יוצא לעמוד הבית,
    אלא חוזר לתצוגה הרגילה של הפרויקט, באותו מעבר כמו FULL VIEW.
  */
  const fullViewButton = page.querySelector(".full-view");
  let historyStep = false;   // יש צעד שלנו בהיסטוריה
  let closingFromBack = false;

  window.addEventListener("popstate", () => {
    if (!page.classList.contains("is-overview")) return;
    historyStep = false;
    closingFromBack = true;
    if (focusedItem) closeFocus();
    fullViewButton.click();
    closingFromBack = false;
  });

  // כשנכנסים ל-OVERVIEW: סדר חדש, מתחילים מההתחלה, והסרטונים רצים רק כשרואים אותם
  let wasOpen = false;
  new MutationObserver(() => {
    const open = page.classList.contains("is-overview");
    if (open === wasOpen) return;
    wasOpen = open;
    view.setAttribute("aria-hidden", String(!open));
    if (open) {
      shuffle();
      layout();
      view.scrollLeft = 0;
      if (!historyStep) {
        history.pushState({ overview: true }, "");
        historyStep = true;
      }
    } else {
      closeFocus();
      // יצאו ב-FULL VIEW או Esc: מורידים את הצעד שהוספנו, כדי ש"אחורה" הבא יחזור לעמוד הבית
      if (historyStep && !closingFromBack) {
        historyStep = false;
        history.back();
      }
    }
    view.querySelectorAll("video").forEach((video) => (open ? video.play().catch(() => {}) : video.pause()));
  }).observe(page, { attributes: true, attributeFilter: ["class"] });
})();
