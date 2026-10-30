'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 60 * 60 * 1000;
const COOKIE_NAME = 'joy.sid';

if (APP_PASSWORD.length < 12 || SESSION_SECRET.length < 32) {
  console.error('Configuration error: APP_PASSWORD must be at least 12 characters and SESSION_SECRET must be at least 32 characters.');
  process.exit(1);
}

app.disable('x-powered-by');
if (IS_PRODUCTION) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      frameSrc: ['https://www.youtube-nocookie.com'],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: IS_PRODUCTION ? [] : null
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(express.json({ limit: '4kb', strict: true }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait 15 minutes before trying again.' }
});
app.use('/api/login', loginLimiter);
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  res.set('Pragma', 'no-cache');
  next();
});

function safeEqual(leftValue, rightValue) {
  const left = crypto.createHash('sha256').update(String(leftValue)).digest();
  const right = crypto.createHash('sha256').update(String(rightValue)).digest();
  return crypto.timingSafeEqual(left, right);
}

function signPayload(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function readCookieHeader(header, name) {
  if (!header) return '';
  const prefix = `${name}=`;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return '';
}

function hasValidSession(req) {
  try {
    const token = readCookieHeader(req.headers.cookie, COOKIE_NAME);
    const separator = token.lastIndexOf('.');
    if (separator <= 0) return false;
    const payload = token.slice(0, separator);
    const suppliedSignature = token.slice(separator + 1);
    const expectedSignature = signPayload(payload);
    if (!suppliedSignature || !safeEqual(suppliedSignature, expectedSignature)) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session && session.unlocked === true && Number.isFinite(session.exp) && Date.now() < session.exp;
  } catch (_) {
    return false;
  }
}

function requireUnlock(req, res, next) {
  if (!hasValidSession(req)) return res.status(401).json({ error: 'Please unlock the birthday surprise first.' });
  next();
}

function setSessionCookie(res) {
  const payload = Buffer.from(JSON.stringify({ unlocked: true, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const token = `${payload}.${signPayload(payload)}`;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: SESSION_TTL_MS,
    path: '/',
    priority: 'high'
  });
}

const birthdayContent = {
  recipient: 'Alabi',
  fullName: 'Alabi Joy',
  age: 16,
  letter: [
    'Happy 16th birthday, Joy! Today is a chance to celebrate you, the memories you have made, the people who make life meaningful, and all the good things still ahead of you.',
    'May God continue to guide you, give you wisdom, protect you, and help you recognise the good opportunities that come your way. May your faith stay strong and may you always find reasons to be grateful.',
    'I hope your days include plenty of laughter, good food, thoughtful gifts, lovely surprises, and many more happy moments with your family. May the people who care about you continue to bring encouragement and warmth into your life.',
    'Keep making room for your big dreams. May you have the focus and confidence to work towards becoming a lawyer, and the creativity and determination to build a successful business of your own. Take each step at your pace; every lesson and every effort can help you grow.',
    'May you enjoy good health, genuine friendships, peace of mind, financial wisdom, and opportunities that help you build the future you want. May you have enough to enjoy the things you love and enough kindness to share good things with others.',
    'And whenever you need a little encouragement, come back to this page. Read this letter again, open a wish, or play your song. Let it remind you that your story is still unfolding and there are many beautiful chapters ahead.',
    'Happy Sweet Sixteen, Joy. May this year bring you reasons to smile, memories worth keeping, and progress you can be proud of. 💚🖤💗'
  ],
  notes: [
    ['A little reminder', 'You do not have to have everything figured out today. Keep learning, keep growing, and take the next good step.'],
    ['For your dreams', 'May your ambition stay bright and may you find the patience, support, and opportunities to turn your plans into reality.'],
    ['For your family', 'May you make many more memories with the people you love, from the big celebrations to the simplest everyday moments.'],
    ['For the days ahead', 'May God guide you, protect your peace, and fill your days with genuine joy and meaningful progress.']
  ],
  envelopes: [
    ['A year of joy', 'May this new year of your life bring genuine happiness, laughter that comes easily, and many moments you will love remembering.'],
    ['God’s direction', 'May God guide your steps, give you wisdom in your choices, and help you recognise the opportunities that are right for you.'],
    ['Your family', 'May you share many more beautiful moments with your family. May love, understanding, good health, and togetherness remain part of your story.'],
    ['The lawyer in you', 'May you grow in knowledge, confidence, discipline, and courage as you work towards becoming a lawyer. May your efforts open meaningful doors.'],
    ['A successful business', 'May your ideas develop into something you are proud of. May you one day build a successful business that creates value and opportunities.'],
    ['Financial blessings', 'May you have access to good opportunities, the resources to pursue your goals, and the wisdom to manage money well.'],
    ['Good health', 'May you enjoy good health, strength, restful moments, and the energy to experience life and pursue the things that matter to you.'],
    ['True friendships', 'May you find friends who are sincere, supportive, kind, and happy to see you grow. May your friendships bring encouragement and good memories.'],
    ['Confidence', 'May you recognise your strengths, trust the work you put in, and feel confident enough to try even when something is new.'],
    ['Peace of mind', 'May you find calm when life feels busy, patience when things take time, and reassurance that you can handle one step at a time.'],
    ['Plenty of surprises', 'May thoughtful gifts, fun celebrations, and unexpected good news find their way to you throughout the year.'],
    ['Good food', 'May there always be something delicious to enjoy, a table to share, and good company to make the moment even better.'],
    ['Big opportunities', 'May you meet opportunities that help you learn, discover your abilities, and move closer to the future you imagine.'],
    ['Courage to begin', 'May you have the courage to start, the patience to keep practising, and the strength to begin again whenever you need to.'],
    ['Wonderful memories', 'May you collect stories from family time, celebrations, new places, and ordinary days that turn out to be special.'],
    ['Wisdom', 'May you grow in wisdom, make thoughtful decisions, and learn from every experience without being discouraged by mistakes.'],
    ['Answered prayers', 'May the prayers you hold close receive beautiful answers, and may you find hope and strength while you wait.'],
    ['Kindness around you', 'May you be surrounded by people who treat you with respect, speak honestly, and encourage you to be your best.'],
    ['Room to grow', 'May you give yourself permission to learn at your own pace. Progress matters more than having every answer immediately.'],
    ['A generous heart', 'May success bring you not only comfort and opportunity, but also the joy of helping others and making a positive difference.'],
    ['New experiences', 'May you explore new places, learn interesting things, try new activities, and discover more of what makes you happy.'],
    ['Strength on hard days', 'When a day does not go as planned, may you find support, perspective, and the strength to keep moving forward.'],
    ['Reasons to celebrate', 'May there be many moments worth celebrating: good results, new achievements, family milestones, and little wins along the way.'],
    ['A bright future', 'May the future bring purpose, meaningful work, good people, financial stability, and opportunities that fit your gifts and values.'],
    ['Always remember', 'You are still becoming. Keep your faith, keep your dreams, enjoy the journey, and come back to this wish whenever you need a reminder to keep going.']
  ],
  gifts: [
    ['A little abundance', 'May your hard work and good opportunities bring you more than enough to meet your needs, enjoy life, and support the people you love.'],
    ['A beautiful chapter', 'May this chapter be full of new lessons, meaningful friendships, answered prayers, and experiences that help you grow.'],
    ['A grand celebration', 'May you have plenty of reasons to celebrate, thoughtful gifts to unwrap, and happy memories that stay with you long after today.']
  ]
};

app.get('/api/status', (req, res) => res.json({ unlocked: hasValidSession(req) }));
app.post('/api/login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length > 200 || !safeEqual(password, APP_PASSWORD)) {
    return res.status(401).json({ error: 'That password does not match. Please try again.' });
  }
  setSessionCookie(res);
  return res.json({ ok: true });
});
app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'strict', path: '/' });
  return res.json({ ok: true });
});
app.get('/api/birthday-content', requireUnlock, (req, res) => res.json(birthdayContent));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory, {
  etag: true,
  dotfiles: 'deny',
  maxAge: IS_PRODUCTION ? '1h' : 0,
  setHeaders(res, filePath) {
    if (path.basename(filePath) === 'sw.js') res.setHeader('Cache-Control', 'no-cache');
  }
}));
app.get('*', (req, res) => res.sendFile(path.join(publicDirectory, 'index.html')));
app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => console.log(`Alabi Joy’s Sweet Sixteen is listening on port ${PORT}`));
