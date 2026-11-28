/*
  בלי מילה בודדת בשורה האחרונה של פסקה.
  בכל פסקה (ובכל שורה שנגמרת ב-<br>) מחברים את שתי המילים האחרונות ברווח "שלא נשבר" (nbsp).
  כך הדפדפן תמיד מוריד אותן יחד לשורה החדשה, והגודל של הטקסט לא משתנה.
*/
(function () {
  // הטקסטים שבהם מחברים: הטקסט על הפרויקט, הכותרות והכיתובים
  const blocks = document.querySelectorAll(
    ".project-text p, .event-about__text p, .event-about__text li, .project-headline, .work-caption, .project-text__credit, .event-about__credit"
  );
  blocks.forEach(joinLastWords);

  // מחלקים את הפסקה לשורות לפי <br>, ובכל שורה מחברים את שתי המילים האחרונות
  function joinLastWords(block) {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let line = [];
    const lines = [line];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeName === "BR") lines.push((line = []));
      else if (node.nodeType === Node.TEXT_NODE) line.push(node);
    }
    lines.forEach(glueLastSpace);
  }

  // מחפשים מהסוף את הרווח שלפני המילה האחרונה, ומחליפים אותו ברווח שלא נשבר
  function glueLastSpace(textNodes) {
    let seenWord = false; // כבר עברנו על המילה האחרונה (מהסוף)?
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const text = textNodes[i].data;
      for (let j = text.length - 1; j >= 0; j--) {
        const isSpace = /[ \t\n\r]/.test(text[j]);
        if (!isSpace) {
          if (text[j] === " " && seenWord) return; // כבר מחובר
          seenWord = true;
        } else if (seenWord) {
          // כל הרווחים ברצף (למשל ירידת שורה והזחה ב-HTML) הופכים לרווח אחד שלא נשבר
          let start = j;
          while (start > 0 && /[ \t\n\r]/.test(text[start - 1])) start--;
          textNodes[i].data = text.slice(0, start) + " " + text.slice(j + 1);
          // אם הרווח היה בתחילת קטע טקסט, מורידים גם רווחים שבסוף הקטע שלפניו
          if (start === 0) trimEnd(textNodes, i - 1);
          return;
        }
      }
    }
  }

  function trimEnd(textNodes, index) {
    for (let i = index; i >= 0; i--) {
      const trimmed = textNodes[i].data.replace(/[ \t\n\r]+$/, "");
      textNodes[i].data = trimmed;
      if (trimmed.length) return;
    }
  }
})();
