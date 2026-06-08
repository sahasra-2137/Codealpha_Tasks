import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers';
import { FAQS } from "./FAQ's.js";
import { SMALL_TALK } from "./SmallTalk.js";
let faqEmbeddings = [];
async function buildFAQEmbeddings() {
    faqEmbeddings = [];
    for (const faq of FAQS) {
        const output =
            await window.featureExtractor(
                faq.q + " " + faq.a,
                {
                    pooling: 'mean',
                    normalize: true
                }
            );
        faqEmbeddings.push(output.data);
    }
    console.log("FAQ embeddings ready");
}
window.featureExtractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
);
console.log("Embedding model loaded");
await buildFAQEmbeddings();

function embeddingCosine(a, b) {

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {

        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dot;
}
async function semanticSearch(query) {

    const output =
        await window.featureExtractor(
            query,
            {
                pooling: 'mean',
                normalize: true
            }
        );

    const queryEmbedding = output.data;

    let bestScore = -1;
    let bestFAQ = null;

    for (let i = 0; i < faqEmbeddings.length; i++) {

        const score =
            embeddingCosine(
                queryEmbedding,
                faqEmbeddings[i]
            );

        if (score > bestScore) {

            bestScore = score;
            bestFAQ = FAQS[i];
        }
    }

    console.log("Best score:", bestScore);

    if (bestScore < 0.45)
        return null;

    return {
        faq: bestFAQ,
        score: bestScore
    };
}
let conversationStartTime = Date.now();
let lastFAQ = null;
let lastBotMessage = "";
const SUPPORT_PATTERNS = [
    "human support",
    "customer support",
    "live support",
    "talk to support",
    "talk to customer support",
    "talk to executive",
    "customer care",
    "customer service",
    "contact support",
    "contact customer care",
    "human agent",
    "live agent",
    "speak to agent",
    "speak to human",
    "connect me to support",
    "connect me to an agent",
    "representative",
    "call support",
    "call customer care"
];
const STOP_WORDS = new Set([
'a','an','the','is','are','was','were','be','been','being',
'have','has','had','do','does','did','will','would','could',
'should','may','might','i','you','we','they','he','she',
'it','my','your','our','their','this','that','these','those',
'and','or','but','in','on','at','to','for','of','with',
'by','from','about','how','what','when','where','who',
'which','can','not','me'
]);
function wantsHumanSupport(text) {

    const q = text.toLowerCase();

    return SUPPORT_PATTERNS.some(
        p => q.includes(p)
    );
}
function checkSmallTalk(text) {
  const lower = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g,'');
  for (const group of SMALL_TALK) {
    if (
      group.patterns.some(p => {
        if (p.includes(" ")) {
          return lower.includes(p);
        }
        return lower.split(/\s+/).includes(p);
      })
    ) {
      return group.responses[
        Math.floor(Math.random() * group.responses.length)
      ];
    }
  }
  return null;
}
function checkContextQuery(text) {

    if (!lastFAQ) return null;

    const q = text.toLowerCase();

    // Address FAQ follow-up
    if (
        lastFAQ.q.includes("delivery address")
    ) {

        if (
            q.includes("already shipped") ||
            q.includes("shipped") ||
            q.includes("chance")
        ) {

            return "If your order has already shipped, address changes may not be possible. Please contact customer support immediately and they will check whether any modifications can still be made.";
        }
    }

    // Tracking FAQ follow-up
    if (
        lastFAQ.q.includes("track my order")
    ) {

        if (
            q.includes("after that") ||
            q.includes("then") ||
            q.includes("next")
        ) {

            return "After tracking is available, you can monitor the shipment status through your account. Updates will appear as the package moves through the delivery process.";
        }
    }

    return null;
}
const FAQ_KEYWORDS = [
'pet',
'dog',
'cat',
'bird',
'fish',
'food',
'grooming',
'adoption',
'accessories',
'toy',
'bed',
'collar',
'leash',
'delivery',
'order',
'track',
'support'
];
function isFAQQuery(text) {
  return FAQ_KEYWORDS.some(k => text.toLowerCase().includes(k));
}

const msgsEl = document.getElementById('msgs');
const inputEl = document.getElementById('qInput');
const sendBtn = document.getElementById('sendBtn');

function addMsg(role, text, score) {
  if(role === 'bot'){
   lastBotMessage = text;
  }
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  const bub = document.createElement('div');
  bub.className = 'bubble';
  bub.style.whiteSpace = 'pre-line';
  bub.textContent = text;
  if(role === 'bot') {
    bub.style.position = "relative";
    const speakBtn = document.createElement("span");
    speakBtn.innerHTML = "🔉";
    speakBtn.style.position = "absolute";
    speakBtn.style.right = "8px";
    speakBtn.style.bottom = "4px";
    speakBtn.style.fontSize = "11px";
    speakBtn.style.cursor = "pointer";
    speakBtn.style.opacity = "0.6";
    speakBtn.onmouseover = () => {
        speakBtn.style.opacity = "1";
    };
    speakBtn.onmouseout = () => {
        speakBtn.style.opacity = "0.6";
    };
    speakBtn.onclick = () => {
        speechSynthesis.cancel();
          const utterance =
            new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
          speechSynthesis.speak(utterance);
    };
    bub.style.paddingBottom = "20px";
    bub.appendChild(speakBtn);
}
  div.appendChild(bub);
  if (score !== undefined) {
    const pct = Math.round(score * 100);
    const level = pct >= 70 ? 'high' : pct >= 40 ? 'med' : 'low';
    const label = pct >= 70 ? 'High confidence' : pct >= 40 ? 'Medium confidence' : 'Low confidence';
    const tag = document.createElement('span');
    tag.className = 'confidence conf-' + level;
    tag.textContent = label + ' · ' + pct + '%';
    div.appendChild(tag);
  }
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  div.appendChild(meta);
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot'; div.id = 'typing';
  const bub = document.createElement('div');
  bub.className = 'bubble typing';
  for(let i=0;i<3;i++){const d=document.createElement('div');d.className='dot';bub.appendChild(d);}
  div.appendChild(bub);
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}
function hideTyping() { const t=document.getElementById('typing'); if(t) t.remove(); }

const chips = ["Pet food?","Grooming services?","Pet adoption?","Track order?"
];
const sugEl = document.getElementById('suggestions');
chips.forEach(q => {
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.textContent = q;
  btn.onclick = () => ask(q);
  sugEl.appendChild(btn);
});
async function ask(q) {
  if (!window.featureExtractor || faqEmbeddings.length === 0) {
    addMsg(
        'bot',
        "I'm still loading my knowledge base. Please wait a few seconds and try again."
    );
    return;
}
  q = q.trim();
  if (!q) return;
  // 2. Normal QA Flow
  addMsg('user', q);
  inputEl.value = '';
  if (wantsHumanSupport(q)) {

    addMsg(
        'bot',
        "📞 Customer Support\n\nPhone: 1800-123-4567\nEmail: support@example.com\n\nAvailable Monday–Friday, 9 AM–6 PM IST."
    );
sendBtn.disabled = false;
    return;
}
  sendBtn.disabled = true;
  showTyping();
  
  await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
  hideTyping();

  // Context fallback check
  const contextReply = checkContextQuery(q);
  if (contextReply) {
    addMsg('bot', contextReply);
    sendBtn.disabled = false;
    return;
  }
  const smallTalkReply = checkSmallTalk(q);
if (smallTalkReply && q.trim().split(/\s+/).length <= 3) {
    addMsg('bot', smallTalkReply);
    sendBtn.disabled = false;
    return;
}
 // FAQ Vector Search
try {
    const result = await semanticSearch(q);
    if (result) {
        const { faq, score } = result;
        lastFAQ = faq;
        addMsg('bot', faq.a, score);
        sendBtn.disabled = false;
        return;
    }
}
catch (error) {
    console.error(error);
    addMsg(
        'bot',
        'Sorry, something went wrong while searching for an answer.'
    );
    sendBtn.disabled = false;
    return;
}
  addMsg(
  'bot',
  "Sorry, I couldn't find an answer for that. Please try rephrasing your question or contact support."
 );
 sendBtn.disabled = false;
}
sendBtn.onclick = () => ask(inputEl.value);
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !sendBtn.disabled) ask(inputEl.value); });
const micBtn = document.getElementById("micBtn");
// Voice To Text
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    micBtn.addEventListener("click", () => {
        recognition.start();
        micBtn.classList.add("listening");
    });
    recognition.onresult = (event) => {
        inputEl.value = event.results[0][0].transcript;
    };
    recognition.onend = () => {
        micBtn.classList.remove("listening");
    };
}
setTimeout(() => {
  addMsg('bot', "🐾 Hi! Welcome to Pet Paradise. I can help you with pet food, pet supplies, grooming, delivery, returns, and pet care questions!");
}, 300);
const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.textContent = "☀️";
}
themeToggle.addEventListener("click", () => {
    const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "🌙";
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "☀️";
    }
});