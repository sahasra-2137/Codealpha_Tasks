        let typingTimer;
        const inputText =
            document.getElementById("inputText");

        const outputText =
            document.getElementById("outputText");

        const sourceLang =
            document.getElementById("sourceLang");

        const targetLang =
            document.getElementById("targetLang");

        const charCount =
            document.getElementById("charCount");

        const detectedBox =
            document.getElementById("detectedBox");

        const meaningBox =
            document.getElementById("meaningBox");

        const historyContainer =
            document.getElementById("historyContainer");

        const voiceBox =
            document.getElementById("voiceBox");
        const detectedLanguage =
    document.getElementById("detectedLanguage");
        const languageNames = {
            en: "English 🇬🇧",
            te: "Telugu 🇮🇳",
            hi: "Hindi 🇮🇳",
            ta: "Tamil 🇮🇳",
            ml: "Malayalam 🇮🇳",
            kn: "Kannada 🇮🇳",
            fr: "French 🇫🇷",
            de: "German 🇩🇪",
            es: "Spanish 🇪🇸",
            ja: "Japanese 🇯🇵",
            ko: "Korean 🇰🇷"

};
        let voices = [];
        window.speechSynthesis.onvoiceschanged = () => {
            voices =
                window.speechSynthesis.getVoices();
            console.log(voices);
        };
        inputText.addEventListener("input", () => {
    charCount.innerText =
        inputText.value.length + " Characters";
    clearTimeout(typingTimer);
    if (inputText.value.trim() === "") {
        outputText.value = "";
        return;
    }
    let liveMode =
        document.getElementById("liveMode");
    if (liveMode.checked) {
        outputText.value =
            "Typing...";
        typingTimer =
            setTimeout(() => {
                translateText();
            }, 800);
    }
});
async function detectLanguage(text) {
    try {
        let url =
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        let response = await fetch(url);
        let data = await response.json();
        return data[8]?.[0]?.[0] || data[2] || "en";
    }
    catch(error) {
        console.log(error);
        return "en";
    }
}
async function translateText() {
    let text = inputText.value.trim();
    if (text === "") {
        alert("Please enter some text");
        return;
    }
    let source;
    if (sourceLang.value === "auto") {
        source = await detectLanguage(text);
        console.log("Detected:", source);
        detectedLanguage.style.display = "block";
        detectedLanguage.innerHTML =
            `<b>Detected Language:</b><br>
            ${languageNames[source] || source}`;
    } else {
        source = sourceLang.value;
    }
    let target = targetLang.value;
    outputText.value = "Translating...";
    outputText.classList.add("loading");
    detectedBox.style.display = "none";
    meaningBox.style.display = "none";
    try {
        const transliterationLanguages =
            ["te", "hi", "ta", "ml", "kn","bn","gu", "mr","pa", "or", "as", "ur"];
        let transliteratedText = "";
        if (
            transliterationLanguages.includes(source) &&
            /^[a-zA-Z\s.,!?'-]+$/.test(text)
        ) {
            let translitUrl =
                `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${source}-t-i0-und&num=1`;
            let translitResponse =
                await fetch(translitUrl);
            let translitData =
                await translitResponse.json();
            if (translitData[0] === "SUCCESS") {
                transliteratedText =
                    translitData[1][0][1][0];
                text = transliteratedText;
                detectedBox.style.display = "block";
                detectedBox.innerHTML =
                    `<b>Detected Script:</b><br>${transliteratedText}`;
            }
        }
        if (
    transliterationLanguages.includes(source) &&
    /^[a-zA-Z\s.,!?'-]+$/.test(text)
) {
    let translitUrl =
        `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${source}-t-i0-und&num=1`;
    let translitResponse =
        await fetch(translitUrl);
    let translitData =
        await translitResponse.json();
    if (translitData[0] === "SUCCESS") {
        transliteratedText =
            translitData[1][0][1][0];
        text = transliteratedText;
        detectedBox.style.display = "block";
        detectedBox.innerHTML =
            `<b>Detected Script:</b><br>${transliteratedText}`;
    }
}
const romanizedMap = {
    "annyeong": "안녕하세요",
    "annyeonghaseyo": "안녕하세요",
    "konnichiwa": "こんにちは",
    "arigato": "ありがとう",
    "arigatou": "ありがとう",
    "ni hao": "你好",
    "xie xie": "谢谢"
};
let lowerText = text.toLowerCase().trim();
if (romanizedMap[lowerText]) {
    text = romanizedMap[lowerText];
    detectedBox.style.display = "block";
    detectedBox.innerHTML =
        `<b>Converted Script:</b><br>${text}`;
}
        let translateUrl =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        let response =
            await fetch(translateUrl);
        let data =
            await response.json();
        let translated =
            data[0]
                .map(item => item[0])
                .join("");
        outputText.value = translated;
        outputText.classList.remove("loading");
        meaningBox.style.display = "block";
        meaningBox.innerHTML =
            `<b>Meaning:</b><br>${translated}`;
        saveHistory(
            inputText.value,
            translated
        );
    }
    catch (error) {
        console.log(error);
        outputText.value = "Translation failed!";
        outputText.classList.remove("loading");
    }
}
        function speakInputText() {
            let text =
                inputText.value;
            if (text.trim() === "") {
                alert("No input text!");
                return;
            }
            window.speechSynthesis.cancel();
            let speech =
                new SpeechSynthesisUtterance(text);
            speech.lang =
                sourceLang.value;
            speech.rate = 1;
            speech.pitch = 1;
            speech.volume = 1;
            window.speechSynthesis.speak(speech);
        }
        function speakTranslatedText() {
            let translated =
                outputText.value;
            if (translated.trim() === "") {
                alert("No translated text!");
                return;
            }
            window.speechSynthesis.cancel();
            let speech =
                new SpeechSynthesisUtterance(translated);
            speech.rate = 1;
            speech.pitch = 1;
            speech.volume = 1;
            let selectedVoice =
                voices.find(voice =>
                    voice.lang.toLowerCase().includes(
                        targetLang.value.toLowerCase()
                    )
                );
            if (selectedVoice) {
                speech.voice =
                    selectedVoice;
                voiceBox.style.display =
                    "block";
                voiceBox.innerHTML =
                    `🎤 Voice Used: <b>${selectedVoice.name}</b>`;
            }
            else {
                voiceBox.style.display =
                    "block";
                voiceBox.innerHTML =
                    `⚠ Voice for this language may not be available in your browser`;
            }
            speech.lang =
                targetLang.value;
            window.speechSynthesis.speak(speech);
        }
        function copyText() {
            navigator.clipboard.writeText(
                outputText.value
            );
            alert("Copied Successfully!");
        }
        function swapLanguages() {
            let tempLang =
                sourceLang.value;
            sourceLang.value =
                targetLang.value;
            targetLang.value =
                tempLang;
            let tempText =
                inputText.value;
            inputText.value =
                outputText.value;
            outputText.value =
                tempText;
        }
        function clearAll() {
            inputText.value = "";
            outputText.value = "";
            detectedLanguage.style.display ="none";
            detectedBox.style.display =
                "none";
            meaningBox.style.display =
                "none";
            voiceBox.style.display =
                "none";
            charCount.innerText =
                "0 Characters";
        }
        function startVoiceInput() {
            if (!('webkitSpeechRecognition' in window)) {
                alert("Speech Recognition not supported!");
                return;
            }
            const recognition =
                new webkitSpeechRecognition();
            recognition.lang =
                sourceLang.value;
            recognition.start();
            recognition.onresult =
                function (event) {
                    inputText.value =
                        event.results[0][0].transcript;
                    charCount.innerText =
                        inputText.value.length + " Characters";
                };
        }
        function saveHistory(input, output) {
            let history =
                JSON.parse(localStorage.getItem("translationHistory")) || [];
            history.unshift({
                input,
                output
            });
            if (history.length > 5) {
                history.pop();
            }
            localStorage.setItem(
                "translationHistory",
                JSON.stringify(history)
            );
            loadHistory();
        }
        function loadHistory() {
            let history =
                JSON.parse(localStorage.getItem("translationHistory")) || [];
            historyContainer.innerHTML = "";
            history.forEach(item => {
                historyContainer.innerHTML +=`
                <div class="history-item">
                    <b>Input:</b> ${item.input}<br>
                    <b>Output:</b> ${item.output}
                </div>
                `;
            });
        }
        loadHistory();