export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function validateQuestions(data, minImageOptions = 2) {
  if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: "No quiz questions are available." };
  const questionIds = new Set();
  for (const q of data) {
    if (!q || typeof q.id !== "string" || !q.id.trim() || questionIds.has(q.id)) return { ok: false, reason: "Quiz content is temporarily unavailable." };
    questionIds.add(q.id);
    if (typeof q.word !== "string" || !q.word.trim() || typeof q.sentence !== "string" || !q.sentence.trim()) return { ok: false, reason: "Quiz content is temporarily unavailable." };
    if (!Array.isArray(q.images) || q.images.length < minImageOptions) return { ok: false, reason: "Quiz content is temporarily unavailable." };
    const ids = new Set();
    for (const image of q.images) {
      if (!image || typeof image.id !== "string" || !image.id.trim() || ids.has(image.id) || typeof image.src !== "string" || !image.src.trim()) return { ok: false, reason: "Quiz content is temporarily unavailable." };
      ids.add(image.id);
    }
    if (!ids.has(q.correctImageId)) return { ok: false, reason: "Quiz content is temporarily unavailable." };
  }
  return { ok: true };
}

export function prepareQuestions(data, config) {
  const questions = config.randomizeQuestions ? shuffle(data) : [...data];
  return questions.map(q => ({
    ...q,
    images: config.randomizeAnswers ? shuffle(q.images) : [...q.images]
  }));
}

export function calculateResults(questions, answers) {
  const correct = questions.reduce((sum, q) => sum + (answers[q.id] === q.correctImageId ? 1 : 0), 0);
  const total = questions.length;
  return { correct, incorrect: total - correct, total, percentage: total ? Math.round((correct / total) * 100) : 0 };
}

export function highlightSentence(sentence, word) {
  const index = sentence.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
  if (index < 0) return [{ text: sentence, highlight: false }];
  return [
    { text: sentence.slice(0, index), highlight: false },
    { text: sentence.slice(index, index + word.length), highlight: true },
    { text: sentence.slice(index + word.length), highlight: false }
  ].filter(part => part.text);
}