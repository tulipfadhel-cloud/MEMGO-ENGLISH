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
  reviewOpen: false
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

function logoMarkup() {
  return `<div class="brand" aria-label="MEMGO ENGLISH">
    <div class="brand-mark" aria-hidden="true">M</div>
    <div><strong>MEMGO</strong><span>ENGLISH</span></div>
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
  state = { ...state, status:"active", studentName:saved.studentName.slice(0, quizConfig.maxNameLength), questions, currentQuestionIndex:saved.currentQuestionIndex, answers:saved.answers, startTime:saved.startTime };
}

function render() {
  document.title = "Visual Vocabulary Quiz | MEMGO ENGLISH";
  if (!validation.ok) return renderUnavailable(validation.reason);
  if (state.status === "intro") return renderIntro();
  if (state.status === "active") return renderQuiz();
  return renderResults();
}

function renderIntro(error = "") {
  root.innerHTML = `<main class="shell intro-shell">
    <section class="intro-card">
      ${logoMarkup()}
      <div class="intro-copy">
        <span class="eyebrow">VISUAL VOCABULARY</span>
        <h1>Understand words.<br><span>See the meaning.</span></h1>
        <p>Read the sentence and choose the image that best represents the highlighted word.</p>
      </div>
      <form id="start-form" novalidate>
        <label for="student-name">Student name</label>
        <div class="input-wrap">
          <input id="student-name" name="studentName" type="text" autocomplete="name" maxlength="${quizConfig.maxNameLength}" placeholder="Enter your name" value="${esc(state.studentName)}" aria-describedby="name-error" ${error ? 'aria-invalid="true"' : ""}/>
        </div>
        <p id="name-error" class="field-error" role="alert">${esc(error)}</p>
        <button class="primary-btn" type="submit">Start quiz <span aria-hidden="true">→</span></button>
      </form>
      <p class="intro-note">Your progress is saved on this device during an active attempt.</p>
    </section>
    <aside class="intro-aside" aria-hidden="true">
      <div class="visual-card visual-one"><span>WORD</span><strong>Context</strong></div>
      <div class="visual-card visual-two"><div class="mock-image"></div><div class="mock-image"></div></div>
      <div class="aside-caption"><span>01</span><p>Learn through context and visual understanding.</p></div>
    </aside>
  </main>`;
  document.querySelector("#start-form").addEventListener("submit", startQuiz);
}

function startQuiz(event) {
  event.preventDefault();
  const input = document.querySelector("#student-name");
  const name = input.value.trim().replace(/\s+/g, " ");
  if (!name) {
    state.studentName = input.value;
    renderIntro("Please enter your name to begin.");
    document.querySelector("#student-name").focus();
    return;
  }
  state = { ...state, status:"active", studentName:name.slice(0,quizConfig.maxNameLength), questions:prepareQuestions(quizData, quizConfig), currentQuestionIndex:0, answers:{}, startTime:new Date().toISOString(), completedTime:null, locked:false, practiceFeedback:null, reviewOpen:false };
  persist();
  render();
}

function sentenceMarkup(q) {
  return highlightSentence(q.sentence, q.word).map(p => p.highlight ? `<mark>${esc(p.text)}</mark>` : esc(p.text)).join("");
}

function renderQuiz() {
  const q = state.questions[state.currentQuestionIndex];
  const total = state.questions.length;
  const answered = Boolean(state.answers[q.id]);
  const progress = ((state.currentQuestionIndex + 1) / total) * 100;
  root.innerHTML = `<main class="quiz-page">
    <header class="quiz-header">
      ${logoMarkup()}
      <div class="student-chip"><span>Student</span><strong title="${esc(state.studentName)}">${esc(state.studentName)}</strong></div>
    </header>
    <section class="quiz-content">
      <div class="progress-row"><span>Question <strong>${state.currentQuestionIndex + 1}</strong> of ${total}</span><span>${Math.round(progress)}%</span></div>
      <div class="progress-track" aria-label="Quiz progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><div style="width:${progress}%"></div></div>
      <article class="question-card">
        <span class="eyebrow">TARGET WORD</span>
        <h1 class="target-word">${esc(q.word)}</h1>
        <p class="sentence">${sentenceMarkup(q)}</p>
        <div class="divider"></div>
        <div class="choice-heading"><h2>Choose the best image</h2><span>Select one answer</span></div>
        <div class="image-grid" role="radiogroup" aria-label="Image answers">
          ${q.images.map((img, idx) => imageChoice(q, img, idx)).join("")}
        </div>
        <div id="feedback" class="feedback" aria-live="polite">${feedbackMarkup(q)}</div>
        <div class="question-actions">
          <span class="selection-hint">${answered ? "Answer selected" : "Select an image to continue"}</span>
          <button id="next-btn" class="primary-btn next-btn" ${answered && !state.locked ? "" : "disabled"}>${state.currentQuestionIndex === total - 1 ? "Finish quiz" : "Next question"} <span aria-hidden="true">→</span></button>
        </div>
      </article>
    </section>
  </main>`;
  document.querySelectorAll(".image-choice").forEach(btn => btn.addEventListener("click", () => selectAnswer(q.id, btn.dataset.imageId)));
  document.querySelector("#next-btn").addEventListener("click", nextQuestion);
  preloadNext();
}

function imageChoice(q, img, idx) {
  const selected = state.answers[q.id] === img.id;
  return `<button type="button" class="image-choice ${selected ? "selected" : ""}" data-image-id="${esc(img.id)}" role="radio" aria-checked="${selected}" aria-label="Image option ${idx + 1}">
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
  state.answers = { ...state.answers, [questionId]: imageId };
  if (quizConfig.mode === "practice") {
    const q = state.questions[state.currentQuestionIndex];
    state.practiceFeedback = imageId === q.correctImageId ? "correct" : "incorrect";
  }
  persist();
  renderQuiz();
  wireImages();
  document.querySelector("#next-btn")?.focus();
}

function feedbackMarkup(q) {
  if (quizConfig.mode !== "practice" || !state.practiceFeedback || !state.answers[q.id]) return "";
  return state.practiceFeedback === "correct"
    ? '<span class="feedback-icon">✓</span><strong>Correct.</strong> That image matches the word in context.'
    : '<span class="feedback-icon">!</span><strong>Not quite.</strong> You can continue and review your answer later.';
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
    setTimeout(render, 120);
    return;
  }
  state.currentQuestionIndex += 1;
  state.locked = false;
  state.practiceFeedback = null;
  persist();
  setTimeout(() => { render(); wireImages(); window.scrollTo({ top:0, behavior:"smooth" }); }, 100);
}

function preloadNext() {
  const next = state.questions[state.currentQuestionIndex + 1];
  if (!next) return;
  next.images.forEach(item => { const img = new Image(); img.src = item.src; });
  wireImages();
}

function renderResults() {
  const result = calculateResults(state.questions, state.answers);
  root.innerHTML = `<main class="results-shell">
    <section class="results-card">
      ${logoMarkup()}
      <span class="eyebrow">QUIZ COMPLETE</span>
      <h1>Well done, ${esc(state.studentName)}.</h1>
      <p class="result-sub">Your visual vocabulary assessment is complete.</p>
      <div class="score-block"><strong>${result.correct}<span>/ ${result.total}</span></strong><em>${result.percentage}%</em></div>
      <div class="stats">
        <div><span>Correct</span><strong>${result.correct}</strong></div>
        <div><span>Incorrect</span><strong>${result.incorrect}</strong></div>
        <div><span>Total</span><strong>${result.total}</strong></div>
      </div>
      <div class="result-actions">
        ${quizConfig.enableReview ? '<button id="review-btn" class="secondary-btn">Review answers</button>' : ""}
        <button id="restart-btn" class="primary-btn">Restart quiz <span aria-hidden="true">↻</span></button>
      </div>
    </section>
    ${state.reviewOpen ? reviewMarkup() : ""}
  </main>`;
  document.querySelector("#restart-btn").addEventListener("click", restart);
  document.querySelector("#review-btn")?.addEventListener("click", () => { state.reviewOpen = !state.reviewOpen; renderResults(); wireImages(); });
  wireImages();
}

function reviewMarkup() {
  return `<section class="review-section"><div class="review-title"><span class="eyebrow">ANSWER REVIEW</span><h2>Your responses</h2></div>
    <div class="review-list">${state.questions.map((q,i) => {
      const selectedId = state.answers[q.id];
      const selected = q.images.find(img => img.id === selectedId);
      const correct = q.images.find(img => img.id === q.correctImageId);
      const isCorrect = selectedId === q.correctImageId;
      return `<article class="review-card">
        <div class="review-copy"><span>Question ${i+1}</span><h3>${esc(q.word)}</h3><p>${sentenceMarkup(q)}</p><div class="status ${isCorrect ? "is-correct" : "is-incorrect"}"><span aria-hidden="true">${isCorrect ? "✓" : "!"}</span>${isCorrect ? "Correct" : "Incorrect"}</div></div>
        <div class="review-images">
          <figure><figcaption>Your answer</figcaption>${reviewImage(selected)}</figure>
          <figure><figcaption>Correct image</figcaption>${reviewImage(correct)}</figure>
        </div>
      </article>`;
    }).join("")}</div></section>`;
}

function reviewImage(img) {
  if (!img) return '<div class="review-placeholder">No answer</div>';
  return `<div class="review-image"><img src="${esc(img.src)}" alt="${esc(img.alt || "Review image")}" loading="lazy"><span class="broken-placeholder">Image unavailable</span></div>`;
}

function restart() {
  clearSession(quizConfig.storageKey);
  state = { status:"intro", studentName:state.studentName, questions:[], currentQuestionIndex:0, answers:{}, startTime:null, completedTime:null, locked:false, practiceFeedback:null, reviewOpen:false };
  render();
  document.querySelector("#student-name")?.focus();
}

function renderUnavailable(message) {
  root.innerHTML = `<main class="fallback-shell"><section class="fallback-card">${logoMarkup()}<span class="fallback-icon" aria-hidden="true">!</span><h1>Quiz temporarily unavailable</h1><p>${esc(message)}</p><p>Please try again after the quiz content has been updated.</p></section></main>`;
}

restore();
render();
wireImages();