# SoundBridge — Structured Phonics App for Spanish-Speaking English Learners

A web-based structured literacy phonics trainer built for Grade 1 Spanish-speaking students learning English. Aligned with UFLI principles and structured literacy methodology.

## Overview

SoundBridge teaches phoneme–grapheme correspondences at the phoneme level — not vocabulary. It is designed specifically to address the phonological contrasts between Spanish and English that create the most persistent difficulties for native Spanish speakers.

## Running the App

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Features

### Audio Engine
- Web Speech API–based isolated phoneme playback
- Optimized speech parameters per phoneme to minimize schwa addition
- Sequential blending with configurable gap timing
- Continuous blending slider (segmented ↔ blended)
- Spanish and English voice support for contrast exercises

### Activities

| Activity | Description |
|---|---|
| **Sound Drill** | Hear and self-assess isolated phonemes with Spanish contrast info |
| **Tap the Sounds** | Tap phoneme boxes to hear isolated sounds, then blend |
| **Build the Word** | Hear a segmented word, place grapheme tiles to build it |
| **Minimal Pairs** | Listen and distinguish near-identical words (/æ/ vs /ɪ/ etc.) |
| **Blend and Read** | Slider-controlled blending speed from segmented to continuous |
| **Sound Compare** | Spanish vs. English phoneme side-by-side contrast module |

### Spanish–English Contrast Module
Targets the most critical contrasts for Spanish speakers:
- Spanish /i/ → English /ɪ/ (sit vs. seat)
- Spanish /a/ → English /æ/ (cat)
- Spanish /e/ → English /ɛ/ (bed)
- Spanish /u/ → English /ʌ/ (cup)
- /b/–/v/ distinction (van vs. ban)
- Silent-h → English /h/ aspiration
- Spanish trill /r/ → English retroflex /r/

### Progress Tracking (localStorage)
- Accuracy by phoneme
- Error type categorization: vowel confusion, final consonant drop, blend omission
- Response time tracking
- Phoneme mastery heatmap
- Level unlock progression

### Teacher Mode
- Phoneme accuracy heatmap
- Error type breakdown charts
- Lock/unlock level controls
- Focus phoneme selection
- Progress export (JSON)
- Full progress reset

## Scope and Sequence

| Level | Content |
|---|---|
| Level 1 | Continuous consonants (m, s, f, l, n) + short vowels + CVC blending |
| Level 2 | Digraphs (sh, ch, th) + consonants (v, h, r, w, y) |
| Level 3 | Silent-e pattern + long vowels |
| Level 4 | Vowel teams + r-controlled vowels |

## Architecture

```
soundbridge/
├── pages/
│   ├── index.js              # Dashboard
│   ├── teacher.js            # Teacher panel
│   ├── sound-compare.js      # Spanish–English contrast module
│   └── level/
│       ├── [levelId].js      # Level overview
│       └── [levelId]/[moduleId].js  # Activity page
├── components/
│   ├── Layout.jsx            # App shell + nav
│   ├── Dashboard.jsx         # Student dashboard
│   ├── TeacherPanel.jsx      # Teacher controls + heatmap
│   └── activities/
│       ├── SoundDrill.jsx
│       ├── TapTheSounds.jsx
│       ├── BuildTheWord.jsx
│       ├── MinimalPairs.jsx
│       ├── BlendAndRead.jsx
│       └── SoundCompare.jsx
├── context/
│   └── AppContext.js         # Global state (React Context + useReducer)
├── lib/
│   ├── audioEngine.js        # Web Speech API phoneme playback
│   └── progressTracker.js    # localStorage progress management
└── data/
    ├── phonemes.json         # Phoneme inventory with Spanish contrast data
    ├── words.json            # CVC word lists + minimal pairs
    └── scopeAndSequence.json # Curriculum levels and modules
```

## Design Principles

- **Audio-first**: Every interaction is anchored to real phoneme audio
- **Minimal visual clutter**: Large targets, calm colors, no distracting animations
- **Tablet-friendly**: All touch targets ≥ 44×44px, works on iPad
- **Teacher-controlled**: Scope, sequence, and focus are all configurable
- **Corrective, never punitive**: Wrong answers get explanation and replay, never just a ❌

## Tech Stack

- Next.js 16 (pages router)
- Tailwind CSS v4
- Web Speech API (no external dependencies)
- localStorage (no backend)
