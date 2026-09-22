export function saveSession(key, state) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Storage can be unavailable. */ }
}

export function loadSession(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession(key) {
  try { localStorage.removeItem(key); } catch { /* No action required. */ }
}

export function isRestorableSession(session, sourceQuestions) {
  if (!session || session.version !== 1 || session.status !== "active") return false;
  if (typeof session.studentName !== "string" || !session.studentName.trim()) return false;
  if (!Array.isArray(session.questionIds) || session.questionIds.length !== sourceQuestions.length) return false;
  const ids = new Set(sourceQuestions.map(q => q.id));
  if (!session.questionIds.every(id => ids.has(id))) return false;
  if (!Number.isInteger(session.currentQuestionIndex) || session.currentQuestionIndex < 0 || session.currentQuestionIndex >= sourceQuestions.length) return false;
  return session.answers && typeof session.answers === "object";
}