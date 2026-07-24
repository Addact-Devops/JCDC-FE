(function () {
  "use strict";

  function init() {
    const form = document.getElementById("register-panel");
    if (!form) return;

    form
      .querySelectorAll(
        'input[data-val="true"], textarea[data-val="true"], select[data-val="true"]',
      )
      .forEach((field) => {
        let label = null;

        if (field.id) {
          label = form.querySelector(`label[for="${field.id}"]`);
        }

        if (!label) {
          const wrapper = field.closest(".form-field");
          label = wrapper?.querySelector(".form-field__label");
        }

        if (label) {
          const asterisk = document.createElement("span");
          asterisk.className = "form-field__required";
          asterisk.setAttribute("aria-hidden", "true");
          asterisk.style.color = "red";
          asterisk.textContent = "*";

          label.appendChild(asterisk);
        }
      });

    const engagementGroup = form.querySelector(".form-group");

    if (engagementGroup) {
      const engagementGrid = document.createElement("div");
      engagementGrid.className = "register-form__engagement-grid";

      const radioCards = engagementGroup.querySelectorAll("label.radio-card");

      radioCards.forEach((card) => {
        engagementGrid.appendChild(card);
      });

      const legend = engagementGroup.querySelector(".form-group__legend");

      if (legend) {
        legend.insertAdjacentElement("afterend", engagementGrid);
      } else {
        engagementGroup.prepend(engagementGrid);
      }
    }
    const successEl = document.getElementById("register-success");
    const conditionalSections = form.querySelectorAll("[data-conditional]");

    const engagementRadios = form.querySelectorAll(
      'input[name="engagementType"]',
    );

    function updateConditional() {
      const selected = form.querySelector(
        'input[name="engagementType"]:checked',
      );
      const value = selected ? selected.value : null;

      conditionalSections.forEach((section) => {
        const matches = section.dataset.conditional === value;
        section.hidden = !matches;

        section.querySelectorAll("input, select, textarea").forEach((field) => {
          field.disabled = !matches;
          if (!matches) {
            const wrap = field.closest(".form-field, .form-phone");
            if (wrap) wrap.classList.remove("has-error", "is-invalid");
          }
        });
      });
    }

    engagementRadios.forEach((r) =>
      r.addEventListener("change", updateConditional),
    );
    updateConditional();

    form.querySelectorAll("textarea[maxlength]").forEach((ta) => {
      const max = parseInt(ta.getAttribute("maxlength"), 10);
      const counter = ta.parentElement.querySelector(".form-field__hint");
      if (!counter) return;

      const update = () => {
        counter.textContent = `${ta.value.length} / ${max}`;
      };
      ta.addEventListener("input", update);
      update();
    });

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_RE = /^\d{8,12}$/;

    function getMessages() {
      const lang =
        (window.I18n && window.I18n.get && window.I18n.get()) || "en";
      const ar = lang === "ar";
      return {
        required: ar ? "هذا الحقل مطلوب" : "This field is required",
        email: ar
          ? "يرجى إدخال بريد إلكتروني صحيح"
          : "Please enter a valid email address",
        phone: ar
          ? "يرجى إدخال رقم هاتف صحيح"
          : "Please enter a valid phone number",
        terms: ar
          ? "يجب الموافقة على الشروط للمتابعة"
          : "You must accept the Terms to continue",
        checkboxes: ar
          ? "يرجى اختيار خيار واحد على الأقل"
          : "Please select at least one option",
      };
    }

    function setError(wrapper, message) {
      if (!wrapper) return;
      wrapper.classList.add("has-error");
      const errEl = wrapper.querySelector(
        ".form-field__error, .form-group__error",
      );
      if (errEl) errEl.textContent = message || "";
      const input = wrapper.querySelector("input, select, textarea");
      if (input) input.setAttribute("aria-invalid", "true");
    }

    function clearError(wrapper) {
      if (!wrapper) return;
      wrapper.classList.remove("has-error");
      const errEl = wrapper.querySelector(
        ".form-field__error, .form-group__error",
      );
      if (errEl) errEl.textContent = "";
      const input = wrapper.querySelector("input, select, textarea");
      if (input) input.removeAttribute("aria-invalid");
    }

    function getWrapper(input) {
      return input.closest(".form-field");
    }

    function validateField(field, msgs) {
      if (field.disabled) return true;

      const wrapper = getWrapper(field);

      if (field.required) {
        if (field.type === "checkbox") {
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

      if (
        field.type === "email" &&
        field.value &&
        !EMAIL_RE.test(field.value.trim())
      ) {
        setError(wrapper, msgs.email);
        return false;
      }

      if (field.type === "tel" && field.value) {
        const digits = field.value.replace(/\D/g, "");
        if (!PHONE_RE.test(digits)) {
          setError(wrapper, msgs.phone);
          return false;
        }
      }

      clearError(wrapper);
      return true;
    }

    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("blur", () => {
        const msgs = getMessages();
        validateField(field, msgs);
      });
      field.addEventListener("input", () => {
        if (field.value || field.checked) {
          const wrapper = getWrapper(field);
          if (wrapper && wrapper.classList.contains("has-error")) {
            clearError(wrapper);
          }
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const msgs = getMessages();
      let firstInvalid = null;

      const fields = form.querySelectorAll("input, select, textarea");
      fields.forEach((field) => {
        const ok = validateField(field, msgs);
        if (!ok && !firstInvalid) firstInvalid = field;
      });

      const engagementSelected = form.querySelector(
        'input[name="engagementType"]:checked',
      );
      if (!engagementSelected) {
        const wrap = form.querySelector("[data-engagement-wrap]");
        if (wrap) {
          wrap.classList.add("has-error");
          const errEl = wrap.querySelector(".form-group__error");
          if (errEl) errEl.textContent = msgs.required;
        }
        if (!firstInvalid)
          firstInvalid = form.querySelector('input[name="engagementType"]');
      }

      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      const data = new FormData(form);
      const payload = {};
      data.forEach((v, k) => {
        if (Object.prototype.hasOwnProperty.call(payload, k)) {
          if (Array.isArray(payload[k])) payload[k].push(v);
          else payload[k] = [payload[k], v];
        } else {
          payload[k] = v;
        }
      });

      if (panel && successEl) {
        form.hidden = true;
        successEl.hidden = false;
        successEl.setAttribute("role", "status");
        successEl.focus();
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    document.querySelectorAll('a[href="#register"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const target = document.getElementById("register");
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          const firstInput = form.querySelector("input, select");
          if (firstInput) firstInput.focus({ preventScroll: true });
        }, 600);
      });
    });

    if (window.I18n && typeof window.I18n.onLangChange === "function") {
      window.I18n.onLangChange(() => {
        const msgs = getMessages();
        form.querySelectorAll(".has-error").forEach((wrap) => {
          const input = wrap.querySelector("input, select, textarea");
          if (input) validateField(input, msgs);
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
