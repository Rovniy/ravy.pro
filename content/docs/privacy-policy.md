---
title: Privacy Policy
createdAt: 2025-06-15T11:34:57.692Z
lastUpdated: 2026-05-11T00:00:00.000Z
---

# Privacy Policy

**Effective Date:** May 11, 2026
**Last Updated:** May 11, 2026

This Privacy Policy describes how **XPLOIT FZE** ("we", "us", "our") collects, uses, stores, and shares personal information when you visit, interact with, or use the website [ravy.pro](https://ravy.pro) (the "Website").

We are committed to protecting your privacy and complying with applicable data protection laws, including the EU General Data Protection Regulation (GDPR), the UK GDPR, the California Consumer Privacy Act as amended by CPRA (CCPA/CPRA), and the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021).

## Table of Contents

1. [Who We Are (Data Controller)](#1-who-we-are-data-controller)
2. [Information We Collect](#2-information-we-collect)
3. [How and Why We Use Your Information (Legal Basis)](#3-how-and-why-we-use-your-information-legal-basis)
4. [Cookies and Similar Technologies](#4-cookies-and-similar-technologies)
5. [Third-Party Services and Data Sharing](#5-third-party-services-and-data-sharing)
6. [International Data Transfers](#6-international-data-transfers)
7. [Data Retention](#7-data-retention)
8. [Your Rights (GDPR / UK GDPR)](#8-your-rights-gdpr--uk-gdpr)
9. [California Residents (CCPA / CPRA)](#9-california-residents-ccpa--cpra)
10. [Data Security](#10-data-security)
11. [Data Breach Notification](#11-data-breach-notification)
12. [Automated Decision-Making](#12-automated-decision-making)
13. [Children's Privacy](#13-childrens-privacy)
14. [Third-Party Links](#14-third-party-links)
15. [Changes to This Policy](#15-changes-to-this-policy)
16. [Contact Us](#16-contact-us)
17. [Changelog](#17-changelog)

---

## 1. Who We Are (Data Controller)

The data controller responsible for your personal information is:

**XPLOIT FZE**
Business Center, Sharjah, United Arab Emirates
Email: [contact@ravy.pro](mailto:contact@ravy.pro)

For any privacy-related inquiry — including access, correction, deletion, or any GDPR/CCPA right — please write to the email above. We act as our own data protection point of contact; a dedicated DPO is not appointed as we are not required to do so under GDPR Art. 37.

## 2. Information We Collect

### 2.1 Information you provide
- **Contact form / email**: name, email address, and the content of your message.
- **Authentication (admin tools only)**: when you sign in to administrative features (e.g., Shortify), we receive your Google account email, display name, profile picture URL, and a unique user ID (UID) issued by Firebase Authentication.

### 2.2 Information collected automatically
When you visit the Website, the following may be collected:
- IP address (truncated where feasible)
- Browser type and version, operating system, device type
- Referring URL and pages viewed
- Date and time of visit
- Approximate location (country / region) derived from IP

### 2.3 Information from cookies and similar technologies
See [Section 4](#4-cookies-and-similar-technologies).

### 2.4 Information collected by features you use
- **Shortify (admin-only URL shortener)**: for each short link created, we store the destination URL, the creator's Firebase UID, the click count, and creation/last-clicked timestamps. We do **not** store the IP address or fingerprint of users who follow a short link.

We do **not** intentionally collect special categories of personal data (race, political opinions, health, etc.).

## 3. How and Why We Use Your Information (Legal Basis)

Under GDPR Art. 6, every processing activity must have a lawful basis. The table below lists each purpose.

| Purpose | Data used | Legal basis (GDPR Art. 6) |
| --- | --- | --- |
| Responding to inquiries | Name, email, message | Consent (Art. 6(1)(a)) and our legitimate interest in answering you (Art. 6(1)(f)) |
| Operating administrative features (auth, Shortify) | Google account info, UID | Performance of a contract / pre-contract steps (Art. 6(1)(b)) |
| Site security, fraud prevention, abuse detection | IP, device info, server logs | Legitimate interest (Art. 6(1)(f)) |
| Analytics (page views, navigation patterns) | Cookies, IP-derived region, device info | **Consent** (Art. 6(1)(a)) — only after you accept analytics cookies |
| Advertising measurement (if any) | Cookies, ad identifiers | **Consent** (Art. 6(1)(a)) — only after you accept advertising cookies |
| Complying with legal obligations | Any of the above as required | Legal obligation (Art. 6(1)(c)) |

We do **not** sell or rent your personal information.

## 4. Cookies and Similar Technologies

We use cookies and `localStorage` for the following purposes:

| Category | Purpose | Examples | Consent required? |
| --- | --- | --- | --- |
| **Strictly necessary** | Authentication tokens, CSRF protection, security headers, dark-mode preference, your cookie-consent choice itself | Firebase Auth session, `ravy_consent_v1` in `localStorage` | No |
| **Analytics** | Understanding how visitors use the site | Google Tag Manager (`GTM-57T2XCRL`) and its connected analytics tags | Yes |
| **Advertising** | Ad measurement and personalization, when applicable | Tags loaded via Google Tag Manager | Yes |
| **Personalization** | Remembering content preferences across visits | Site-level local storage | Yes |

### How we ask for consent
The Website implements **Google Consent Mode v2**. When you first visit, all non-essential cookies are denied by default. A cookie banner asks you to **Accept all**, **Reject all**, or **Customize** your choices. Your decision is stored in `localStorage` under the key `ravy_consent_v1`. You can change it at any time from the link in the site footer.

You may also disable cookies in your browser settings, but some features (e.g., authentication) will not work without strictly-necessary cookies.

## 5. Third-Party Services and Data Sharing

We rely on the following processors. Each is bound by a data processing agreement and/or its own privacy commitments.

| Processor | Role | Data shared | Location | Policy |
| --- | --- | --- | --- | --- |
| **Google LLC — Google Tag Manager** | Tag orchestration | Cookie data, IP, page URL (only if you consent) | USA | [policies.google.com/privacy](https://policies.google.com/privacy) |
| **Google LLC — Firebase Authentication** | Sign-in for administrative tools | Google account email, UID, profile info | USA / EU | [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy) |
| **Google LLC — Cloud Firestore** | Storage of Shortify short links | URL, creator UID, click count, timestamps | USA / EU | [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy) |
| **Hosting provider (VPS)** | Serving the Website | Standard web server logs | EU | — |

We may also disclose your information if required by law, valid legal process, or to protect our legal rights, safety, or property.

## 6. International Data Transfers

Because some of our processors (notably Google) are located in or transfer data to the **United States**, your personal data may be transferred outside the European Economic Area, the United Kingdom, or your country of residence.

Where such transfers occur, we rely on:
- The **EU-US Data Privacy Framework (DPF)** — Google LLC is certified.
- **Standard Contractual Clauses** (SCCs) approved by the European Commission, as supplementary safeguards.
- Adequacy decisions issued by the relevant authority where applicable.

You may request a copy of the safeguards in place by writing to [contact@ravy.pro](mailto:contact@ravy.pro).

## 7. Data Retention

We retain personal data only as long as needed for the purposes for which it was collected. Specifically:

| Data category | Retention period |
| --- | --- |
| Contact form messages | 24 months from last interaction, then deleted |
| Server access logs (IP, user-agent) | 30 days |
| Firebase Authentication session tokens | Until you sign out, or up to 30 days of inactivity |
| Firebase Authentication user record | Until you request account deletion |
| Shortify short links (URL, UID, clicks) | Until the creator deletes them or requests account closure |
| Analytics data (Google Tag Manager / GA4) | Up to 14 months, per GA4 default |
| Cookie consent record (`localStorage`) | 12 months, or until you clear browser storage |
| Records required by law (e.g., tax, dispute) | As required by applicable law |

When the retention period ends, data is deleted or irreversibly anonymized.

## 8. Your Rights (GDPR / UK GDPR)

If you are located in the European Economic Area, the United Kingdom, or another jurisdiction that grants similar rights, you have the right to:

- **Access** — obtain confirmation of whether we process your data and a copy of it (Art. 15).
- **Rectification** — correct inaccurate or incomplete data (Art. 16).
- **Erasure ("right to be forgotten")** — request deletion under certain conditions (Art. 17).
- **Restriction of processing** — limit how we use your data while disputes are resolved (Art. 18).
- **Data portability** — receive your data in a structured, commonly used, machine-readable format, or have it transmitted to another controller where technically feasible (Art. 20).
- **Object** — to processing based on legitimate interest (Art. 21), including profiling and direct marketing (which you can object to at any time).
- **Withdraw consent** — at any time, where processing is based on consent. Withdrawal does not affect lawfulness of processing before withdrawal (Art. 7(3)).
- **Not be subject to solely automated decisions** — including profiling — that produce legal or similarly significant effects (Art. 22). See [Section 12](#12-automated-decision-making).
- **Lodge a complaint** — with your local supervisory authority. For the UAE: the UAE Data Office. For the EU: the data protection authority in your country of residence. For the UK: the [ICO](https://ico.org.uk/).

To exercise any right, email [contact@ravy.pro](mailto:contact@ravy.pro). We will respond within **one (1) month** of receipt; this period may be extended by two further months for complex requests, in which case we will inform you within the first month.

## 9. California Residents (CCPA / CPRA)

If you are a California resident, the California Consumer Privacy Act, as amended by the CPRA, gives you the following rights:

- **Right to know** what categories of personal information we collect, the sources, the business purpose, and to whom we disclose it.
- **Right to access** a copy of the personal information we hold about you, going back 12 months (or longer on request).
- **Right to delete** personal information, subject to legal exceptions.
- **Right to correct** inaccurate personal information.
- **Right to opt out of "sale" or "sharing"** of personal information. We do **not** sell your personal information for money. However, the CPRA's broad definition of "sharing" may cover analytics and advertising cookies. By choosing **Reject all** in our cookie banner — or by using the Global Privacy Control (GPC) signal sent by your browser, which we honor — you opt out of any such sharing.
- **Right to limit use of sensitive personal information** — we do not collect or use sensitive personal information for purposes beyond what is necessary to provide the service.
- **Right to non-discrimination** — we will not discriminate against you for exercising any CCPA/CPRA right.

To exercise a California right, email [contact@ravy.pro](mailto:contact@ravy.pro) with the subject line "California Privacy Request". You may authorize an agent to act on your behalf by providing a signed permission.

**Categories of personal information collected in the last 12 months** (CCPA §1798.140 categories):
- Identifiers (IP address, email, account ID)
- Internet/network activity (browsing, referrer)
- Geolocation (approximate, derived from IP)
- Commercial information (none collected — no e-commerce)

## 10. Data Security

We implement reasonable technical and organizational measures to protect your information, including:

- HTTPS / TLS on all traffic
- HTTP security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- A strict per-route Content Security Policy with hashed inline scripts
- Role-based access control to administrative tooling
- Encrypted credentials and use of managed identity providers (Firebase) for authentication
- Principle of least privilege for service accounts

However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.

## 11. Data Breach Notification

In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will notify the competent supervisory authority **within 72 hours** of becoming aware of it, where required (GDPR Art. 33).

If the breach is likely to result in a **high risk**, we will also notify affected individuals without undue delay (GDPR Art. 34), using the email address on file or a public notice on this Website.

## 12. Automated Decision-Making

We do **not** make decisions about you based solely on automated processing — including profiling — that produce legal or similarly significant effects. If this ever changes, this Policy will be updated and you will be informed of your rights under GDPR Art. 22.

## 13. Children's Privacy

The Website is not directed to children under the age of **16**, and we do not knowingly collect personal information from children under 16 (or the applicable age of digital consent in your jurisdiction, which may be as low as 13).

If you believe a child has provided personal information without parental consent, please contact us at [contact@ravy.pro](mailto:contact@ravy.pro) and we will delete it promptly.

## 14. Third-Party Links

The Website may link to external sites (e.g., GitHub, LinkedIn, Telegram, third-party tools mentioned in blog posts). We are not responsible for the privacy practices of those sites and encourage you to review their policies independently.

## 15. Changes to This Policy

We may update this Privacy Policy from time to time. When we make material changes, we will:

- Update the **Effective Date** and **Last Updated** at the top.
- Add an entry to the [Changelog](#17-changelog).
- Where the change materially affects how we process your data, post a notice on the Website or notify you by email (if we have one).

Your continued use of the Website after the Effective Date constitutes acceptance of the updated Policy, except where additional consent is required by law.

## 16. Contact Us

For any question, request, or complaint about this Privacy Policy, or to exercise your rights:

**XPLOIT FZE**
Business Center, Sharjah, United Arab Emirates
Email: [contact@ravy.pro](mailto:contact@ravy.pro)

## 17. Changelog

| Date | Change |
| --- | --- |
| **May 11, 2026** | Major revision: added data controller identity (XPLOIT FZE), Google Consent Mode v2 cookie notice, full GDPR rights (portability, objection, restriction, automated decisions), legal-basis table, concrete retention periods, CCPA/CPRA section, international transfer disclosures, Firebase and Shortify processor disclosures. Replaced "Google Analytics" with accurate "Google Tag Manager" naming. Raised children's age from 13 to 16. Added breach-notification clause. Added table of contents and changelog. |
| June 15, 2025 | Initial version. |
