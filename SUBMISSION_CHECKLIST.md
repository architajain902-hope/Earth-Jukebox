# NASA INTERNATIONAL SPACE APPS CHALLENGE 2026: SUBMISSION CHECKLIST

**Project:** Earth 616: The Earth Information Jukebox  
**Local Event:** Bhopal, India  
**Challenge:** The Earth Information Jukebox  
**Submission Deadline:** Sunday 15 Nov, 11:59 PM IST  

---

## 📋 Portal Submission Requirements

Use this checklist to ensure 100% compliance before final submission on the Space Apps portal.

### 1. Team & Project Profile
- [ ] **Team Name:** Earth 616
- [ ] **Challenge Selected:** The Earth Information Jukebox
- [ ] **Team Roster:** All team members (up to 6) accepted and registered in the project roster.
- [ ] **Location / Event:** Bhopal, India local event selected.

### 2. Project Story (Narrative Fields)
- [ ] **Challenge Selection:** Pasted from [SUBMISSION.md](SUBMISSION.md) Section 1.
- [ ] **High-Level Summary:** Pasted from [SUBMISSION.md](SUBMISSION.md) Section 2 (Strictly ≤ 120 words).
- [ ] **Detailed Project Description:** Pasted from [SUBMISSION.md](SUBMISSION.md) Section 3.
- [ ] **Space Agency Data Usage:** Pasted from [SUBMISSION.md](SUBMISSION.md) Section 4 (details NASA GISTEMP v4, Visible Earth, and Earth Information Center).

### 3. Demonstration Video (Under 2:00)
- [ ] **Video Duration:** Must be under 2:00 (Target: 1:52 per [DEMO_SCRIPT.md](DEMO_SCRIPT.md)).
- [ ] **Video Host:** Uploaded to YouTube, Vimeo, or Google Drive.
- [ ] **Privacy Setting:** Set to **Public** or **Unlisted** (⚠️ NEVER set to Private, or judges cannot score it).
- [ ] **Subtitles:** English closed captions enabled / uploaded using [demo.srt](demo.srt).
- [ ] **Video Link Tested:** Opened and confirmed working in an incognito / private browser window.

### 4. Code Repository & Open Source
- [ ] **Public Repository URL:** Confirmed public on GitHub (`https://github.com/architajain902-hope/Earth-Jukebox`).
- [ ] **Open Source License:** [LICENSE](LICENSE) present in root (MIT License).
- [ ] **Original Work:** [ORIGINAL_WORK.md](ORIGINAL_WORK.md) present distinguishing team work from third-party assets.
- [ ] **AI Disclosure:** [AI_DISCLOSURE.md](AI_DISCLOSURE.md) completed with verification pledge.
- [ ] **No Secrets:** Confirmed no API keys, credentials, or `.env` files committed.

### 5. Live Interactive Demo
- [ ] **Deployed Web App:** Deployed on Vercel, Netlify, or GitHub Pages.
- [ ] **Live Link Tested:** Verified in an incognito window with no login requirements.
- [ ] **Responsive Test:** Tested on mobile (360px), tablet (768px), and desktop (1440px).
- [ ] **Offline Resilience:** App loads and runs smoothly without requiring active NASA API connections.

### 6. References & Citations
- [ ] **Portal References Field:** Compact text copied from [REFERENCES_PORTAL.txt](REFERENCES_PORTAL.txt).
- [ ] **Full References File:** Detailed citations in [REFERENCES.md](REFERENCES.md).
- [ ] **All Links Valid:** Verified using `node scripts/check-links.mjs`.

---

## 🎯 Verification Quality Gate
Run locally before submitting:
```powershell
npm run verify
```
Must pass with:
- ✓ 146 consecutive NASA records validated
- ✓ 26/26 Vitest unit tests passed
- ✓ Production static bundle compiled with 0 errors
