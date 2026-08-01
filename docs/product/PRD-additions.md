# Addendum: Missing Strategic Additions

These are the small but important additions that should be read alongside the PRD. The PRD itself is directionally correct; these notes add the commercial, compliance, and execution detail that must not be lost.

## 1. R20/month AI continuation model

Add the post-90-day AI continuation model.

My thinking here is simple: the first 90 days is the real K53 preparation window. After that, the R20/month option is not meant to be a subscription trap; it simply covers continued AI inference cost for users who still want the AI Coach active.

## 2. School pamphlet and QR-code acquisition loop ( Or similar )

Add the school pamphlet strategy as a core go-to-market channel.

The idea is to get the product into the learner’s hands first: pamphlet at school, learner scans the QR code, takes the free readiness test, sees the score, then goes home and motivates the parent to unlock the 90-day package.

## 3. Road-sign and content ownership moat

Add a stronger warning that the road signs and K53 content are the hard part and the real business asset.

We should not copy competitor apps, screenshots, PDFs, or paid manuals. The road signs should ideally be redrawn as our own SVG library, with verified meanings, learner-friendly explanations, common mistakes, and instructor-reviewed accuracy.

## 4. Passkey / device-binding anti-sharing strategy

Add account-sharing control, but avoid storing biometric data.

I do not want us collecting fingerprints, face scans, or any biometric identifiers. The safer route is device-native passkeys, Face ID / Touch ID / Android unlock handled by the device, one primary device per account, and re-checks only when usage looks suspicious.

## 5. MVP scope correction

The current MVP is still quite big and should be separated from the full Phase 1 product.

My view is that the MVP must prove the business first: learners use it, parents pay, schools are a viable channel, and AI explanations create real value. Full dashboards, full pass prediction, practical driving coach, voice tutor, and video/photo recognition can follow after validation.

## 6. KPI wording correction

Replace “Subscription Conversion” as a primary KPI.

Because the main model is a once-off 90-day unlock, the better KPIs are: free readiness test to paid unlock conversion, parent share/open rate, 90-day purchase conversion, and AI continuation conversion after the first 90 days.

## 7. POPIA hosting and infrastructure position

Add a clear POPIA hosting note to the technical architecture section.

Supabase Cloud and Vercel should not be treated as approved production infrastructure for live learner, parent, or school data until a POPIA review has been completed. For prototype work they are acceptable with dummy or anonymised data, but production hosting must consider South African data residency, cross-border transfers, operator agreements, subprocessors, backups, logs, AI processing, parent/guardian consent, and data-retention rules.

My preference is to treat production infrastructure as POPIA-first from day one: South African-hosted infrastructure where practical, self-hosted PostgreSQL or equivalent, server-side API control, local or POPIA-reviewed backups, encrypted data, clear retention rules, and no direct biometric storage.
