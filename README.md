# Alabi Joy’s Sweet Sixteen 💚🖤💗

A password-protected birthday experience for Alabi Joy, with a personal birthday letter, four short reminders, three interactive gift boxes, 25 interactive birthday envelopes, a random-surprise button, progress tracking, a full-open celebration, and an embedded YouTube player for **“Gratitude” by Anendlessocean**. The layout uses green, black, and pink. No photographs are required.

## Requirements

- Node.js 20 or newer
- Internet connection for installing dependencies, password verification, and YouTube music



## Features and behavior

- Birthday content is returned by a protected server API only after a successful password check.
- Login attempts are limited to five per 15 minutes per IP.
- Session cookies are HTTP-only, SameSite=Strict, and Secure in production.
- Birthday letter and wishes stay available during the session and can be revisited.
- Envelope progress is stored in the same browser/device using local storage. It is not shared across devices or browsers.
- Opening all 25 envelopes triggers a celebration. The random button opens an unopened envelope first; after all are opened it selects any envelope.
- The PWA caches the public app shell after an online visit. It does **not** cache the protected birthday content or authentication API. Reconnecting is required to unlock after a fresh offline start. YouTube music always requires internet.

## Install on a device

Open the deployed HTTPS link in a supported browser. Use the in-page **Install** control when it appears, or use the browser’s install option. On iPhone/iPad, open the website in Safari, tap Share, and choose **Add to Home Screen**. Exact menu wording can vary by browser version.

## Before sharing

- Test correct and incorrect passwords.
- Check the letter, reminders, gift boxes, all 25 envelopes, random surprise, progress counter, and full-open celebration.
- Test on a small phone, a tablet, and a desktop browser.
- Test the installed app after one online visit, then check its offline limitations.
- Test the music player and confirm the correct official video opens.

The app includes practical protections but is not a guarantee of perfect security. Keep the password private and rotate the password/secret if they are exposed.
