const TIME_RE = /(\b\d{1,2}[:h]\d{2}\b)/i;

function normalizeLine(line) {
  return line
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTimeToken(token) {
  if (!token) return null;
  const clean = token.toLowerCase().replace("h", ":");
  const [h, m] = clean.split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function inferType(title) {
  const low = title.toLowerCase();
  if (/(vitamina|omega|gabapentina|med|caps|comprimido|insulina|exelon)/.test(low)) return "med";
  if (/(nota|observa|note)/.test(low)) return "note";
  return "task";
}

function inferCategory(title) {
  const low = title.toLowerCase();
  if (/(vitamina|med|gabapentina|insulina|exelon|omega|alois|procimax)/.test(low)) return "Medication";
  if (/(fisio|funcional|terapia|ginastica)/.test(low)) return "Therapy";
  if (/(almo|jantar|lanche|cafe|nutri|agua)/.test(low)) return "Nutrition";
  if (/(higiene|hidratante)/.test(low)) return "Hygiene";
  return "Custom";
}

export function parseScheduleText(text) {
  const lines = (text || "")
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const items = [];
  let currentTime = null;

  for (const line of lines) {
    const timeMatch = line.match(TIME_RE);
    if (timeMatch) {
      currentTime = normalizeTimeToken(timeMatch[1]);
      const remainder = normalizeLine(line.replace(timeMatch[1], ""));
      if (!remainder || /^[-.]+$/.test(remainder)) continue;

      items.push({
        title: remainder,
        time: currentTime,
        type: inferType(remainder),
        category: inferCategory(remainder),
      });
      continue;
    }

    if (!currentTime || /^[-.]+$/.test(line)) continue;

    items.push({
      title: line,
      time: currentTime,
      type: inferType(line),
      category: inferCategory(line),
    });
  }

  return items;
}
