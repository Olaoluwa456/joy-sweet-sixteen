# Alabi Joy’s Sweet Sixteen 💚🖤💗

A password-protected birthday experience for Alabi Joy, with a personal birthday letter, four short reminders, three interactive gift boxes, 25 interactive birthday envelopes, a random-surprise button, progress tracking, a full-open celebration, and an embedded YouTube player for **“Gratitude” by Anendlessocean**. The layout uses green, black, and pink. No photographs are required.

## Requirements

- Node.js 20 or newer
- Internet connection for installing dependencies, password verification, and YouTube music

## Run locally on Windows

1. Extract the ZIP file.
2. Open the `alabi-joy-sweet-sixteen` folder.
3. Click the folder’s address bar, type `powershell`, and press Enter.
4. Create the private settings file:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

5. In Notepad, replace `APP_PASSWORD` with a private password of at least 12 characters. Replace `SESSION_SECRET` with a unique random string of at least 32 characters. Keep `.env` private and never upload it to GitHub. Save and close Notepad.
6. Install dependencies:

   ```powershell
   npm.cmd install
   ```

7. Start the app:

   ```powershell
   npm.cmd start
   ```

8. Visit `http://localhost:3000`.

Keep PowerShell open while using the local app. Stop it with Ctrl+C.

## Deploy on Render

Create a **Web Service** connected to the GitHub repository containing these project files. When uploading to GitHub, upload the **contents** of the `alabi-joy-sweet-sixteen` folder, not an extra enclosing folder. `package.json` must appear on the repository’s main page.

- **Root Directory:** leave blank when `package.json` is at the repository root. If you intentionally keep the project inside a subfolder, set Root Directory to that exact subfolder name.
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Runtime:** Node.js 20 or newer (`.nvmrc` is included).

Add these environment variables in Render:

- `NODE_ENV` = `production`
- `APP_PASSWORD` = a unique password of at least 12 characters
- `SESSION_SECRET` = a unique random secret of at least 32 characters

No MongoDB connection is required for this version. The login session is a signed, HTTP-only cookie and expires after one hour. On Render, configure HTTPS (Render provides HTTPS for its public service URL). Do not put secrets into source code or a public repository.

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
