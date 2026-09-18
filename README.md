# 🛠️ AI Code Studio

Aapka apna, self-hosted, Claude-Code-jaisa coding assistant — Gemini ke
models ke saath, GitHub integration ke saath. **Personal/local use ke liye
bana hai** — apne PC ya apne VPS pe chalayein.

## Kya kya hai is mein

- 💬 Chat interface — Gemini se baat karein, code likhwayein
- 📁 File explorer — click karke koi bhi file khol/edit karein (Monaco editor)
- 💻 Real terminal — npm, python, git, koi bhi command — sab real chalta hai
- 🔀 Git & GitHub — repo banayein, init/commit/push/pull — sab UI se
- 📦 Zip upload/download — poora project upload ya download karein
- 🤖 Gemini model picker — Pro / Flash / Flash-Lite, sab latest models
- ⚡ **Auto mode** — task dekh kar khud sahi model choose karta hai
- 🔁 **Fallback chain** — ek model fail ho to khud agla try karta hai

## Setup (5 minute mein)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# .env kholein aur apni GEMINI_API_KEY + GITHUB_TOKEN daal dein
npm run dev
```

Backend `http://localhost:5175` pe chalega.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` pe khulega — browser mein open karein.

## API Keys kahan se milenge

- **Gemini API key**: https://aistudio.google.com/apikey
- **GitHub token**: https://github.com/settings/tokens (scope: `repo`)

## Zaroori: Security note

Ye tool **real shell commands chalata hai** aapke computer pe — bilkul
Claude Code ki tarah. Isay:
- ✅ Apne local machine pe chalayein
- ✅ Apne private VPS pe chalayein (jahan sirf aap access rakhte hain)
- ❌ Kabhi bhi public internet pe expose na karein bina authentication ke —
  koi bhi jo is URL tak pahunch jaye wo aapke computer pe commands chala
  sakta hai.

## Roadmap / Aage kya add ho sakta hai

- [ ] Multiple workspaces (abhi ek `my-project` folder fixed hai)
- [ ] Streaming chat responses (token-by-token)
- [ ] PDF create/edit + DOCX read/write (Python `pypdf`, `python-docx` ke zariye)
- [ ] xterm.js full terminal emulation (colors, interactive prompts)
- [ ] Multi-agent tool-calling (AI khud file read/write/run kare bina aapke command diye)

Ye ek solid foundation hai — is per aage build karte rahein. 🚀
