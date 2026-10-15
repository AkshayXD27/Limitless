const symptomForm = document.getElementById("symptomForm");

symptomForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = document.getElementById("symptomDescription").value.trim();
  const resultBox = document.getElementById("guidanceResult");
  const button = document.getElementById("guidanceButton");

  if (!description) {
    resultBox.textContent = "Please describe what you have been experiencing.";
    return;
  }

  button.disabled = true;
  button.textContent = "Preparing guidance…";

  try {
    const response = await fetch("/api/symptoms/guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to prepare guidance.");

    const card = document.createElement("div");
    card.className = `result-card ${data.result.level === "urgent" ? "urgent" : ""}`;
    const heading = document.createElement("h3");
    heading.textContent = data.result.title;
    const paragraph = document.createElement("p");
    paragraph.textContent = data.result.message;
    card.append(heading, paragraph);
    resultBox.replaceChildren(card);
  } catch (error) {
    resultBox.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Explore guidance →";
  }
});

document.getElementById("resourceSearch").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  document.querySelectorAll(".resource-card").forEach((card) => {
    card.style.display = !query || card.dataset.search.includes(query) ? "" : "none";
  });
});

// The interface dictionary is bundled locally so language switching works without sending
// private health details to a translation service. This is a demo dictionary, not a full-site translator.
const uiTranslations = {
  English: {},
  Telugu: {
    myProfile: "నా ప్రొఫైల్", region: "భౌగోళిక ప్రాంతం", medicalHistory: "వైద్య చరిత్ర", prescriptions: "గత చికిత్సలు & ప్రిస్క్రిప్షన్లు", currentMeds: "ప్రస్తుత మందులు", language: "భాష", community: "సముదాయం",
    privateSettings: "మీ వ్యక్తిగత వివరాలు", profileSettings: "ప్రొఫైల్ & ప్రాధాన్యతలు", privateNote: "ఈ వివరాలు మీ ఖాతాలో మాత్రమే ఉంటాయి; సముదాయంలో పోస్ట్ కావు.", regionLabel: "భౌగోళిక ప్రాంతం", preferredLanguage: "ఇష్టమైన భాష", medicalHistoryLabel: "వైద్య చరిత్ర (ఐచ్ఛికం)", pastPrescriptions: "గత చికిత్సలు & ప్రిస్క్రిప్షన్లు", currentMedsLabel: "ప్రస్తుతం వాడుతున్న మందులు (ఉంటే)", healthPrivacy: "ఆరోగ్య సమాచారం సున్నితమైనది. ఈ డెమోలో సేవ్ చేయాలనుకునే వివరాలనే నమోదు చేయండి.", saveProfile: "వ్యక్తిగత ప్రొఫైల్ సేవ్ చేయండి", safeSpace: "సహాయక వేదిక", communityTitle: "సఖి సముదాయం", communityIntro: "మీ అనుభవాలను పంచుకోండి, సాధారణ ప్రశ్నలు అడగండి, పరస్పరం గౌరవంగా తోడ్పడండి.", communitySafetyTitle: "కొన్ని భద్రతా సూచనలు", communitySafety: "కావాలంటే మారుపేరు వాడండి. ఫోన్ నంబర్లు, గుర్తించే వివరాలు లేదా ప్రైవేట్ వైద్య రికార్డులు పోస్ట్ చేయవద్దు. ఇక్కడి పోస్టులు వైద్య సలహా కావు.", shareExperience: "మీ అనుభవాన్ని పంచుకోండి", publishPost: "సముదాయంలో పోస్ట్ చేయండి →", recentPosts: "సముదాయ సంభాషణలు", reportNote: "దుర్వినియోగంగా అనిపించే పోస్టులు లేదా వినియోగదారులను రిపోర్ట్ చేయండి."
  },
  Hindi: {
    myProfile: "मेरी प्रोफ़ाइल", region: "भूगोल / क्षेत्र", medicalHistory: "चिकित्सा इतिहास", prescriptions: "पिछला इलाज और प्रिस्क्रिप्शन", currentMeds: "वर्तमान दवाएँ", language: "भाषा", community: "समुदाय",
    privateSettings: "आपकी निजी जानकारी", profileSettings: "प्रोफ़ाइल और प्राथमिकताएँ", privateNote: "ये विवरण आपके खाते में निजी रहते हैं और समुदाय में पोस्ट नहीं होते।", regionLabel: "भूगोल / क्षेत्र", preferredLanguage: "पसंदीदा भाषा", medicalHistoryLabel: "चिकित्सा इतिहास (वैकल्पिक)", pastPrescriptions: "पिछला इलाज और प्रिस्क्रिप्शन", currentMedsLabel: "वर्तमान दवाएँ (यदि लेते हैं)", healthPrivacy: "स्वास्थ्य जानकारी संवेदनशील है। इस डेमो में केवल वही जानकारी सेव करें जिसे आप रखना चाहते हैं।", saveProfile: "निजी प्रोफ़ाइल सेव करें", safeSpace: "सहयोग का सुरक्षित स्थान", communityTitle: "सखी समुदाय", communityIntro: "अपने अनुभव साझा करें, सामान्य प्रश्न पूछें और सम्मानपूर्वक एक-दूसरे का समर्थन करें।", communitySafetyTitle: "कुछ सुरक्षा सुझाव", communitySafety: "चाहें तो उपनाम इस्तेमाल करें। संपर्क विवरण, पहचान बताने वाली जानकारी या निजी मेडिकल रिकॉर्ड पोस्ट न करें। समुदाय की पोस्ट चिकित्सा सलाह नहीं हैं।", shareExperience: "अपना अनुभव साझा करें", publishPost: "समुदाय में पोस्ट करें →", recentPosts: "समुदाय की बातचीत", reportNote: "अपमानजनक पोस्ट या उपयोगकर्ताओं की रिपोर्ट करें।"
  },
  Kannada: {
    myProfile: "ನನ್ನ ಪ್ರೊಫೈಲ್", region: "ಭೌಗೋಳಿಕ ಪ್ರದೇಶ", medicalHistory: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ", prescriptions: "ಹಿಂದಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು", currentMeds: "ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು", language: "ಭಾಷೆ", community: "ಸಮುದಾಯ",
    privateSettings: "ನಿಮ್ಮ ಖಾಸಗಿ ವಿವರಗಳು", profileSettings: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಆದ್ಯತೆಗಳು", privateNote: "ಈ ವಿವರಗಳು ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಖಾಸಗಿಯಾಗಿರುತ್ತವೆ; ಸಮುದಾಯದಲ್ಲಿ ಪ್ರಕಟವಾಗುವುದಿಲ್ಲ.", regionLabel: "ಭೌಗೋಳಿಕ ಪ್ರದೇಶ", preferredLanguage: "ಆದ್ಯತೆಯ ಭಾಷೆ", medicalHistoryLabel: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ (ಐಚ್ಛಿಕ)", pastPrescriptions: "ಹಿಂದಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು", currentMedsLabel: "ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು (ಬಳಸುತ್ತಿದ್ದರೆ)", healthPrivacy: "ಆರೋಗ್ಯ ಮಾಹಿತಿ ಸೂಕ್ಷ್ಮವಾಗಿದೆ. ಈ ಡೆಮೊದಲ್ಲಿ ಉಳಿಸಲು ಬಯಸುವ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ನಮೂದಿಸಿ.", saveProfile: "ಖಾಸಗಿ ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ", safeSpace: "ಬೆಂಬಲದ ಸ್ಥಳ", communityTitle: "ಸಖಿ ಸಮುದಾಯ", communityIntro: "ಅನುಭವಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ, ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ಮತ್ತು ಪರಸ್ಪರ ಗೌರವದಿಂದ ಬೆಂಬಲಿಸಿ.", communitySafetyTitle: "ಕೆಲವು ಸುರಕ್ಷತಾ ಸೂಚನೆಗಳು", communitySafety: "ಬಯಸಿದರೆ ಅಡ್ಡಹೆಸರು ಬಳಸಿ. ಸಂಪರ್ಕ ವಿವರಗಳು ಅಥವಾ ಖಾಸಗಿ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ಪ್ರಕಟಿಸಬೇಡಿ. ಸಮುದಾಯದ ಪೋಸ್ಟ್‌ಗಳು ವೈದ್ಯಕೀಯ ಸಲಹೆಯಲ್ಲ.", shareExperience: "ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ", publishPost: "ಸಮುದಾಯಕ್ಕೆ ಪೋಸ್ಟ್ ಮಾಡಿ →", recentPosts: "ಸಮುದಾಯ ಸಂಭಾಷಣೆಗಳು", reportNote: "ಅಸಭ್ಯ ಪೋಸ್ಟ್‌ಗಳು ಅಥವಾ ಬಳಕೆದಾರರನ್ನು ವರದಿ ಮಾಡಿ."
  },
  Tamil: {
    myProfile: "என் சுயவிவரம்", region: "புவியியல் / பகுதி", medicalHistory: "மருத்துவ வரலாறு", prescriptions: "முந்தைய சிகிச்சை மற்றும் மருந்துச் சீட்டுகள்", currentMeds: "தற்போதைய மருந்துகள்", language: "மொழி", community: "சமூகம்",
    privateSettings: "உங்கள் தனிப்பட்ட விவரங்கள்", profileSettings: "சுயவிவரம் மற்றும் விருப்பங்கள்", privateNote: "இந்த விவரங்கள் உங்கள் கணக்கில் தனிப்பட்டவை; சமூகத்தில் பகிரப்படாது.", regionLabel: "புவியியல் / பகுதி", preferredLanguage: "விருப்பமான மொழி", medicalHistoryLabel: "மருத்துவ வரலாறு (விருப்பம்)", pastPrescriptions: "முந்தைய சிகிச்சை மற்றும் மருந்துச் சீட்டுகள்", currentMedsLabel: "தற்போதைய மருந்துகள் (இருந்தால்)", healthPrivacy: "உடல்நலத் தகவல் முக்கியமானது. இந்த டெமோவில் சேமிக்க விரும்புவதை மட்டும் உள்ளிடவும்.", saveProfile: "தனிப்பட்ட சுயவிவரத்தைச் சேமிக்கவும்", safeSpace: "ஆதரவான இடம்", communityTitle: "சகி சமூகம்", communityIntro: "உங்கள் அனுபவங்களைப் பகிர்ந்து, பொதுவான கேள்விகளைக் கேட்டு, மரியாதையுடன் ஒருவருக்கொருவர் ஆதரவு அளிக்கவும்.", communitySafetyTitle: "சில பாதுகாப்பு நினைவூட்டல்கள்", communitySafety: "விரும்பினால் புனைப்பெயரைப் பயன்படுத்தவும். தொடர்பு விவரங்கள் அல்லது தனிப்பட்ட மருத்துவப் பதிவுகளைப் பகிர வேண்டாம். சமூகப் பதிவுகள் மருத்துவ ஆலோசனை அல்ல.", shareExperience: "உங்கள் அனுபவத்தைப் பகிரவும்", publishPost: "சமூகத்தில் பதிவிடு →", recentPosts: "சமூக உரையாடல்கள்", reportNote: "தவறான பதிவுகள் அல்லது பயனர்களைப் புகாரளிக்கவும்."
  }
};

function applyInterfaceLanguage(language) {
  const dictionary = uiTranslations[language] || uiTranslations.English;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (dictionary[key]) element.textContent = dictionary[key];
  });
  document.documentElement.lang = ({ English: "en", Telugu: "te", Hindi: "hi", Kannada: "kn", Tamil: "ta" })[language] || "en";
}

const languageSelect = document.getElementById("languageSelect");
if (languageSelect) {
  languageSelect.addEventListener("change", () => applyInterfaceLanguage(languageSelect.value));
  applyInterfaceLanguage(languageSelect.value || window.SAKHI_PROFILE_LANGUAGE || "English");
}

const profileForm = document.getElementById("extendedProfileForm");
if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("profileSaveStatus");
    const button = profileForm.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Saving…";
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: document.getElementById("regionInput").value,
          medicalHistory: document.getElementById("medicalHistoryInput").value,
          prescriptions: document.getElementById("prescriptionsInput").value,
          medications: document.getElementById("medicationsInput").value,
          language: languageSelect.value
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save profile.");
      status.textContent = "Saved to this demo account.";
      applyInterfaceLanguage(languageSelect.value);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

const communityFeed = document.getElementById("communityFeed");
const communityForm = document.getElementById("communityPostForm");
const communityText = document.getElementById("communityPostText");
const communityStatus = document.getElementById("communityStatus");
const charCount = document.getElementById("postCharCount");
if (communityText && charCount) communityText.addEventListener("input", () => { charCount.textContent = communityText.value.length; });

function escapeCommunityText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function formatPostDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function renderCommunityPosts(posts) {
  if (!communityFeed) return;
  communityFeed.replaceChildren();
  if (!posts.length) {
    const empty = document.createElement("p");
    empty.className = "muted-note";
    empty.textContent = "No posts yet. If you feel comfortable, start the conversation.";
    communityFeed.append(empty);
    return;
  }
  posts.forEach((post) => {
    const article = document.createElement("article");
    article.className = "community-post";
    article.dataset.postId = post.id;
    article.innerHTML = `<div class="community-post-head"><div class="community-author"><span class="community-author-avatar">♡</span><span>${escapeCommunityText(post.author)}</span></div><time>${escapeCommunityText(formatPostDate(post.createdAt))}</time></div><p class="community-post-text">${escapeCommunityText(post.text)}</p><div class="community-post-actions"></div>`;
    const actions = article.querySelector(".community-post-actions");
    if (!post.own) {
      const reportButton = document.createElement("button");
      reportButton.type = "button";
      reportButton.className = "report-button";
      reportButton.textContent = "⚑ Report post / user";
      reportButton.addEventListener("click", () => showReportDialog(post.id));
      actions.append(reportButton);
    } else {
      const ownLabel = document.createElement("span");
      ownLabel.className = "muted-note";
      ownLabel.textContent = "Your post";
      actions.append(ownLabel);
    }
    communityFeed.append(article);
  });
}
async function loadCommunityPosts() {
  if (!communityFeed) return;
  try {
    const response = await fetch("/api/community/posts");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load posts.");
    renderCommunityPosts(data.posts || []);
  } catch (error) {
    communityFeed.textContent = error.message;
  }
}
function showReportDialog(postId) {
  const backdrop = document.createElement("div");
  backdrop.className = "report-modal-backdrop";
  backdrop.innerHTML = `<form class="report-modal"><h3>Report this post or user</h3><p>Choose the closest reason. Reports are stored in this hackathon demo; there is no live moderator yet.</p><label for="reportReason">Reason for report</label><select id="reportReason" class="form-select" required><option value="">Select a reason</option><option>Harassment or bullying</option><option>Hate speech or discrimination</option><option>Spam or scam</option><option>Sharing private information</option><option>Dangerous medical misinformation</option><option>Other inappropriate content</option></select><div class="d-flex justify-content-end gap-2"><button type="button" class="btn btn-outline-sakhi" data-cancel>Cancel</button><button type="submit" class="btn btn-sakhi">Submit report</button></div><div class="community-status" role="status"></div></form>`;
  document.body.append(backdrop);
  const form = backdrop.querySelector("form");
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) backdrop.remove(); });
  backdrop.querySelector("[data-cancel]").addEventListener("click", () => backdrop.remove());
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('[role="status"]');
    button.disabled = true;
    try {
      const response = await fetch(`/api/community/posts/${encodeURIComponent(postId)}/report`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: form.querySelector("select").value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit report.");
      status.textContent = data.message;
      await loadCommunityPosts();
      setTimeout(() => backdrop.remove(), 1200);
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
    }
  });
}
if (communityForm) {
  communityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = communityText.value.trim();
    if (text.length < 3) { communityStatus.textContent = "Please write at least 3 characters."; return; }
    const button = communityForm.querySelector('button[type="submit"]');
    button.disabled = true;
    communityStatus.textContent = "Publishing…";
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to publish post.");
      communityText.value = "";
      charCount.textContent = "0";
      communityStatus.textContent = "Your post has been shared with this demo community.";
      await loadCommunityPosts();
    } catch (error) {
      communityStatus.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  loadCommunityPosts();
}
