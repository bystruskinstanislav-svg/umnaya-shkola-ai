const $ = (selector) => document.querySelector(selector);
const conversation = $('#conversation');
const question = $('#question');
const voiceStatus = $('#voiceStatus');
let chosenSubject = 'Математика';

const lessons = [
  { match: /делен|столбик/i, answer: 'Деление столбиком — это способ делить большие числа по частям. Например, 84 ÷ 4: сначала делим 8 десятков на 4 и получаем 2 десятка, затем 4 единицы на 4 — получаем 1. Ответ: 21. Хочешь решить похожий пример: 96 ÷ 3?' },
  { match: /дроб/i, answer: 'Дробь показывает часть целого. В дроби 3/4 число 4 говорит, на сколько равных частей разделили целое, а 3 — сколько таких частей взяли.' },
  { match: /част.*реч|существ|глагол|прилагат/i, answer: 'Части речи помогают понять роль слова. Существительное называет предмет, прилагательное — его признак, а глагол — действие. В предложении «Весёлый щенок бежит» это: прилагательное, существительное и глагол.' },
  { match: /привет|здравств/i, answer: 'Привет! Я рядом. Выбери предмет и расскажи, что показалось сложным.' }
];

function addMessage(text, who) {
  const item = document.createElement('div');
  item.className = `message ${who === 'child' ? 'child-message' : 'teacher-message'}`;
  item.textContent = text;
  conversation.append(item);
  conversation.scrollTop = conversation.scrollHeight;
}

function answerFor(text) {
  const lesson = lessons.find(({ match }) => match.test(text));
  return lesson?.answer || `Я услышал вопрос по предмету «${chosenSubject}». В этой демоверсии я пока лучше всего объясняю деление столбиком, дроби и части речи. Полноценные свободные ответы появятся после безопасного подключения ИИ.`;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.92;
  speechSynthesis.speak(utterance);
}

function ask(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage(clean, 'child');
  const answer = answerFor(clean);
  window.setTimeout(() => { addMessage(answer, 'teacher'); speak(answer); }, 350);
  question.value = '';
}

$('#questionForm').addEventListener('submit', (event) => { event.preventDefault(); ask(question.value); });
document.querySelectorAll('.subject').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.subject').forEach((item) => item.classList.remove('selected'));
  button.classList.add('selected'); chosenSubject = button.dataset.subject;
  addMessage(`Отлично, занимаемся предметом «${chosenSubject}». Что нужно объяснить?`, 'teacher');
}));
document.querySelectorAll('.mode').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
}));

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU'; recognition.interimResults = false;
  recognition.onstart = () => { $('#micButton').classList.add('listening'); voiceStatus.textContent = 'Слушаю… говори свой вопрос.'; };
  recognition.onend = () => { $('#micButton').classList.remove('listening'); voiceStatus.textContent = 'Нажми на микрофон, чтобы задать ещё один вопрос.'; };
  recognition.onerror = () => { voiceStatus.textContent = 'Не получилось распознать речь. Проверь разрешение на микрофон или напиши вопрос.'; };
  recognition.onresult = (event) => ask(event.results[0][0].transcript);
  $('#micButton').addEventListener('click', () => recognition.start());
} else {
  $('#micButton').disabled = true;
  voiceStatus.textContent = 'В этом браузере распознавание голоса недоступно. Можно написать вопрос; ответы всё равно будут озвучены.';
}

let deferredInstall;
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredInstall = event; $('#installButton').hidden = false; });
$('#installButton').addEventListener('click', async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('#installButton').hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
