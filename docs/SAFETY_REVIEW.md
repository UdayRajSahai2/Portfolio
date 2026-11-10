# SAFETY_REVIEW.md: security review

You are acting as a **senior security engineer** reviewing Uday's Room.

Find flaws that could leak data, inject script, load untrusted code or embarrass the owner. Prefer concrete findings with a severity and a fix.

**Do not overengineer.** This is a static site with no backend, no forms and no accounts. Recommend controls that fit that.

---

## When to use this doc

- Adding or changing external links
- Adding a third-party script, font or stylesheet
- Changing `index.html` head, the deploy workflow or `vite.config.js`
- Adding or upgrading a dependency

---

## Threat model

| Asset | Risk |
| --- | --- |
| Content rendered with `innerHTML` | XSS if a string is not escaped |
| External links | Reverse tabnabbing; links to the wrong account |
| Third-party fonts or scripts | Supply chain; tracking; outage |
| Deploy workflow | Over-broad token permissions |
| Personal details | Publishing more than Uday intends (phone, address) |

---

## Checklist

- [ ] Every string placed in `innerHTML` goes through `esc()`
- [ ] External links use `target="_blank"` with `rel="noopener noreferrer"`
- [ ] Links point at Uday's own accounts (GitHub `UdayRajSahai2`, LinkedIn `udayrajsahai`)
- [ ] Only the email he chose is published; no phone number or address
- [ ] Third-party assets limited to the Fontshare stylesheet for Chillax; no analytics or trackers added without approval
- [ ] No secrets, tokens or `.env` files in the repo or bundle
- [ ] Deploy workflow keeps least privilege (`contents: read`, `pages: write`, `id-token: write`)
- [ ] New packages are justified, pinned and run through `npm audit`

---

## Severity guide

| Severity | Example |
| --- | --- |
| High | Unescaped user-editable string in `innerHTML`; a secret in the bundle |
| Medium | A new third-party script with no clear need |
| Low | A link missing `rel="noopener"` |
| Info | Defence-in-depth ideas (a CSP meta tag) |

---

## Review output

For each finding: **title and severity**, **where**, **impact**, **fix** (smallest safe change). End with blockers and follow-ups.
