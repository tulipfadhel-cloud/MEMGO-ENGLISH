import { quizConfig } from "./config.js";
import { quizData } from "./quiz-data.js";
import { validateQuestions, prepareQuestions, calculateResults, highlightSentence } from "./logic.js";
import { saveSession, loadSession, clearSession, isRestorableSession } from "./persistence.js";

const root = document.querySelector("#app");
const validation = validateQuestions(quizData, quizConfig.minImageOptions);

let state = {
  status: "intro",
  studentName: "",
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  startTime: null,
  completedTime: null,
  locked: false,
  practiceFeedback: null,
  reviewOpen: false,
  introNoticeSeen: false
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

function logoMarkup() {
  return `<div class="brand" aria-label="MEMGO ENGLISH">
    <img class="brand-logo" src="./assets/branding/memgo-logo.jpg" alt="MEMGO ENGLISH logo">
  </div>`;
}

function persist() {
  if (!quizConfig.persistSession || state.status !== "active") return;
  saveSession(quizConfig.storageKey, {
    version: 1,
    status: "active",
    studentName: state.studentName,
    questionIds: state.questions.map(q => q.id),
    imageOrder: Object.fromEntries(state.questions.map(q => [q.id, q.images.map(i => i.id)])),
    currentQuestionIndex: state.currentQuestionIndex,
    answers: state.answers,
    startTime: state.startTime
  });
}

function restore() {
  if (!quizConfig.persistSession || !validation.ok) return;
  const saved = loadSession(quizConfig.storageKey);
  if (!isRestorableSession(saved, quizData)) {
    if (saved) clearSession(quizConfig.storageKey);
    return;
  }
  const byId = new Map(quizData.map(q => [q.id, q]));
  const questions = saved.questionIds.map(id => {
    const q = byId.get(id);
    const order = saved.imageOrder?.[id] || [];
    const images = order.map(imgId => q.images.find(i => i.id === imgId)).filter(Boolean);
    return { ...q, images: images.length === q.images.length ? images : [...q.images] };
  });
  const restoredName = String(saved.studentName || "").trim().replace(/\s+/g, " ");
  if (!restoredName) {
    clearSession(quizConfig.storageKey);
    return;
  }
  state = { ...state, status:"active", studentName:restoredName.slice(0, quizConfig.maxNameLength), questions, currentQuestionIndex:saved.currentQuestionIndex, answers:saved.answers, startTime:saved.startTime, introNoticeSeen:true };
}

function transitionRender(afterRender) {
  const current = root.firstElementChild;
  if (!current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    render();
    wireImages();
    afterRender?.();
    return;
  }
  current.classList.add("page-leaving");
  window.setTimeout(() => {
    render();
    wireImages();
    requestAnimationFrame(() => {
      root.firstElementChild?.classList.add("page-entering");
      requestAnimationFrame(() => root.firstElementChild?.classList.remove("page-entering"));
    });
    afterRender?.();
  }, 180);
}

function render() {
  document.title = "Visual Vocabulary Quiz | MEMGO ENGLISH";
  if (!validation.ok) return renderUnavailable(validation.reason);
  if (state.status === "intro") return renderIntro();
  if (state.status === "active" && !String(state.studentName || "").trim()) {
    clearSession(quizConfig.storageKey);
    state.status = "intro";
    state.studentName = "";
    return renderIntro("يرجى كتابة اسم الطالب قبل بدء الكوز.");
  }
  if (state.status === "active") return renderQuiz();
  return renderResults();
}

function renderIntro(error = "") {
  root.innerHTML = `<main class="shell intro-shell">
    <section class="intro-card">
      ${logoMarkup()}
      <div class="intro-copy" dir="rtl">
        <span class="eyebrow">MEMGO ENGLISH</span>
        <h1>اختبار المفردات بالصور</h1>
        <p>اقرأ الجملة، افهم معنى الكلمة المحددة من السياق، ثم اختر الصورة التي تعبّر عن معناها بشكل صحيح.</p>
      </div>
      <form id="start-form" novalidate dir="rtl">
        <label for="student-name">اسم الطالب</label>
        <div class="input-wrap">
          <input id="student-name" name="studentName" type="text" autocomplete="name" maxlength="${quizConfig.maxNameLength}" placeholder="اكتب اسمك هنا" value="${esc(state.studentName)}" aria-describedby="name-error" ${error ? 'aria-invalid="true"' : ""}/>
        </div>
        <p id="name-error" class="field-error" role="alert">${esc(error)}</p>
        <button class="primary-btn" type="submit">ابدأ الكوز <span aria-hidden="true">←</span></button>
      </form>
      <p class="intro-note" dir="rtl">اكتب اسمك للبدء.</p>
    </section>
  </main>`;
  document.querySelector("#start-form").addEventListener("submit", startQuiz);
}

function startQuiz(event) {
  event.preventDefault();
  const input = document.querySelector("#student-name");
  const name = input.value.trim().replace(/\s+/g, " ");
  if (!name) {
    state.studentName = input.value;
    renderIntro("يرجى كتابة اسمك للبدء.");
    document.querySelector("#student-name").focus();
    return;
  }
  state = { ...state, status:"active", studentName:name.slice(0,quizConfig.maxNameLength), questions:prepareQuestions(quizData, quizConfig), currentQuestionIndex:0, answers:{}, startTime:new Date().toISOString(), completedTime:null, locked:false, practiceFeedback:null, reviewOpen:false, introNoticeSeen:false };
  persist();
  transitionRender(() => window.scrollTo({ top:0, behavior:"smooth" }));
}

function sentenceMarkup(q) {
  return highlightSentence(q.sentence, q.word).map(p => p.highlight ? `<mark>${esc(p.text)}</mark>` : esc(p.text)).join("");
}

function formatTimeTaken(startTime, completedTime) {
  const start = Date.parse(startTime);
  const end = Date.parse(completedTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
  const totalSeconds = Math.floor((end - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function renderQuizNotice() {
  root.innerHTML = `<main class="quiz-notice-screen" dir="rtl">
    <section class="quiz-notice-card" role="status">
      ${logoMarkup()}
      <div class="quiz-notice-symbol" aria-hidden="true">!</div>
      <h1>قبل أن تبدأ</h1>
      <p>اختر صورة واحدة فقط لكل سؤال. <strong>اختيارك الأول نهائي</strong> وسيُحتسب ضمن نتيجتك، لذلك تأكد من إجابتك قبل الضغط على الصورة.</p>
      <div class="notice-loading" aria-hidden="true"><span></span></div>
    </section>
  </main>`;
  window.setTimeout(() => {
    state.introNoticeSeen = true;
    transitionRender(() => window.scrollTo({ top:0, behavior:"auto" }));
  }, 5000);
}

function renderQuiz() {
  if (!state.introNoticeSeen && state.currentQuestionIndex === 0) {
    renderQuizNotice();
    return;
  }
  const q = state.questions[state.currentQuestionIndex];
  const total = state.questions.length;
  const answered = Boolean(state.answers[q.id]);
  const progress = ((state.currentQuestionIndex + 1) / total) * 100;
  root.innerHTML = `<main class="quiz-page">
    <header class="quiz-header">
      <div class="quiz-header-inner">
        ${logoMarkup()}
        <div class="student-chip" dir="rtl" aria-label="اسم الطالب">
          <span>الطالب:</span>
          <strong title="${esc(state.studentName)}">${esc(state.studentName)}</strong>
        </div>
      </div>
    </header>
    <section class="quiz-content">
      <div class="progress-row"><span>Question <strong>${state.currentQuestionIndex + 1}</strong> of ${total}</span><span>${Math.round(progress)}%</span></div>
      <div class="progress-track" aria-label="Quiz progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><div style="width:${progress}%"></div></div>
      <article class="question-card">
        <span class="eyebrow">TARGET WORD</span>
        <div class="word-row">
          <h1 class="target-word">${esc(q.word)}</h1>
          <button type="button" class="speak-btn" aria-label="استمع إلى نطق كلمة ${esc(q.word)}" title="استمع إلى النطق" data-word="${esc(q.word)}">
            <span aria-hidden="true">🔊</span>
          </button>
        </div>
        <p class="sentence">${sentenceMarkup(q)}</p>
        <div class="divider"></div>
        <div class="choice-heading" dir="rtl"><h2>اختر الصورة الأنسب</h2><span>اختر إجابة واحدة فقط</span></div>
        
        <div class="image-grid" role="radiogroup" aria-label="Image answers">
          ${q.images.map((img, idx) => imageChoice(q, img, idx)).join("")}
        </div>
        <div id="feedback" class="feedback" aria-live="polite">${feedbackMarkup(q)}</div>
        <div class="question-actions">
          <span class="selection-hint">${answered ? "تم تسجيل إجابتك" : "اختر صورة للمتابعة"}</span>
          <div class="question-action-buttons">
            <button id="end-quiz-btn" class="end-quiz-btn" type="button">إنهاء الكوز</button>
            <button id="next-btn" class="primary-btn next-btn" ${answered && !state.locked ? "" : "disabled"}>${state.currentQuestionIndex === total - 1 ? "إنهاء وإظهار النتيجة" : "السؤال التالي"} <span aria-hidden="true">←</span></button>
          </div>
        </div>
      </article>
    </section>
  </main>`;
  document.querySelectorAll(".image-choice").forEach(btn => btn.addEventListener("click", () => selectAnswer(q.id, btn.dataset.imageId)));
  document.querySelector(".speak-btn")?.addEventListener("click", event => speakWord(event.currentTarget.dataset.word, event.currentTarget));
  document.querySelector("#next-btn").addEventListener("click", nextQuestion);
  document.querySelector("#end-quiz-btn")?.addEventListener("click", showEndQuizConfirm);
  preloadNext();
}

function speakWord(word, button) {
  if (!("speechSynthesis" in window) || !word) {
    button?.setAttribute("title", "النطق غير متاح على هذا الجهاز");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  button?.classList.add("speaking");
  utterance.onend = () => button?.classList.remove("speaking");
  utterance.onerror = () => button?.classList.remove("speaking");
  window.speechSynthesis.speak(utterance);
}

function imageChoice(q, img, idx) {
  const selected = state.answers[q.id] === img.id;
  const feedbackVisible = quizConfig.mode === "practice" && Boolean(state.practiceFeedback);
  const isCorrect = feedbackVisible && img.id === q.correctImageId;
  const isWrongSelection = feedbackVisible && selected && img.id !== q.correctImageId;
  const feedbackClass = isCorrect ? "answer-correct" : isWrongSelection ? "answer-incorrect" : "";
  return `<button type="button" class="image-choice ${selected ? "selected" : ""} ${feedbackClass}" data-image-id="${esc(img.id)}" role="radio" aria-checked="${selected}" aria-label="Image option ${idx + 1}">
    <span class="image-frame">
      <span class="image-loader" aria-hidden="true"></span>
      <img src="${esc(img.src)}" alt="${esc(img.alt || `Visual answer option ${idx + 1}`)}" loading="${idx < 2 ? "eager" : "lazy"}" decoding="async">
      <span class="broken-placeholder" aria-hidden="true"><span>Image unavailable</span></span>
    </span>
    <span class="choice-indicator" aria-hidden="true">✓</span>
  </button>`;
}

function wireImages() {
  document.querySelectorAll(".image-choice img").forEach(img => {
    const done = () => img.closest(".image-frame")?.classList.add("loaded");
    img.addEventListener("load", done, { once:true });
    img.addEventListener("error", () => {
      const frame = img.closest(".image-frame");
      frame?.classList.add("loaded","broken");
      img.hidden = true;
    }, { once:true });
    if (img.complete && img.naturalWidth) done();
  });
}

function selectAnswer(questionId, imageId) {
  if (state.locked) return;
  if (quizConfig.mode === "practice" && state.answers[questionId]) return;
  state.answers = { ...state.answers, [questionId]: imageId };
  if (quizConfig.mode === "practice") {
    const q = state.questions[state.currentQuestionIndex];
    state.practiceFeedback = imageId === q.correctImageId ? "correct" : "incorrect";
  }
  persist();
  renderQuiz();
  wireImages();
}

function feedbackMarkup(q) {
  if (quizConfig.mode !== "practice" || !state.practiceFeedback || !state.answers[q.id]) return "";
  return state.practiceFeedback === "correct"
    ? '<span class="feedback-icon">✓</span><strong>إجابة صحيحة.</strong> أحسنت، هذه الصورة تطابق معنى الكلمة في سياق الجملة.'
    : '<span class="feedback-icon">!</span><strong>إجابة غير صحيحة.</strong> تم تسجيل اختيارك، والصورة الصحيحة محددة باللون الأخضر.';
}

function showEndQuizConfirm() {
  if (document.querySelector(".end-quiz-dialog")) return;
  const overlay = document.createElement("div");
  overlay.className = "end-quiz-dialog";
  overlay.innerHTML = `<div class="end-quiz-modal" role="dialog" aria-modal="true" aria-labelledby="end-quiz-title" dir="rtl">
    <h2 id="end-quiz-title">إنهاء الكوز؟</h2>
    <p>سيتم إنهاء المحاولة الآن، وأي أسئلة لم تُجب عنها ستُحتسب ضمن النتيجة كإجابات غير صحيحة.</p>
    <div class="end-quiz-modal-actions">
      <button type="button" class="secondary-btn" id="cancel-end-quiz">متابعة الكوز</button>
      <button type="button" class="end-quiz-confirm" id="confirm-end-quiz">نعم، إنهاء الكوز</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
  overlay.querySelector("#cancel-end-quiz").addEventListener("click", close);
  overlay.querySelector("#confirm-end-quiz").addEventListener("click", () => {
    clearSession(quizConfig.storageKey);
    overlay.remove();
    state = {
      status: "intro",
      studentName: "",
      questions: [],
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      completedTime: null,
      locked: false,
      practiceFeedback: null,
      reviewOpen: false,
      introNoticeSeen: false
    };
    transitionRender(() => window.scrollTo({ top:0, behavior:"auto" }));
  });
  overlay.querySelector("#cancel-end-quiz").focus();
}

function nextQuestion() {
  const q = state.questions[state.currentQuestionIndex];
  if (state.locked || !state.answers[q.id]) return;
  state.locked = true;
  const button = document.querySelector("#next-btn");
  if (button) button.disabled = true;
  if (state.currentQuestionIndex >= state.questions.length - 1) {
    state.status = "complete";
    state.completedTime = new Date().toISOString();
    clearSession(quizConfig.storageKey);
    transitionRender();
    return;
  }
  state.currentQuestionIndex += 1;
  state.locked = false;
  state.practiceFeedback = null;
  persist();
  transitionRender(() => window.scrollTo({ top:0, behavior:"smooth" }));
}

function preloadNext() {
  const next = state.questions[state.currentQuestionIndex + 1];
  if (!next) return;
  next.images.forEach(item => { const img = new Image(); img.src = item.src; });
  wireImages();
}

function resultShareText() {
  const result = calculateResults(state.questions, state.answers);
  const failedWords = state.questions.filter(q => state.answers[q.id] !== q.correctImageId).map(q => q.word);
  return [
    "MEMGO ENGLISH — نتيجة الكوز",
    "",
    `اسم الطالب: ${state.studentName}`,
    `الدرجة: ${result.correct}/${result.total}`,
    `الكلمات التي أخفق بها: ${failedWords.length ? failedWords.join("، ") : "لا توجد — جميع الإجابات صحيحة"}`
  ].join("\n");
}

function shareResultOnTelegram() {
  const text = resultShareText();
  const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

function renderResults() {
  const result = calculateResults(state.questions, state.answers);
  root.innerHTML = `<main class="results-shell">
    <section class="results-card result-summary" dir="rtl">
      ${logoMarkup()}
      <div class="result-student">
        <span>اسم الطالب</span>
        <h1>${esc(state.studentName)}</h1>
      </div>
      <div class="result-score-main">
        <span>النتيجة</span>
        <strong>${result.correct}<small>/ ${result.total}</small></strong>
      </div>
      <div class="stats result-stats">
        <div><span>الإجابات الصحيحة</span><strong>${result.correct}</strong></div>
        <div><span>الأخطاء</span><strong>${result.incorrect}</strong></div>
        ${quizConfig.showTimeTakenOnResults ? `<div><span>الوقت المستغرق</span><strong dir="ltr">${formatTimeTaken(state.startTime, state.completedTime)}</strong></div>` : ""}
      </div>
    </section>
    ${reviewMarkup()}
    <section class="result-final-actions" dir="rtl" aria-label="خيارات النتيجة">
      <button id="telegram-share-btn" class="telegram-share-btn" type="button">مشاركة النتيجة عبر تيليجرام <span aria-hidden="true">↗</span></button>
      <button id="restart-btn" class="secondary-btn restart-result-btn" type="button">إعادة الكوز <span aria-hidden="true">↻</span></button>
    </section>
  </main>`;
  document.querySelector("#restart-btn").addEventListener("click", restart);
  document.querySelector("#telegram-share-btn")?.addEventListener("click", shareResultOnTelegram);
  wireImages();
}

function reviewMarkup() {
  const incorrectQuestions = state.questions.map((q,i) => ({q,i})).filter(({q}) => state.answers[q.id] !== q.correctImageId);
  if (!incorrectQuestions.length) {
    return `<section class="review-section" dir="rtl"><div class="review-title"><span class="eyebrow">مراجعة الإجابات</span><h2>لا توجد أخطاء 🎉</h2><p>جميع إجاباتك صحيحة.</p></div></section>`;
  }
  return `<section class="review-section" dir="rtl">
    <div class="review-title"><span class="eyebrow">مراجعة الأخطاء</span><h2>الأسئلة التي أخطأت بها</h2><p>راجع الكلمة والجملة، ثم شاهد الصورة الصحيحة.</p></div>
    <div class="review-list">${incorrectQuestions.map(({q,i}) => {
      const correct = q.images.find(img => img.id === q.correctImageId);
      return `<article class="review-card review-incorrect correct-only-review">
        <div class="review-copy"><span>السؤال ${i+1}</span><h3 dir="ltr">${esc(q.word)}</h3><p dir="ltr">${sentenceMarkup(q)}</p><div class="status is-incorrect"><span aria-hidden="true">!</span>إجابة خاطئة</div></div>
        <div class="review-images single-review-image">
          <figure><figcaption>الإجابة الصحيحة</figcaption>${reviewImage(correct)}</figure>
        </div>
      </article>`;
    }).join("")}</div></section>`;
}

function reviewImage(img) {
  if (!img) return '<div class="review-placeholder">الصورة غير متاحة</div>';
  return `<div class="review-image"><img src="${esc(img.src)}" alt="${esc(img.alt || "صورة الإجابة الصحيحة")}" loading="lazy"><span class="broken-placeholder">الصورة غير متاحة</span></div>`;
}

function restart() {
  clearSession(quizConfig.storageKey);
  state = { status:"intro", studentName:state.studentName, questions:[], currentQuestionIndex:0, answers:{}, startTime:null, completedTime:null, locked:false, practiceFeedback:null, reviewOpen:false, introNoticeSeen:false };
  transitionRender(() => document.querySelector("#student-name")?.focus());
}

function renderUnavailable(message) {
  root.innerHTML = `<main class="fallback-shell"><section class="fallback-card">${logoMarkup()}<span class="fallback-icon" aria-hidden="true">!</span><h1>Quiz temporarily unavailable</h1><p>${esc(message)}</p><p>Please try again after the quiz content has been updated.</p></section></main>`;
}

restore();
render();
wireImages();