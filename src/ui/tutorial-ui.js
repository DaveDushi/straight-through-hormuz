export class TutorialUI {
    constructor(onSkip) {
        this._overlay = document.getElementById('tutorial-overlay');
        this._textbox = document.getElementById('tutorial-textbox');
        this._speakerEl = document.getElementById('tutorial-speaker');
        this._textEl = document.getElementById('tutorial-text');
        this._promptEl = document.getElementById('tutorial-prompt');
        this._skipBtn = document.getElementById('tutorial-skip');
        this._spotlight = document.getElementById('tutorial-spotlight');

        this._onSkip = onSkip;
        this.onTapCallback = null;
        this._typeTimer = null;
        this._skipConfirm = false;
        this._skipResetTimer = null;

        this._skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._handleSkip();
        });

        const tap = (e) => {
            if (e.target === this._skipBtn) return;
            if (this.onTapCallback) {
                e.preventDefault();
                this.onTapCallback();
            }
        };
        this._overlay.addEventListener('click', tap);
        this._overlay.addEventListener('touchend', (e) => {
            if (e.target === this._skipBtn) return;
            e.preventDefault();
            if (this.onTapCallback) this.onTapCallback();
        });
    }

    show() {
        this._overlay.classList.add('active');
    }

    hide() {
        this._overlay.classList.remove('active', 'letterbox', 'tappable');
        this._textbox.classList.remove('visible');
        this._promptEl.classList.remove('visible');
        this._spotlight.style.display = 'none';
        this._clearTypewriter();
        this.onTapCallback = null;
    }

    showStep(step) {
        this._clearTypewriter();
        this._textEl.textContent = '';
        this._textEl.classList.remove('typing');

        if (step.speaker) {
            this._speakerEl.textContent = step.speaker;
            this._speakerEl.className = 'speaker-' + step.speaker.toLowerCase();
        }

        if (step.letterbox) {
            this._overlay.classList.add('letterbox');
        } else {
            this._overlay.classList.remove('letterbox');
        }

        if (step.text) {
            this._textbox.classList.add('visible');
            this._typewrite(step.text);
        } else {
            this._textbox.classList.remove('visible');
        }

        if (step.showPrompt) {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            this._promptEl.textContent = step.promptText || (isTouchDevice ? 'Tap to continue' : 'Click to continue');
            this._promptEl.classList.add('visible');
        } else {
            this._promptEl.classList.remove('visible');
        }

        if (step.highlight) {
            this._spotlightElement(step.highlight);
        } else {
            this._spotlight.style.display = 'none';
        }
    }

    setTappable(on) {
        this._overlay.classList.toggle('tappable', on);
    }

    hideTextbox() {
        this._textbox.classList.remove('visible');
        this._promptEl.classList.remove('visible');
    }

    _typewrite(text) {
        this._textEl.textContent = '';
        this._textEl.classList.add('typing');
        let i = 0;
        this._typeTimer = setInterval(() => {
            if (i < text.length) {
                this._textEl.textContent += text[i];
                i++;
            } else {
                this._textEl.classList.remove('typing');
                clearInterval(this._typeTimer);
                this._typeTimer = null;
            }
        }, 25);
    }

    _clearTypewriter() {
        if (this._typeTimer) {
            clearInterval(this._typeTimer);
            this._typeTimer = null;
        }
    }

    _spotlightElement(selector) {
        const target = document.querySelector(selector);
        if (!target) {
            this._spotlight.style.display = 'none';
            return;
        }
        const rect = target.getBoundingClientRect();
        const pad = 8;
        this._spotlight.style.left = (rect.left - pad) + 'px';
        this._spotlight.style.top = (rect.top - pad) + 'px';
        this._spotlight.style.width = (rect.width + pad * 2) + 'px';
        this._spotlight.style.height = (rect.height + pad * 2) + 'px';
        this._spotlight.style.display = 'block';
    }

    _handleSkip() {
        if (!this._skipConfirm) {
            this._skipConfirm = true;
            this._skipBtn.textContent = 'Sure?';
            this._skipResetTimer = setTimeout(() => {
                this._skipConfirm = false;
                this._skipBtn.textContent = 'Skip';
            }, 2000);
            return;
        }
        clearTimeout(this._skipResetTimer);
        this._skipConfirm = false;
        this._skipBtn.textContent = 'Skip';
        if (this._onSkip) this._onSkip();
    }
}
