/**
 * build-pages.js
 * One-off helper that builds errorAccess.html, errorNotFound.html,
 * contact.html and supplier.html by stitching:
 *   - the existing index.html <head> + <header> + <drawer> + <overlay> block
 *   - each page's body content
 *   - the existing index.html <footer> + closing tags
 *
 * Each page is written to the project root.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "index.html");

const indexHtml = fs.readFileSync(INDEX, "utf8");

// Slice 1: <!doctype …> down to and including the closing </aside> + overlay div
// We anchor on the marker `<div class="overlay" id="overlay"></div>` which appears
// right after the drawer.
const overlayMarker = '<div class="overlay" id="overlay"></div>';
const overlayIdx = indexHtml.indexOf(overlayMarker);
if (overlayIdx === -1) throw new Error("Could not find overlay marker in index.html");
const headerBlock = indexHtml.slice(0, overlayIdx + overlayMarker.length);

// Slice 2: footer + scripts + closing tags. Find the opening <footer class="footer">
const footerStart = indexHtml.indexOf('<footer class="footer">');
if (footerStart === -1) throw new Error("Could not find <footer> in index.html");
const footerBlock = indexHtml.slice(footerStart);

// ---------- Helpers ----------
function pageHead(metaKey, metaTitle, description) {
    // We replace the <title> and <meta description> in the original head
    // by patching the first `<title …>…</title>` we find.
    let head = headerBlock;
    head = head.replace(/<title[^>]*>[^<]*<\/title>/, `<title data-i18n="${metaKey}">${metaTitle}</title>`);
    // Insert description meta after viewport meta
    head = head.replace(
        /(<meta name="viewport"[^>]*>)/,
        `$1\n        <meta name="description" content="${description}" />`,
    );
    return head;
}

function buildPage({ metaKey, metaTitle, description, body, solidNav }) {
    let head = pageHead(metaKey, metaTitle, description);
    if (solidNav) {
        head = head.replace(
            /<header class="navbar" id="navbar">/,
            '<header class="navbar navbar--always-solid" id="navbar">',
        );
    }
    return head + "\n\n" + body + "\n\n        " + footerBlock;
}

// ---------- 403 Error Page ----------
const errorAccess = buildPage({
    metaKey: "error403.metaTitle",
    metaTitle: "JCDC — 403 Access Denied",
    description: "Access Denied — you do not have permission to access this page on JCDC.",
    solidNav: true,
    body: `        <!-- ════════════════════════════════════════════
        403 ACCESS DENIED
════════════════════════════════════════════ -->
        <main class="error-page error-page--standalone" aria-labelledby="error-title">
            <div class="error-page__container">
                <p class="error-page__code" data-i18n="error403.code" aria-hidden="true">403</p>

                <div class="error-page__body">
                    <h1 class="error-page__title" id="error-title" data-i18n="error403.title">
                        Access Denied
                    </h1>
                    <p class="error-page__description">
                        <span data-i18n="error403.description1">You do not have permission to access this page.</span>
                        <br />
                        <span data-i18n="error403.description2">Try using the search bar or head back to the Home page.</span>
                    </p>
                </div>

                <div class="error-page__cta-wrap">
                    <a href="index.html" class="btn btn--outline-gold error-page__cta" aria-label="Go to Homepage">
                        <span data-i18n="error403.cta">Go to Homepage</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M5 12h14M13 6l6 6-6 6"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </main>`,
});

// ---------- 404 Error Page ----------
const errorNotFound = buildPage({
    metaKey: "error404.metaTitle",
    metaTitle: "JCDC — 404 Page Not Found",
    description: "Page Not Found — the page you are looking for does not exist on JCDC.",
    solidNav: true,
    body: `        <!-- ════════════════════════════════════════════
        404 PAGE NOT FOUND
════════════════════════════════════════════ -->
        <main class="error-page error-page--standalone" aria-labelledby="error-title">
            <div class="error-page__container">
                <p class="error-page__code" data-i18n="error404.code" aria-hidden="true">404</p>

                <div class="error-page__body">
                    <h1 class="error-page__title" id="error-title" data-i18n="error404.title">
                        Page Not Found
                    </h1>
                    <p class="error-page__description">
                        <span data-i18n="error404.description1">Sorry, the page you're looking for doesn't exist or may have been moved.</span>
                        <br />
                        <span data-i18n="error404.description2">Try using the search bar or head back to the Home page.</span>
                    </p>
                </div>

                <div class="error-page__cta-wrap">
                    <a href="index.html" class="btn btn--outline-gold error-page__cta" aria-label="Go to Homepage">
                        <span data-i18n="error404.cta">Go to Homepage</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M5 12h14M13 6l6 6-6 6"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </main>`,
});

// ---------- Contact Us Page ----------
const contact = buildPage({
    metaKey: "contact.metaTitle",
    metaTitle: "JCDC — Contact Us",
    description:
        "Contact JCDC — Have a question or inquiry? Reach out to our team for business, media, or general information.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER (reused — Contact Us copy)
════════════════════════════════════════════ -->
        <section class="banner" aria-labelledby="contact-hero-title">
            <div class="hero__media">
                <img src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">
                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="contact.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="contact.breadcrumb.current">Contact Us</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="contact-hero-title" data-i18n="contact.hero.title">
                            Contact Us
                        </h1>
                        <p class="banner__description" data-i18n="contact.hero.description">
                            Have a question or inquiry? Whether it's about business opportunities, media relations, or general information, we're ready to assist.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        CONTACT US (form + address — 50/50 grid)
════════════════════════════════════════════ -->
        <section class="contact-us" aria-labelledby="contact-form-heading">
            <div class="contact-us__container">
                <div class="contact-us__grid">

                    <!-- ───────── LEFT: Form / Success ───────── -->
                    <div class="contact-us__left">

                        <!-- Form wrapper (hidden after submit) -->
                        <div id="contact-form-wrap">
                            <h2 class="contact-us__heading" id="contact-form-heading" data-i18n="contact.form.heading">
                                Please fill out the form below and the relevant team will reach out to assist you.
                            </h2>

                            <form class="contact-form" id="contact-form" novalidate>
                                <!-- First / Last name row -->
                                <div class="contact-form__row">
                                    <div class="form-field">
                                        <label class="form-field__label" for="cu-first">
                                            <span data-i18n="contact.form.firstName">First Name</span>
                                            <span class="form-field__required" aria-hidden="true">*</span>
                                        </label>
                                        <input class="form-field__input" type="text" id="cu-first" name="firstName" required autocomplete="given-name" />
                                        <span class="form-field__error" role="alert"></span>
                                    </div>

                                    <div class="form-field">
                                        <label class="form-field__label" for="cu-last">
                                            <span data-i18n="contact.form.lastName">Last Name</span>
                                            <span class="form-field__required" aria-hidden="true">*</span>
                                        </label>
                                        <input class="form-field__input" type="text" id="cu-last" name="lastName" required autocomplete="family-name" />
                                        <span class="form-field__error" role="alert"></span>
                                    </div>
                                </div>

                                <!-- Email -->
                                <div class="form-field">
                                    <label class="form-field__label" for="cu-email">
                                        <span data-i18n="contact.form.email">Email</span>
                                        <span class="form-field__required" aria-hidden="true">*</span>
                                    </label>
                                    <input class="form-field__input" type="email" id="cu-email" name="email" required autocomplete="email" />
                                    <span class="form-field__error" role="alert"></span>
                                </div>

                                <!-- Phone -->
                                <div class="form-field">
                                    <label class="form-field__label" for="cu-phone">
                                        <span data-i18n="contact.form.phone">Phone Number</span>
                                        <span class="form-field__required" aria-hidden="true">*</span>
                                    </label>
                                    <input class="form-field__input" type="tel" id="cu-phone" name="phone" required autocomplete="tel" />
                                    <span class="form-field__error" role="alert"></span>
                                </div>

                                <!-- Topic -->
                                <div class="form-field">
                                    <label class="form-field__label" for="cu-topic" data-i18n="contact.form.topic">
                                        Choose a Topic
                                    </label>
                                    <select class="form-field__input form-field__select" id="cu-topic" name="topic">
                                        <option value="" data-i18n="contact.form.selectTopic">Select Topic</option>
                                        <option value="business" data-i18n="contact.form.topics.business">Business Opportunities</option>
                                        <option value="media" data-i18n="contact.form.topics.media">Media Relations</option>
                                        <option value="general" data-i18n="contact.form.topics.general">General Information</option>
                                        <option value="careers" data-i18n="contact.form.topics.careers">Careers</option>
                                        <option value="suppliers" data-i18n="contact.form.topics.suppliers">Suppliers</option>
                                    </select>
                                    <span class="form-field__error" role="alert"></span>
                                </div>

                                <!-- Message -->
                                <div class="form-field">
                                    <label class="form-field__label" for="cu-message">
                                        <span data-i18n="contact.form.message">Message</span>
                                        <span class="form-field__required" aria-hidden="true">*</span>
                                    </label>
                                    <textarea class="form-field__input form-field__textarea" id="cu-message" name="message" rows="6" required></textarea>
                                    <span class="form-field__error" role="alert"></span>
                                </div>

                                <!-- T&C -->
                                <div class="contact-form__terms-row">
                                    <label class="form-check">
                                        <input class="form-check__input" type="checkbox" name="terms" data-required="true" />
                                        <span class="form-check__box" aria-hidden="true"></span>
                                        <span class="form-check__label">
                                            <span data-i18n="contact.form.terms">I accept the</span>
                                            <a href="terms&condition.html" data-i18n="contact.form.termsLink">Terms and Conditions</a>
                                        </span>
                                    </label>
                                    <span class="form-field__error" role="alert" style="margin-inline-start:28px;"></span>
                                </div>

                                <!-- Submit -->
                                <div class="contact-form__submit-row">
                                    <button type="submit" class="btn btn--outline-gold contact-form__submit" data-i18n="contact.form.submit">
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- Success state -->
                        <div class="contact-success" id="contact-success" hidden tabindex="-1">
                            <div class="contact-success__icon" aria-hidden="true">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M5 13l4 4L19 7"
                                        stroke="currentColor"
                                        stroke-width="2.4"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                            <h2 class="contact-success__title" data-i18n="contact.success.title">
                                Message Received
                            </h2>
                            <p class="contact-success__text" data-i18n="contact.success.text">
                                Thank you for reaching out. Our team has received your message and will get back to you soon.
                            </p>
                            <a href="index.html" class="contact-success__link">
                                <span data-i18n="contact.success.back">Go Back to Homepage</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                        d="M7 17L17 7M9 7h8v8"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- ───────── RIGHT: Address card + directions ───────── -->
                    <aside class="contact-us__right" aria-label="Office address">
                        <div class="contact-us__address-card">
                            <h2 class="contact-us__address-title" data-i18n="contact.address.title">
                                JCDC Head Office
                            </h2>
                            <address class="contact-us__address-text">
                                <span data-i18n="contact.address.line1">Jeddah Central Development Company</span><br />
                                <span data-i18n="contact.address.line2">7051 Prince Sultan - As Salamah Dist.</span><br />
                                <span data-i18n="contact.address.line3">Unit No 9959</span><br />
                                <span data-i18n="contact.address.line4">Jeddah 23525 - 2661</span><br />
                                <span data-i18n="contact.address.line5">Kingdom of Saudi Arabia</span>
                            </address>
                        </div>

                        <a href="https://maps.google.com/?q=Jeddah+Central+Development+Company"
                           class="contact-us__directions" target="_blank" rel="noopener noreferrer">
                            <span data-i18n="contact.address.directions">Get Directions</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M7 17L17 7M9 7h8v8"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </a>
                    </aside>

                </div>
            </div>
        </section>`,
});

// ---------- Become a Supplier Page ----------
const supplier = buildPage({
    metaKey: "supplier.metaTitle",
    metaTitle: "JCDC — Suppliers",
    description:
        "Become a supplier at JCDC — Register to be considered for future construction, consulting, materials, and technology opportunities.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER (reused — Supplier copy)
════════════════════════════════════════════ -->
        <section class="banner" aria-labelledby="supplier-hero-title">
            <div class="hero__media">
                <img src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">
                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="supplier.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="supplier.breadcrumb.current">Suppliers</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="supplier-hero-title" data-i18n="supplier.hero.title">
                            Supplier Registration
                        </h1>
                        <p class="banner__description" data-i18n="supplier.hero.description">
                            We welcome qualified suppliers who share our commitment to quality, reliability, and operational excellence. Begin your registration to be considered for future opportunities.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        WHO SHOULD REGISTER (2x2 categories)
════════════════════════════════════════════ -->
        <section class="who-register" aria-labelledby="who-register-title">
            <div class="who-register__container">
                <div class="who-register__header">
                    <h2 class="who-register__title" id="who-register-title" data-i18n="supplier.whoRegister.title">
                        Who Should Register
                    </h2>
                    <p class="who-register__subtitle" data-i18n="supplier.whoRegister.subtitle">
                        If you provide any of the following, we encourage you to register
                    </p>
                </div>

                <div class="who-register__grid">
                    <article class="who-register__card">
                        <h3 class="who-register__card-title" data-i18n="supplier.whoRegister.cards.constructionTitle">
                            Construction & Specialized Work
                        </h3>
                        <p class="who-register__card-description" data-i18n="supplier.whoRegister.cards.constructionDesc">
                            Contractors, construction companies, and specialized trade professionals
                        </p>
                    </article>

                    <article class="who-register__card">
                        <h3 class="who-register__card-title" data-i18n="supplier.whoRegister.cards.consultingTitle">
                            Consulting & Professional Services
                        </h3>
                        <p class="who-register__card-description" data-i18n="supplier.whoRegister.cards.consultingDesc">
                            Consultants, advisors, and professional service providers
                        </p>
                    </article>

                    <article class="who-register__card">
                        <h3 class="who-register__card-title" data-i18n="supplier.whoRegister.cards.materialsTitle">
                            Materials, Finishes & Equipment Supply
                        </h3>
                        <p class="who-register__card-description" data-i18n="supplier.whoRegister.cards.materialsDesc">
                            Suppliers of construction materials, finishes, and equipment
                        </p>
                    </article>

                    <article class="who-register__card">
                        <h3 class="who-register__card-title" data-i18n="supplier.whoRegister.cards.techTitle">
                            Technology, Digital & Sustainable Solutions
                        </h3>
                        <p class="who-register__card-description" data-i18n="supplier.whoRegister.cards.techDesc">
                            Digital solutions, technology providers, and sustainability specialists
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        REGISTRATION PROCESS
════════════════════════════════════════════ -->
        <section class="registration-process" aria-labelledby="registration-process-title">
            <div class="registration-process__container">
                <div class="registration-process__header">
                    <h2 class="registration-process__title" id="registration-process-title" data-i18n="supplier.process.title">
                        Registration Process
                    </h2>
                    <div class="section-pattern" aria-hidden="true">
                        <img src="./assets/pattern1.svg" alt="" width="22.46" height="21.3"
                             style="position: absolute; left: 0px; top: 1.35px" />
                        <img src="./assets/pattern2.svg" alt="" width="25.29" height="24"
                             style="position: absolute; left: 25.73px; top: 0px" />
                        <img src="./assets/pattern1.svg" alt="" width="22.46" height="21.3"
                             style="position: absolute; left: 52px; top: 1.35px" />
                        <img src="./assets/pattern2.svg" alt="" width="25.29" height="24"
                             style="position: absolute; left: 78px; top: 0px" />
                    </div>
                </div>

                <div class="registration-process__grid">
                    <!-- Steps -->
                    <ol class="registration-process__steps" role="list">
                        <li class="process-step">
                            <p class="process-step__number" data-i18n="supplier.process.step1Number">01</p>
                            <h3 class="process-step__title" data-i18n="supplier.process.step1Title">
                                Submit Supplier Self-Registration Request
                            </h3>
                            <p class="process-step__description" data-i18n="supplier.process.step1Desc">
                                Complete and submit the Supplier Self-Registration Request Form through the link below for initial review.
                            </p>
                        </li>

                        <li class="process-step">
                            <p class="process-step__number" data-i18n="supplier.process.step2Number">02</p>
                            <h3 class="process-step__title" data-i18n="supplier.process.step2Title">
                                Complete Supplier Registration Questionnaire
                            </h3>
                            <p class="process-step__description" data-i18n="supplier.process.step2Desc">
                                Upon preliminary approval, you will receive an SAP Ariba notification to complete the Supplier Registration Questionnaire and upload the required documents.
                            </p>
                        </li>

                        <li class="process-step">
                            <p class="process-step__number" data-i18n="supplier.process.step3Number">03</p>
                            <h3 class="process-step__title" data-i18n="supplier.process.step3Title">
                                Evaluation and Approval
                            </h3>
                            <p class="process-step__description" data-i18n="supplier.process.step3Desc">
                                Once submitted, your application will be evaluated in accordance with our procurement policies and business requirements.
                            </p>
                        </li>
                    </ol>

                    <!-- Important Notice card -->
                    <aside class="notice-card" aria-labelledby="notice-title">
                        <h3 class="notice-card__title" id="notice-title" data-i18n="supplier.process.noticeTitle">
                            Important Notice
                        </h3>
                        <p class="notice-card__text" data-i18n="supplier.process.noticeText">
                            Please Note: Submission of an application does not guarantee qualification, engagement, or contract award. All registrations are subject to review in line with company procedures.
                        </p>
                        <a href="#" class="btn btn--outline-gold notice-card__cta" target="_blank" rel="noopener noreferrer">
                            <span data-i18n="supplier.process.noticeCta">Access Supplier Portal</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M5 12h14M13 6l6 6-6 6"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </a>
                    </aside>
                </div>
            </div>
        </section>`,
});

// ---------- Search Page ----------
const search = buildPage({
    metaKey: "search.metaTitle",
    metaTitle: "JCDC — Search",
    description: "Search the JCDC website for news, projects, opportunities, and more.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER (reused — Search copy)
════════════════════════════════════════════ -->
        <section class="banner" aria-labelledby="search-hero-title">
            <div class="hero__media">
                <img src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">
                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="search.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="search.breadcrumb.current">Search</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="search-hero-title" data-i18n="search.hero.title">
                            Search
                        </h1>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        SEARCH PAGE — input + results + pagination
════════════════════════════════════════════ -->
        <section class="search-page" id="search-page" aria-labelledby="search-hero-title">
            <div class="search-page__container">
                <form class="search-page__search" id="search-form" novalidate>
                    <label class="search-page__label" for="search-input" data-i18n="search.label">
                        Search Query
                    </label>
                    <div class="search-page__row">
                        <input class="search-page__input"
                               id="search-input"
                               name="q"
                               type="search"
                               autocomplete="off"
                               data-i18n-placeholder="search.placeholder"
                               placeholder="Search Query" />
                        <button type="submit" class="btn btn--outline-gold search-page__submit">
                            <span data-i18n="search.submit">Search</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d="M5 12h14M13 6l6 6-6 6"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                </form>

                <p class="search-page__meta" id="search-meta" hidden></p>

                <ol class="search-page__results" id="search-results"></ol>

                <p class="search-page__empty" id="search-empty" data-i18n="search.empty" hidden>
                    No results found. Try different keywords.
                </p>

                <ul class="pagination" id="search-pagination" aria-label="Search pagination"></ul>
            </div>
        </section>`,
});

// ---------- News & Events Listing Page ----------
const newsListing = buildPage({
    metaKey: "newsListing.metaTitle",
    metaTitle: "JCDC — News & Events",
    description: "Latest news, events, and milestones from Jeddah Central Development Company.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER (reused — News & Events copy)
════════════════════════════════════════════ -->
        <section class="banner" aria-labelledby="news-listing-hero-title">
            <div class="hero__media">
                <img src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">
                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="newsListing.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="newsListing.breadcrumb.current">News &amp; Events</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="news-listing-hero-title" data-i18n="newsListing.hero.title">
                            News and Events
                        </h1>
                        <p class="banner__description" data-i18n="newsListing.hero.description">
                            Stay up to date with Jeddah Central Development Company (JCDC) as we build partnerships, achieve milestones, and advance the development of Jeddah Central.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        NEWS LISTING — search/date controls + filters + grid
════════════════════════════════════════════ -->
        <section class="news-listing" id="news-listing" aria-labelledby="news-listing-hero-title">
            <div class="news-listing__container">

                <!-- Top controls: Search + From + To -->
                <div class="news-listing__controls">
                    <div class="news-listing__field">
                        <label class="news-listing__label" for="nl-search" data-i18n="newsListing.search">Search</label>
                        <form class="news-listing__search" id="nl-search-form" novalidate>
                            <div class="news-listing__search-input-wrap">
                                <svg class="news-listing__search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.6"/>
                                    <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                                </svg>
                                <input class="news-listing__search-input"
                                       id="nl-search"
                                       name="q"
                                       type="search"
                                       autocomplete="off"
                                       data-i18n-placeholder="newsListing.searchPlaceholder"
                                       placeholder="Search for topic" />
                            </div>
                            <button type="submit" class="news-listing__search-btn" data-i18n="newsListing.search">
                                Search
                            </button>
                        </form>
                    </div>

                    <div class="news-listing__field">
                        <label class="news-listing__label" for="nl-date-from" data-i18n="newsListing.from">From</label>
                        <div class="news-listing__date" id="nl-date-from-wrap">
                            <svg class="news-listing__date-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/>
                                <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                            <span class="news-listing__date-text" data-i18n="newsListing.chooseDate">Choose Date</span>
                            <svg class="news-listing__date-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input class="news-listing__date-input" id="nl-date-from" name="from" type="date" aria-label="From date" />
                        </div>
                    </div>

                    <div class="news-listing__field">
                        <label class="news-listing__label" for="nl-date-to" data-i18n="newsListing.to">To</label>
                        <div class="news-listing__date" id="nl-date-to-wrap">
                            <svg class="news-listing__date-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/>
                                <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            </svg>
                            <span class="news-listing__date-text" data-i18n="newsListing.chooseDate">Choose Date</span>
                            <svg class="news-listing__date-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <input class="news-listing__date-input" id="nl-date-to" name="to" type="date" aria-label="To date" />
                        </div>
                    </div>
                </div>

                <!-- Filter chips (rendered by JS) -->
                <div class="news-listing__filters" id="news-listing-filters" role="group" aria-label="Filters"></div>

                <!-- Grid of cards (rendered by JS) -->
                <div class="news-listing__grid" id="news-listing-grid"></div>

                <!-- Empty state -->
                <p class="news-listing__empty" id="news-listing-empty" data-i18n="newsListing.empty" hidden>
                    No articles match your filters. Try clearing filters or searching for something else.
                </p>

                <!-- Pagination -->
                <ul class="pagination" id="news-listing-pagination" aria-label="News pagination" hidden></ul>

            </div>
        </section>`,
});

// ---------- News Item / Article Page ----------
const newsItem = buildPage({
    metaKey: "newsItem.metaTitle",
    metaTitle: "JCDC — News & Events",
    description: "Read the latest news article from Jeddah Central Development Company.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER — news item variant (title + date)
════════════════════════════════════════════ -->
        <section class="banner banner--news-item" aria-labelledby="news-item-title">
            <div class="hero__media">
                <img id="news-item-hero-img" src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">
                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="newsItem.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <a href="#" class="banner__breadcrumbs-link" data-i18n="newsItem.breadcrumb.news">News &amp; Events</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="newsItem.breadcrumb.current">News Item</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="news-item-title">&nbsp;</h1>
                        <p class="banner__date" id="news-item-date">&nbsp;</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        NEWS ITEM — article body + related sidebar
════════════════════════════════════════════ -->
        <section class="news-item" id="news-item">
            <div class="news-item__container">
                <div class="news-item__grid">
                    <article class="news-item__article" id="news-item-article" aria-labelledby="news-item-title"></article>

                    <aside class="news-item__sidebar" aria-label="Other articles">
                        <h2 class="news-item__sidebar-title" data-i18n="newsItem.sidebarTitle">
                            Other Articles
                        </h2>
                        <ol class="news-item__related-list" id="news-item-related"></ol>
                    </aside>
                </div>
            </div>
        </section>`,
});

// ---------- Attraction Page ----------
const attraction = buildPage({
    metaKey: "attraction.metaTitle",
    metaTitle: "JCDC — Attractions",
    description:
        "Explore the 10 signature attractions of Jeddah Central — from the marina and pier to public beaches, parks, plazas, and cultural quarters.",
    body: `        <!-- ════════════════════════════════════════════
        HERO BANNER — Attractions copy with logo mark above breadcrumb
        and a 3-level breadcrumb (Home › Jeddah Central Destination › Attractions)
════════════════════════════════════════════ -->
        <section class="banner" aria-labelledby="attraction-hero-title">
            <div class="hero__media">
                <img src="assets/herobanner.svg" alt="" loading="eager" />
            </div>
            <div class="banner__overlay"></div>

            <div class="container">
                <div class="banner__content">

                    <!-- Small Jeddah Central diamond mark above the breadcrumb -->
                    <div class="banner__logo-mark" aria-hidden="true">
                        <img src="assets/jeddah-central-mark.svg" alt="" width="56" />
                        <span class="banner__logo-wordmark" data-i18n="attraction.logoLabel">Jeddah Central</span>
                    </div>

                    <nav class="banner__breadcrumbs" aria-label="Breadcrumb">
                        <a href="index.html" class="banner__breadcrumbs-link" data-i18n="attraction.breadcrumb.home">Home</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <a href="#" class="banner__breadcrumbs-link" data-i18n="attraction.breadcrumb.destination">Jeddah Central Destination</a>
                        <span class="banner__breadcrumbs-separator" aria-hidden="true">›</span>
                        <span class="banner__breadcrumbs-current" data-i18n="attraction.breadcrumb.current">Attractions</span>
                    </nav>

                    <div>
                        <h1 class="banner__title" id="attraction-hero-title" data-i18n="attraction.hero.title">
                            Explore Jeddah Central's Attractions
                        </h1>
                        <p class="banner__description" data-i18n="attraction.hero.description">
                            Jeddah Central is home to 10 signature attractions designed to foster connection, culture, and community. From its scenic marina and pier to public beaches and vibrant parks - each experience invites exploration for residents, families, and visitors alike.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- ════════════════════════════════════════════
        ATTRACTION SLIDER
        Active image with title overlay → district + description →
        horizontally-scrollable thumbnail strip. Clicking a thumbnail
        swaps the active content with a fade transition.
════════════════════════════════════════════ -->
        <section class="attraction-slider" id="attraction-slider" aria-label="Attractions">
            <div class="attraction-slider__container">

                <!-- Active image with translucent title overlay -->
                <div class="attraction-slider__active">
                    <div class="attraction-slider__active-image" id="attraction-active-image">
                        <img src="" alt="" />
                    </div>
                    <div class="attraction-slider__title-overlay" id="attraction-title-overlay">
                        <h2 class="attraction-slider__title" id="attraction-title">&nbsp;</h2>
                    </div>
                </div>

                <!-- District + description (below the image) -->
                <div class="attraction-slider__info" id="attraction-info">
                    <p class="attraction-slider__district" id="attraction-district">&nbsp;</p>
                    <p class="attraction-slider__description" id="attraction-description">&nbsp;</p>
                </div>

                <!-- Horizontally-scrollable thumbnail strip -->
                <div class="attraction-slider__strip" id="attraction-strip" role="tablist" aria-label="Choose an attraction"></div>
            </div>
        </section>`,
});

// ---------- Write all pages ----------
const pages = {
    "errorAccess.html": errorAccess,
    "errorNotFound.html": errorNotFound,
    "contact.html": contact,
    "supplier.html": supplier,
    "search.html": search,
    "news.html": newsListing,
    "news-item.html": newsItem,
    "attraction.html": attraction,
};

for (const [name, html] of Object.entries(pages)) {
    fs.writeFileSync(path.join(ROOT, name), html, "utf8");
    const sizeKb = (fs.statSync(path.join(ROOT, name)).size / 1024).toFixed(2);
    console.log(`[build-pages] Wrote ${name} (${sizeKb} KB)`);
}
