/**
 * audioEngine.js
 * ────────────────────────────────────────────────────────────────
 * Phoneme audio playback engine using the Web Speech API.
 *
 * Design goals:
 *   - Produce as-clean-as-possible isolated phoneme sounds
 *   - Avoid schwa addition on stop consonants where possible
 *   - Support sequential blending with configurable gap timing
 *   - Support slowed continuous blending via a speed parameter
 *   - Allow replay of any individual phoneme
 *
 * Limitations of Web Speech API for isolated phonemes:
 *   - Stop consonants (/b/, /p/, /d/, /t/, /k/, /g/) inherently
 *     add a slight schwa; we minimize this with rate/pitch tuning.
 *   - Quality depends on the OS voice installed. We select the
 *     best available US English voice automatically.
 * ────────────────────────────────────────────────────────────────
 */

/**
 * PHONEME_SPEECH_CONFIG maps each phoneme ID to the optimal
 * speech synthesis parameters for producing a clean, isolated sound.
 *
 * Fields:
 *   text       – string fed to SpeechSynthesisUtterance
 *   rate       – speaking rate (0.1–2.0; lower = slower)
 *   pitch      – pitch (0.0–2.0)
 *   volume     – volume (0.0–1.0)
 *   pauseAfter – ms to wait after this phoneme during blending
 */
export const PHONEME_SPEECH_CONFIG = {
  // ── Short vowels ──────────────────────────────────────────────
  // Use VC words (vowel + stop) at rate 2.0 — TTS pronounces them
  // correctly and the trailing stop is so brief only the vowel is heard.
  'short-a': { text: 'at',   rate: 2.0, pitch: 1.1,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'short-e': { text: 'egg',  rate: 2.0,  pitch: 1.0,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'short-i': { text: 'it',   rate: 2.0, pitch: 1.1,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'short-o': { text: 'odd',  rate: 2.0, pitch: 0.95, volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'short-u': { text: 'up',   rate: 2.0,  pitch: 0.95, volume: 1.0, pauseAfter: 120, isContinuant: true  },

  // ── Long vowels ───────────────────────────────────────────────
  'long-a':  { text: 'ay',   rate: 0.35, pitch: 1.0,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'long-e':  { text: 'ee',   rate: 0.35, pitch: 1.1,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'long-i':  { text: 'aye',  rate: 0.35, pitch: 1.0,  volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'long-o':  { text: 'oh',   rate: 0.35, pitch: 0.95, volume: 1.0, pauseAfter: 120, isContinuant: true  },
  'long-u':  { text: 'you',  rate: 0.35, pitch: 1.0,  volume: 1.0, pauseAfter: 120, isContinuant: true  },

  // ── Nasals ────────────────────────────────────────────────────
  // CV syllables at rate 2.0 — same approach as other consonants.
  // "mmm"/"nnn" get read as letter names ("em-em-em", "en-en-en").
  'm':  { text: 'ma',   rate: 2.0,  pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'n':  { text: 'na',   rate: 2.0,  pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },

  // ── Fricatives ────────────────────────────────────────────────
  // CV syllables at rate 2.0: TTS pronounces the syllable correctly and
  // the vowel release is so brief (~50 ms) only the consonant onset is
  // perceptible. This is also how phonics teachers isolate consonants.
  's':  { text: 'sa',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'f':  { text: 'fa',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'v':  { text: 'va',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'h':  { text: 'ha',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  // "shh" is a universally-recognized shushing sound — TTS produces /ʃ/ directly.
  'sh': { text: 'shh',  rate: 0.5, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  // "thin" starts with voiceless /θ/; "the" starts with voiced /ð/.
  'th-voiceless': { text: 'thin', rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true },
  'th-voiced':    { text: 'the',  rate: 0.9, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true },

  // ── Approximants ──────────────────────────────────────────────
  'l':  { text: 'la',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'r':  { text: 'ra',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'w':  { text: 'wa',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },
  'j':  { text: 'ya',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 100, isContinuant: true  },

  // ── Stop consonants ───────────────────────────────────────────
  'p':  { text: 'pa',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },
  'b':  { text: 'ba',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },
  't':  { text: 'ta',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },
  'd':  { text: 'da',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },
  'k':  { text: 'ka',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },
  'g':  { text: 'ga',   rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },

  // ── Affricates ────────────────────────────────────────────────
  'ch': { text: 'cha',  rate: 2.0, pitch: 1.0, volume: 1.0, pauseAfter: 150, isContinuant: false },

  // ── Spanish vowel contrasts (for Sound Compare module) ────────
  'spanish-a': { text: 'a', rate: 0.4, pitch: 1.0, volume: 1.0, pauseAfter: 120, lang: 'es-ES' },
  'spanish-e': { text: 'e', rate: 0.4, pitch: 1.0, volume: 1.0, pauseAfter: 120, lang: 'es-ES' },
  'spanish-i': { text: 'i', rate: 0.4, pitch: 1.0, volume: 1.0, pauseAfter: 120, lang: 'es-ES' },
  'spanish-o': { text: 'o', rate: 0.4, pitch: 1.0, volume: 1.0, pauseAfter: 120, lang: 'es-ES' },
  'spanish-u': { text: 'u', rate: 0.4, pitch: 1.0, volume: 1.0, pauseAfter: 120, lang: 'es-ES' },
};

// ── Voice selection ───────────────────────────────────────────────

let _selectedVoice = null;
let _selectedSpanishVoice = null;

/**
 * Returns the best available English voice for phoneme production.
 * Prefers US English neural/premium voices.
 */
function getBestEnglishVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (_selectedVoice) return _selectedVoice;

  const voices = window.speechSynthesis.getVoices();
  const priority = [
    // Neural/premium US English voices (best quality)
    v => v.lang === 'en-US' && v.name.toLowerCase().includes('neural'),
    v => v.lang === 'en-US' && v.name.toLowerCase().includes('premium'),
    v => v.lang === 'en-US' && v.name.toLowerCase().includes('enhanced'),
    // Google voices
    v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'),
    // Any US English
    v => v.lang === 'en-US',
    // Any English
    v => v.lang.startsWith('en'),
  ];

  for (const test of priority) {
    const match = voices.find(test);
    if (match) { _selectedVoice = match; return match; }
  }
  return null;
}

/**
 * Returns the best available Spanish voice for contrast exercises.
 */
function getBestSpanishVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  if (_selectedSpanishVoice) return _selectedSpanishVoice;

  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find(v => v.lang === 'es-ES') ||
    voices.find(v => v.lang === 'es-MX') ||
    voices.find(v => v.lang.startsWith('es'));

  _selectedSpanishVoice = match || null;
  return _selectedSpanishVoice;
}

// Reset cached voices when voices list changes
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    _selectedVoice = null;
    _selectedSpanishVoice = null;
  });
}

// ── Custom audio file support ─────────────────────────────────────
// If a recorded file exists in /public/phonemes/, it takes priority
// over TTS. Falls back to TTS for any phoneme without a recording.
// Supported formats tried in order: .m4a, .mp3, .wav

const CUSTOM_EXTENSIONS = ['.m4a', '.mp3', '.wav'];

// Cache: phonemeId -> URL (string) if found, null if not found
const _customAudioCache = {};

/**
 * Checks whether a custom audio file exists for this phoneme.
 * Results are cached so the network is only hit once per phoneme per session.
 * @param {string} phonemeId
 * @returns {Promise<string|null>} URL if found, null otherwise
 */
async function resolveCustomAudio(phonemeId) {
  if (phonemeId in _customAudioCache) return _customAudioCache[phonemeId];

  for (const ext of CUSTOM_EXTENSIONS) {
    const url = `/phonemes/${phonemeId}${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (res.ok) {
        _customAudioCache[phonemeId] = url;
        return url;
      }
    } catch {
      // network error — try next extension
    }
  }

  _customAudioCache[phonemeId] = null;
  return null;
}

/**
 * Plays an audio file URL. Returns a Promise that resolves when done.
 * @param {string} url
 * @returns {Promise<void>}
 */
function playAudioFile(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = resolve;
    audio.onerror = (e) => reject(e);
    audio.play().catch(reject);
  });
}

// ── Core playback ─────────────────────────────────────────────────

/**
 * Speaks a text string using the Speech Synthesis API.
 * Returns a Promise that resolves when speech ends.
 *
 * @param {string} text - Text to speak
 * @param {object} options - { rate, pitch, volume, lang }
 * @returns {Promise<void>}
 */
export function speak(text, options = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = options.rate   ?? 0.9;
    utterance.pitch  = options.pitch  ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Select voice based on language
    const isSpanish = options.lang?.startsWith('es');
    const voice = isSpanish ? getBestSpanishVoice() : getBestEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = options.lang ?? 'en-US';

    utterance.onend   = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Plays a single isolated phoneme by its ID.
 *
 * @param {string} phonemeId - ID from PHONEME_SPEECH_CONFIG
 * @returns {Promise<void>}
 */
export async function playPhoneme(phonemeId) {
  const customUrl = await resolveCustomAudio(phonemeId);
  if (customUrl) {
    try {
      return await playAudioFile(customUrl);
    } catch {
      // File found but failed to play (codec issue, corrupt file, etc.)
      // Clear the cache entry so we don't keep retrying a bad file
      delete _customAudioCache[phonemeId];
    }
  }

  // Fall back to TTS
  const config = PHONEME_SPEECH_CONFIG[phonemeId];
  if (!config) {
    console.warn(`audioEngine: no config for phoneme "${phonemeId}"`);
    return;
  }
  return speak(config.text, {
    rate:   config.rate,
    pitch:  config.pitch,
    volume: config.volume,
    lang:   config.lang,
  });
}

/**
 * Plays a complete word by spelling it out naturally (best for final
 * full-word playback after segmented practice).
 *
 * @param {string} word - The English word to speak
 * @returns {Promise<void>}
 */
export function playWord(word) {
  return speak(word, { rate: 0.75, pitch: 1.0, volume: 1.0 });
}

/**
 * Delay helper.
 * @param {number} ms
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Track whether blending is currently active (to support cancellation)
let _blendingActive = false;

/**
 * Cancels any ongoing blending playback.
 */
export function cancelBlending() {
  _blendingActive = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Plays phonemes sequentially with a configurable gap between each sound.
 * This is the core blending engine.
 *
 * @param {string[]} phonemeIds - Ordered list of phoneme IDs to blend
 * @param {object} options
 * @param {number} [options.gapMs=400]   - Milliseconds between phonemes (0 = continuous)
 * @param {Function} [options.onPhoneme] - Callback(index) fired when each phoneme starts
 * @returns {Promise<void>}
 */
export async function blendPhonemes(phonemeIds, options = {}) {
  const { gapMs = 400, onPhoneme } = options;
  _blendingActive = true;

  for (let i = 0; i < phonemeIds.length; i++) {
    if (!_blendingActive) break;

    if (onPhoneme) onPhoneme(i);

    await playPhoneme(phonemeIds[i]);

    if (!_blendingActive) break;

    // Add the configured gap between phonemes
    if (i < phonemeIds.length - 1 && gapMs > 0) {
      await delay(gapMs);
    }
  }

  _blendingActive = false;
}

/**
 * Plays the complete word naturally after segmented blending.
 * Adds a short pause before the full word playback.
 *
 * @param {string[]} phonemeIds - Array of phoneme IDs
 * @param {string} word - The full word to speak at the end
 * @param {object} options - Passed to blendPhonemes
 */
export async function blendThenSpeak(phonemeIds, word, options = {}) {
  await blendPhonemes(phonemeIds, options);
  await delay(300);
  await playWord(word);
}

/**
 * Computes gap duration from a slider value (0–100).
 * 0  → 800ms gap (very slow, each phoneme fully separated)
 * 50 → 300ms gap (moderate blending)
 * 100 → 50ms gap (nearly continuous)
 *
 * @param {number} sliderValue - 0 to 100
 * @returns {number} gap in milliseconds
 */
export function sliderToGap(sliderValue) {
  const min = 50;
  const max = 800;
  // Invert: slider at 100 = fastest = smallest gap
  return Math.round(max - ((sliderValue / 100) * (max - min)));
}

/**
 * Returns available voices for display in teacher settings.
 * @returns {{ english: SpeechSynthesisVoice[], spanish: SpeechSynthesisVoice[] }}
 */
export function getAvailableVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { english: [], spanish: [] };
  }
  const all = window.speechSynthesis.getVoices();
  return {
    english: all.filter(v => v.lang.startsWith('en')),
    spanish: all.filter(v => v.lang.startsWith('es')),
  };
}

/**
 * Forces the voice list to load (some browsers require this).
 * Call once at app initialization.
 */
export function initAudio() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Trigger voice loading
  window.speechSynthesis.getVoices();
}
