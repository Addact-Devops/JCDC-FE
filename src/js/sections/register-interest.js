/**
 * register-interest.js
 * Handles the Invest page "Register your interest" form:
 *  - Conditional fields per Engagement Type (Developers/Investors/Operators/Others)
 *  - Per-field validation with inline error messages (i18n-aware)
 *  - Submit handler that swaps in a success card
 *  - Character counter for the description textarea (max 255)
 *  - "Back to form" reset (defensive — not exposed in UI by default)
 *
 * IIFE pattern (matches the rest of the codebase — no ES modules).
 */
(function () {
    'use strict';

    // ──────────────────────────────────────────────
    // Module init — bail early if no form on page
    // ──────────────────────────────────────────────
    function init() {
        const form = document.getElementById('register-form');
        if (!form) return;

        const panel = document.getElementById('register-panel');
        const successEl = document.getElementById('register-success');
        const conditionalSections = form.querySelectorAll('[data-conditional]');

        // ──────────────────────────────────────────
        // 1. Conditional fields based on Engagement Type
        // ──────────────────────────────────────────
        const engagementRadios = form.querySelectorAll('input[name="engagementType"]');

        function updateConditional() {
            const selected = form.querySelector('input[name="engagementType"]:checked');
            const value = selected ? selected.value : null;

            conditionalSections.forEach((section) => {
                const matches = section.dataset.conditional === value;
                section.hidden = !matches;

                // Disable inputs of hidden sections so they don't block submit / get validated
                section.querySelectorAll('input, select, textarea').forEach((field) => {
                    field.disabled = !matches;
                    if (!matches) {
                        // Clear any error state on hidden fields
                        const wrap = field.closest('.form-field, .form-group, .form-phone');
                        if (wrap) wrap.classList.remove('has-error', 'is-invalid');
                    }
                });
            });
        }

        engagementRadios.forEach((r) => r.addEventListener('change', updateConditional));
        updateConditional();

        // ──────────────────────────────────────────
        // 2. Character counter for textarea
        // ──────────────────────────────────────────
        form.querySelectorAll('textarea[maxlength]').forEach((ta) => {
            const max = parseInt(ta.getAttribute('maxlength'), 10);
            const counter = ta.parentElement.querySelector('.form-field__hint');
            if (!counter) return;

            const update = () => {
                counter.textContent = `${ta.value.length} / ${max}`;
            };
            ta.addEventListener('input', update);
            update();
        });

        // ──────────────────────────────────────────
        // 3. Validation helpers
        // ──────────────────────────────────────────
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Saudi mobile: 9 digits after +966 (typically starts with 5)
        const PHONE_RE = /^\d{8,12}$/;

        function getMessages() {
            // Pulled fresh on each call so language switches mid-form are respected
            const lang = (window.I18n && window.I18n.get && window.I18n.get()) || 'en';
            const ar = lang === 'ar';
            return {
                required: ar ? 'هذا الحقل مطلوب' : 'This field is required',
                email: ar ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address',
                phone: ar ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number',
                terms: ar
                    ? 'يجب الموافقة على الشروط للمتابعة'
                    : 'You must accept the Terms to continue',
                checkboxes: ar
                    ? 'يرجى اختيار خيار واحد على الأقل'
                    : 'Please select at least one option',
            };
        }

        function setError(wrapper, message) {
            if (!wrapper) return;
            wrapper.classList.add('has-error');
            const errEl = wrapper.querySelector(
                '.form-field__error, .form-group__error',
            );
            if (errEl) errEl.textContent = message || '';
            const input = wrapper.querySelector('input, select, textarea');
            if (input) input.setAttribute('aria-invalid', 'true');
        }

        function clearError(wrapper) {
            if (!wrapper) return;
            wrapper.classList.remove('has-error');
            const errEl = wrapper.querySelector(
                '.form-field__error, .form-group__error',
            );
            if (errEl) errEl.textContent = '';
            const input = wrapper.querySelector('input, select, textarea');
            if (input) input.removeAttribute('aria-invalid');
        }

        function getWrapper(input) {
            return input.closest('.form-field, .form-group, .form-phone, .form-check');
        }

        function validateField(field, msgs) {
            // Skip hidden/disabled
            if (field.disabled) return true;

            const wrapper = getWrapper(field);

            // Required check (for inputs with required attr)
            if (field.required) {
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        setError(wrapper, msgs.terms);
                        return false;
                    }
                } else {
                    if (!field.value || !field.value.trim()) {
                        setError(wrapper, msgs.required);
                        return false;
                    }
                }
            }

            // Type-specific
            if (field.type === 'email' && field.value && !EMAIL_RE.test(field.value.trim())) {
                setError(wrapper, msgs.email);
                return false;
            }

            if (field.type === 'tel' && field.value) {
                const digits = field.value.replace(/\D/g, '');
                if (!PHONE_RE.test(digits)) {
                    setError(wrapper, msgs.phone);
                    return false;
                }
            }

            clearError(wrapper);
            return true;
        }

        // Live validation on blur for filled fields
        form.querySelectorAll('input, select, textarea').forEach((field) => {
            field.addEventListener('blur', () => {
                const msgs = getMessages();
                validateField(field, msgs);
            });
            field.addEventListener('input', () => {
                // Clear error as soon as user starts correcting
                if (field.value || field.checked) {
                    const wrapper = getWrapper(field);
                    if (wrapper && wrapper.classList.contains('has-error')) {
                        clearError(wrapper);
                    }
                }
            });
        });

        // ──────────────────────────────────────────
        // 4. Submit handler
        // ──────────────────────────────────────────
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const msgs = getMessages();
            let firstInvalid = null;

            // Validate all visible/enabled fields
            const fields = form.querySelectorAll('input, select, textarea');
            fields.forEach((field) => {
                const ok = validateField(field, msgs);
                if (!ok && !firstInvalid) firstInvalid = field;
            });

            // Engagement type — require one to be selected
            const engagementSelected = form.querySelector(
                'input[name="engagementType"]:checked',
            );
            if (!engagementSelected) {
                const wrap = form.querySelector('[data-engagement-wrap]');
                if (wrap) {
                    wrap.classList.add('has-error');
                    const errEl = wrap.querySelector('.form-group__error');
                    if (errEl) errEl.textContent = msgs.required;
                }
                if (!firstInvalid) firstInvalid = form.querySelector('input[name="engagementType"]');
            }

            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            // ── Submit "succeeds" — in real app, send to API here ──
            const data = new FormData(form);
            const payload = {};
            data.forEach((v, k) => {
                // collect multi-value (checkboxes) into arrays
                if (Object.prototype.hasOwnProperty.call(payload, k)) {
                    if (Array.isArray(payload[k])) payload[k].push(v);
                    else payload[k] = [payload[k], v];
                } else {
                    payload[k] = v;
                }
            });
            // Available for backend wiring — placeholder log:
            // console.log('Register payload:', payload);

            // Swap form for success state
            if (panel && successEl) {
                form.hidden = true;
                successEl.hidden = false;
                // For screen readers
                successEl.setAttribute('role', 'status');
                successEl.focus();
                // Scroll to top of panel so success is in view
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        // ──────────────────────────────────────────
        // 5. Smooth-scroll for the hero CTA → form
        // ──────────────────────────────────────────
        document.querySelectorAll('a[href="#register"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const target = document.getElementById('register');
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Focus first input after scroll for keyboard users
                setTimeout(() => {
                    const firstInput = form.querySelector('input, select');
                    if (firstInput) firstInput.focus({ preventScroll: true });
                }, 600);
            });
        });

        // ──────────────────────────────────────────
        // 6. Re-validate visible errors when language changes (so messages re-translate)
        // ──────────────────────────────────────────
        if (window.I18n && typeof window.I18n.onLangChange === 'function') {
            window.I18n.onLangChange(() => {
                const msgs = getMessages();
                form.querySelectorAll('.has-error').forEach((wrap) => {
                    const input = wrap.querySelector('input, select, textarea');
                    if (input) validateField(input, msgs);
                });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
