// /**
//  * sections/contact-us.js
//  * Handles the Contact Us form:
//  *   - Per-field validation (required, email, phone)
//  *   - Inline error messages (i18n-aware)
//  *   - Topic dropdown
//  *   - T&C acceptance gating
//  *   - Submit handler that swaps the form for a "Message Received" card
//  *
//  * IIFE pattern (matches the rest of the codebase — no ES modules).
//  */
// (function () {
//     "use strict";

//     function init() {
//         const form = document.getElementById("contact-form");
//         if (!form) return;

//         const formWrap = document.getElementById("contact-form-wrap");
//         const successEl = document.getElementById("contact-success");
//         const contactSection = form.closest(".contact-us");

//         // ──────────────────────────────────────────
//         // Validation helpers
//         // ──────────────────────────────────────────
//         const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const PHONE_RE = /^[+]?[\d\s\-()]{7,20}$/;

//         function getMessages() {
//             const lang = (window.I18n && window.I18n.get && window.I18n.get()) || "en";
//             const ar = lang === "ar";
//             return {
//                 required: ar ? "هذا الحقل مطلوب" : "This field is required",
//                 email: ar ? "يرجى إدخال بريد إلكتروني صالح" : "Please enter a valid email address",
//                 phone: ar ? "يرجى إدخال رقم هاتف صالح" : "Please enter a valid phone number",
//                 topic: ar ? "يرجى اختيار موضوع" : "Please choose a topic",
//                 terms: ar ? "يجب الموافقة على الشروط والأحكام" : "You must accept the Terms and Conditions",
//             };
//         }

//         function setError(wrap, msg) {
//             if (!wrap) return;
//             wrap.classList.add("has-error", "is-invalid");
//             const errEl = wrap.querySelector(".form-field__error, .form-group__error");
//             if (errEl && msg) errEl.textContent = msg;
//             const inputEl = wrap.querySelector("input, select, textarea");
//             if (inputEl) inputEl.setAttribute("aria-invalid", "true");
//         }

//         function clearError(wrap) {
//             if (!wrap) return;
//             wrap.classList.remove("has-error", "is-invalid");
//             const inputEl = wrap.querySelector("input, select, textarea");
//             if (inputEl) inputEl.removeAttribute("aria-invalid");
//         }

//         function validateField(field) {
//             const wrap = field.closest(".form-field, .form-group, .contact-form__terms-row");
//             const msgs = getMessages();
//             const value = field.type === "checkbox" ? field.checked : (field.value || "").trim();

//             // Skip disabled fields
//             if (field.disabled) {
//                 clearError(wrap);
//                 return true;
//             }

//             // Required check
//             if (field.hasAttribute("required") || field.dataset.required === "true") {
//                 if (field.type === "checkbox" && !value) {
//                     setError(wrap, field.name === "terms" ? msgs.terms : msgs.required);
//                     return false;
//                 }
//                 if (typeof value === "string" && !value) {
//                     setError(wrap, msgs.required);
//                     return false;
//                 }
//             }

//             // Type-specific
//             if (field.type === "email" && value && !EMAIL_RE.test(value)) {
//                 setError(wrap, msgs.email);
//                 return false;
//             }
//             if (field.type === "tel" && value && !PHONE_RE.test(value)) {
//                 setError(wrap, msgs.phone);
//                 return false;
//             }
//             if (field.tagName === "SELECT" && field.hasAttribute("required") && !value) {
//                 setError(wrap, msgs.topic);
//                 return false;
//             }

//             clearError(wrap);
//             return true;
//         }

//         function validateAll() {
//             const fields = form.querySelectorAll(
//                 'input[required], select[required], textarea[required], input[data-required="true"]',
//             );
//             let firstInvalid = null;
//             let valid = true;
//             fields.forEach((f) => {
//                 const ok = validateField(f);
//                 if (!ok) {
//                     valid = false;
//                     if (!firstInvalid) firstInvalid = f;
//                 }
//             });
//             if (firstInvalid) {
//                 try {
//                     firstInvalid.focus({ preventScroll: false });
//                 } catch (_) {
//                     firstInvalid.focus();
//                 }
//             }
//             return valid;
//         }

//         // ──────────────────────────────────────────
//         // Live validation: clear error on input,
//         // re-validate on blur.
//         // ──────────────────────────────────────────
//         form.querySelectorAll("input, select, textarea").forEach((f) => {
//             f.addEventListener("input", () => {
//                 const wrap = f.closest(".form-field, .form-group, .contact-form__terms-row");
//                 clearError(wrap);
//             });
//             f.addEventListener("change", () => {
//                 if (f.type === "checkbox" || f.tagName === "SELECT") validateField(f);
//             });
//             f.addEventListener("blur", () => validateField(f));
//         });

//         // ──────────────────────────────────────────
//         // Submit handler
//         // ──────────────────────────────────────────
//         form.addEventListener("submit", (e) => {
//             e.preventDefault();
//             if (!validateAll()) return;

//             // Swap UI: hide form wrap, show success card
//             if (formWrap) formWrap.hidden = true;
//             if (contactSection) contactSection.classList.add("is-success");
//             if (successEl) {
//                 successEl.hidden = false;
//                 // Move focus for screen readers
//                 successEl.setAttribute("tabindex", "-1");
//                 try {
//                     successEl.focus({ preventScroll: false });
//                 } catch (_) {
//                     successEl.focus();
//                 }
//                 // Keep the page structure visible after the state swap.
//                 const banner = document.querySelector(".banner");
//                 (banner || contactSection || successEl).scrollIntoView({ behavior: "smooth", block: "start" });
//             }
//         });
//     }

//     if (document.readyState === "loading") {
//         document.addEventListener("DOMContentLoaded", init);
//     } else {
//         init();
//     }
// })();

/**
 * sections/contact-us.js
 * Handles the Contact Us form:
 *   - Per-field validation (required, email, phone)
 *   - Inline error messages (i18n-aware)
 *   - Topic dropdown
 *   - T&C acceptance gating
 *   - Submit handler that swaps the form for a "Message Received" card
 *   - Visual asterisk injection for required fields (Sitecore-friendly)
 *
 * IIFE pattern (matches the rest of the codebase — no ES modules).
 */
// old js code
// (function () {
//     "use strict";

//     function init() {
//         const form = document.getElementById("contact-form");
//         if (!form) return;

//         const formWrap = document.getElementById("contact-form-wrap");
//         const successEl = document.getElementById("contact-success");
//         const contactSection = form.closest(".contact-us");

//         // ──────────────────────────────────────────
//         // ◆ NEW — Inject visual asterisk for required fields
//         // Adds <span class="form-field__required" aria-hidden="true">*</span>
//         // to the label of every required input/textarea/select.
//         // Done in JS because the HTML is server-rendered (Sitecore) and we
//         // can't add the span markup directly to the template.
//         // ──────────────────────────────────────────
//         function injectRequiredMarkers() {
//             const requiredFields = form.querySelectorAll(`
//             input[aria-required="true"],
//             textarea[aria-required="true"],
//             select[aria-required="true"]
//         `);

//             requiredFields.forEach((field) => {
//                 // Skip checkboxes
//                 if (field.type === "checkbox") return;

//                 const wrapper = field.closest(".form-field, .form-group");
//                 if (!wrapper) return;

//                 const label = wrapper.querySelector(".form-field__label");
//                 if (!label) return;

//                 // Prevent duplicate asterisks
//                 if (label.querySelector(".form-field__required")) return;

//                 const asterisk = document.createElement("span");
//                 asterisk.className = "form-field__required";
//                 asterisk.setAttribute("aria-hidden", "true");
//                 asterisk.textContent = "*";

//                 label.appendChild(asterisk);
//             });
//         }

//         injectRequiredMarkers();

//         // ──────────────────────────────────────────
//         // Validation helpers
//         // ──────────────────────────────────────────
//         const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const PHONE_RE = /^[+]?[\d\s\-()]{7,20}$/;

//         function getMessages() {
//             const lang = (window.I18n && window.I18n.get && window.I18n.get()) || "en";
//             const ar = lang === "ar";
//             return {
//                 required: ar ? "هذا الحقل مطلوب" : "This field is required",
//                 email: ar ? "يرجى إدخال بريد إلكتروني صالح" : "Please enter a valid email address",
//                 phone: ar ? "يرجى إدخال رقم هاتف صالح" : "Please enter a valid phone number",
//                 topic: ar ? "يرجى اختيار موضوع" : "Please choose a topic",
//                 terms: ar ? "يجب الموافقة على الشروط والأحكام" : "You must accept the Terms and Conditions",
//             };
//         }

//         function setError(wrap, msg) {
//             if (!wrap) return;
//             wrap.classList.add("has-error", "is-invalid");
//             const errEl = wrap.querySelector(".form-field__error, .form-group__error");
//             if (errEl && msg) errEl.textContent = msg;
//             const inputEl = wrap.querySelector("input, select, textarea");
//             if (inputEl) inputEl.setAttribute("aria-invalid", "true");
//         }

//         function clearError(wrap) {
//             if (!wrap) return;
//             wrap.classList.remove("has-error", "is-invalid");
//             const inputEl = wrap.querySelector("input, select, textarea");
//             if (inputEl) inputEl.removeAttribute("aria-invalid");
//         }

//         function validateField(field) {
//             const wrap = field.closest(".form-field, .form-group, .contact-form__terms-row");
//             const msgs = getMessages();
//             const value = field.type === "checkbox" ? field.checked : (field.value || "").trim();

//             // Skip disabled fields
//             if (field.disabled) {
//                 clearError(wrap);
//                 return true;
//             }

//             // Required check
//             if (field.hasAttribute("required") || field.dataset.required === "true") {
//                 if (field.type === "checkbox" && !value) {
//                     setError(wrap, field.name === "terms" ? msgs.terms : msgs.required);
//                     return false;
//                 }
//                 if (typeof value === "string" && !value) {
//                     setError(wrap, msgs.required);
//                     return false;
//                 }
//             }

//             // Type-specific
//             if (field.type === "email" && value && !EMAIL_RE.test(value)) {
//                 setError(wrap, msgs.email);
//                 return false;
//             }
//             if (field.type === "tel" && value && !PHONE_RE.test(value)) {
//                 setError(wrap, msgs.phone);
//                 return false;
//             }
//             if (field.tagName === "SELECT" && field.hasAttribute("required") && !value) {
//                 setError(wrap, msgs.topic);
//                 return false;
//             }

//             clearError(wrap);
//             return true;
//         }

//         function validateAll() {
//             const fields = form.querySelectorAll(
//                 'input[required], select[required], textarea[required], input[data-required="true"]',
//             );
//             let firstInvalid = null;
//             let valid = true;
//             fields.forEach((f) => {
//                 const ok = validateField(f);
//                 if (!ok) {
//                     valid = false;
//                     if (!firstInvalid) firstInvalid = f;
//                 }
//             });
//             if (firstInvalid) {
//                 try {
//                     firstInvalid.focus({ preventScroll: false });
//                 } catch (_) {
//                     firstInvalid.focus();
//                 }
//             }
//             return valid;
//         }

//         // ──────────────────────────────────────────
//         // Live validation: clear error on input,
//         // re-validate on blur.
//         // ──────────────────────────────────────────
//         form.querySelectorAll("input, select, textarea").forEach((f) => {
//             f.addEventListener("input", () => {
//                 const wrap = f.closest(".form-field, .form-group, .contact-form__terms-row");
//                 clearError(wrap);
//             });
//             f.addEventListener("change", () => {
//                 if (f.type === "checkbox" || f.tagName === "SELECT") validateField(f);
//             });
//             f.addEventListener("blur", () => validateField(f));
//         });

//         // ──────────────────────────────────────────
//         // Submit handler
//         // ──────────────────────────────────────────
//         form.addEventListener("submit", (e) => {
//             e.preventDefault();
//             if (!validateAll()) return;

//             // Swap UI: hide form wrap, show success card
//             if (formWrap) formWrap.hidden = true;
//             if (contactSection) contactSection.classList.add("is-success");
//             if (successEl) {
//                 successEl.hidden = false;
//                 // Move focus for screen readers
//                 successEl.setAttribute("tabindex", "-1");
//                 try {
//                     successEl.focus({ preventScroll: false });
//                 } catch (_) {
//                     successEl.focus();
//                 }
//                 // Keep the page structure visible after the state swap.
//                 const banner = document.querySelector(".banner");
//                 (banner || contactSection || successEl).scrollIntoView({ behavior: "smooth", block: "start" });
//             }
//         });
//     }

//     if (document.readyState === "loading") {
//         document.addEventListener("DOMContentLoaded", init);
//     } else {
//         init();
//     }
// })();

function init() {
    // Get wrapper first because Sitecore generates dynamic form IDs
    const formWrap = document.getElementById("contact-form-wrap");
    if (!formWrap) return;

    const form = formWrap.querySelector("form");
    if (!form) return;

    // const successEl = document.getElementById("contact-success");
    // const contactSection = form.closest(".contact-us");

    // ──────────────────────────────────────────
    // Inject visual asterisk for required fields
    // ──────────────────────────────────────────
    function injectRequiredMarkers() {
        const requiredFields = form.querySelectorAll(
            'input[data-val="true"], textarea[data-val="true"], select[data-val="true"]',
        );

        requiredFields.forEach((field) => {
            // if (field.type === "checkbox") return;

            const wrapper = field.closest(".form-field");
            // if (!wrapper) return;

            const label = wrapper.querySelector(".form-field__label");
            // if (!label) return;

            // if (label.querySelector(".form-field__required")) return;

            const asterisk = document.createElement("span");
            asterisk.className = "form-field__required";
            asterisk.setAttribute("aria-hidden", "true");
            asterisk.style.color = "red";
            asterisk.textContent = "*";

            label.appendChild(asterisk);
        });
    }

    injectRequiredMarkers();

    // ──────────────────────────────────────────
    // Validation helpers
    // ──────────────────────────────────────────
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_RE = /^[+]?[\d\s\-()]{7,20}$/;

    function getMessages() {
        const lang = (window.I18n && window.I18n.get && window.I18n.get()) || "en";

        const ar = lang === "ar";

        return {
            required: ar ? "هذا الحقل مطلوب" : "This field is required",
            email: ar ? "يرجى إدخال بريد إلكتروني صالح" : "Please enter a valid email address",
            phone: ar ? "يرجى إدخال رقم هاتف صالح" : "Please enter a valid phone number",
            topic: ar ? "يرجى اختيار موضوع" : "Please choose a topic",
            terms: ar ? "يجب الموافقة على الشروط والأحكام" : "You must accept the Terms and Conditions",
        };
    }

    function setError(wrap, msg) {
        if (!wrap) return;

        wrap.classList.add("has-error", "is-invalid");

        const errEl = wrap.querySelector(".form-field__error, .form-group__error");

        if (errEl && msg) {
            errEl.textContent = msg;
        }

        const inputEl = wrap.querySelector("input, select, textarea");

        if (inputEl) {
            inputEl.setAttribute("aria-invalid", "true");
        }
    }

    function clearError(wrap) {
        if (!wrap) return;

        wrap.classList.remove("has-error", "is-invalid");

        const inputEl = wrap.querySelector("input, select, textarea");

        if (inputEl) {
            inputEl.removeAttribute("aria-invalid");
        }
    }

    function validateField(field) {
        // const wrap = field.closest(
        //     ".form-field, .form-group, .contact-form__terms-row"
        // );
        const wrap = field.closest(".form-field, .contact-form__terms-row");

        const msgs = getMessages();

        const value = field.type === "checkbox" ? field.checked : (field.value || "").trim();

        if (field.disabled) {
            clearError(wrap);
            return true;
        }

        // Required validation
        if (
            field.hasAttribute("required") ||
            field.dataset.required === "true" ||
            field.getAttribute("aria-required") === "true"
        ) {
            if (field.type === "checkbox" && !value) {
                setError(wrap, field.name === "terms" ? msgs.terms : msgs.required);
                return false;
            }

            if (typeof value === "string" && !value.length) {
                setError(wrap, msgs.required);
                return false;
            }
        }

        // Email validation
        if (field.type === "email" && value && !EMAIL_RE.test(value)) {
            setError(wrap, msgs.email);
            return false;
        }

        // Phone validation
        if (field.type === "tel" && value && !PHONE_RE.test(value)) {
            setError(wrap, msgs.phone);
            return false;
        }

        // Select validation
        if (field.tagName === "SELECT" && field.hasAttribute("required") && !value) {
            setError(wrap, msgs.topic);
            return false;
        }

        clearError(wrap);
        return true;
    }

    function validateAll() {
        const fields = form.querySelectorAll(`
            input[aria-required="true"],
            select[aria-required="true"],
            textarea[aria-required="true"]
        `);

        let firstInvalid = null;
        let valid = true;

        fields.forEach((field) => {
            const isValid = validateField(field);

            if (!isValid) {
                valid = false;

                if (!firstInvalid) {
                    firstInvalid = field;
                }
            }
        });

        if (firstInvalid) {
            try {
                firstInvalid.focus({
                    preventScroll: false,
                });
            } catch (e) {
                firstInvalid.focus();
            }
        }

        return valid;
    }

    // ──────────────────────────────────────────
    // Live validation
    // ──────────────────────────────────────────
    form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("input", () => {
            const wrap = field.closest(".form-field, .contact-form__terms-row");

            clearError(wrap);
        });

        field.addEventListener("change", () => {
            if (field.type === "checkbox" || field.tagName === "SELECT") {
                validateField(field);
            }
        });

        field.addEventListener("blur", () => {
            validateField(field);
        });
    });

    // ──────────────────────────────────────────
    // Submit handler
    // ──────────────────────────────────────────
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!validateAll()) {
            return;
        }

        // Allow Sitecore form to submit normally
        // Remove e.preventDefault() above if you want
        // Sitecore submit actions to execute.

        if (formWrap) {
            formWrap.hidden = true;
        }

        if (contactSection) {
            contactSection.classList.add("is-success");
        }

        if (successEl) {
            successEl.hidden = false;
            successEl.setAttribute("tabindex", "-1");

            try {
                successEl.focus({
                    preventScroll: false,
                });
            } catch (e) {
                successEl.focus();
            }

            const banner = document.querySelector(".banner");

            (banner || contactSection || successEl).scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", init);
