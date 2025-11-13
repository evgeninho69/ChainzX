# 🚀 ПЛАН РЕАЛИЗАЦИИ MVP CHAINZ

## 📋 EXECUTIVE SUMMARY

**Цель**: Запустить рабочий Telegram бот за **14 дней**  
**Бюджет**: $3,000-5,000 (или $500 если DIY)  
**Команда**: 1-2 разработчика + дизайнер (опционально)  
**Результат**: Готовая игра для тестирования на первых 500 пользователях

---

## 📅 TIMELINE: 14 дней

```
┌─────────────────────────────────────────────┐
│ WEEK 1: Development                         │
│  Day 1-2:  Setup & Core Bot                 │
│  Day 3-4:  Referral System                  │
│  Day 5-6:  Leaderboards & Teams             │
│  Day 7:    Testing & Bug fixes              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ WEEK 2: Polish & Launch                     │
│  Day 8-9:  Characters & Rewards             │
│  Day 10-11: Multi-language                  │
│  Day 12-13: Admin Panel                     │
│  Day 14:    Soft Launch (first 50 users)    │
└─────────────────────────────────────────────┘
```

---

## 🔧 TECH STACK (рекомендация)

### **Backend**
```
Language:    Node.js (TypeScript)
Framework:   Telegraf.js (Telegram Bot)
Database:    PostgreSQL
Cache:       Redis (optional для лидербордов)
Hosting:     Railway.app / Render.com / DigitalOcean
```

**Почему этот стек:**
- ✅ Node.js — быстрый старт, огромное комьюнити
- ✅ Telegraf — лучшая библиотека для Telegram ботов
- ✅ PostgreSQL — надёжная реляционная БД
- ✅ Railway/Render — автодеплой, бесплатный tier

### **Альтернатива (если Python лучше знаком)**
```
Language:    Python 3.10+
Framework:   python-telegram-bot
Database:    PostgreSQL
ORM:         SQLAlchemy
Hosting:     Railway / PythonAnywhere
```

---

## 📦 WEEK 1: DEVELOPMENT

### **DAY 1-2: Project Setup & Core Bot**

#### Задачи:
```
□ Создать Telegram бота через @BotFather
□ Получить API Token
□ Setup Git repository
□ Инициализировать проект (npm init / pip install)
□ Настроить окружение (env variables)
□ Подключить базу данных
□ Создать базовые команды: /start, /help
□ Deploy на хостинг (Railway/Render)
```

#### Deliverables:
- ✅ Бот отвечает на /start
- ✅ Создаётся запись пользователя в БД
- ✅ Бот работает 24/7 на сервере

#### База данных (таблицы v1):
```sql
-- Пользователи
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'en',
  referrer_id BIGINT REFERENCES users(telegram_id),
  links_balance INT DEFAULT 100,
  crowns_balance INT DEFAULT 0,
  character_id INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_referrer ON users(referrer_id);
CREATE INDEX idx_links ON users(links_balance DESC);
```

#### Код (псевдо):
```javascript
// bot.js
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  const referrerId = ctx.startPayload; // реф. код
  
  // Проверить, есть ли пользователь
  let user = await db.getUser(telegramId);
  
  if (!user) {
    // Создать нового пользователя
    user = await db.createUser({
      telegram_id: telegramId,
      username: ctx.from.username,
      first_name: ctx.from.first_name,
      referrer_id: referrerId,
      links_balance: 100
    });
    
    // Начислить реферу бонус
    if (referrerId) {
      await db.addLinks(referrerId, 1000);
      // Уведомить рефера
      await bot.telegram.sendMessage(
        referrerId, 
        `🎉 Твой друг @${ctx.from.username} присоединился! +1,000 LINKS`
      );
    }
  }
  
  await ctx.reply('👋 Добро пожаловать в CHAINZ!', mainMenu);
});

bot.launch();
```

---

### **DAY 3-4: Referral System**

#### Задачи:
```
□ Генерация уникальной реф. ссылки для каждого юзера
□ Отслеживание L1 (прямые рефералы)
□ Отслеживание L2 (рефералы рефералов)
□ Автоматическое начисление LINKS
□ Команда /invite (показать ссылку)
□ Команда /team (показать цепочку)
□ Уведомления при новом реферале
```

#### База данных (добавить таблицу):
```sql
-- Реферальная система
CREATE TABLE referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT NOT NULL REFERENCES users(telegram_id),
  referred_id BIGINT NOT NULL REFERENCES users(telegram_id),
  level INT NOT NULL, -- 1 или 2
  links_earned INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX idx_referrer_id ON referrals(referrer_id);
```

#### Логика начисления:
```javascript
// referral.js
async function processReferral(newUserId, referrerId) {
  if (!referrerId) return;
  
  // L1: Прямой реферал
  await db.addLinks(referrerId, 1000);
  await db.createReferral(referrerId, newUserId, 1, 1000);
  
  // L2: Найти рефера рефера
  const referrerData = await db.getUser(referrerId);
  if (referrerData.referrer_id) {
    const grandReferrerId = referrerData.referrer_id;
    await db.addLinks(grandReferrerId, 100);
    await db.createReferral(grandReferrerId, newUserId, 2, 100);
    
    // Уведомить L2
    await bot.telegram.sendMessage(
      grandReferrerId,
      `🔥 @${referrerData.username} пригласил друга! +100 LINKS тебе`
    );
  }
}
```

#### Команды:
```javascript
// /invite
bot.command('invite', async (ctx) => {
  const userId = ctx.from.id;
  const inviteLink = `https://t.me/${process.env.BOT_USERNAME}?start=${userId}`;
  
  await ctx.reply(
    `🚀 ПРИГЛАСИ ДРУЗЕЙ!\n\n` +
    `Твоя ссылка:\n${inviteLink}\n\n` +
    `💎 За каждого друга:\n` +
    `• Друг присоединился = +1,000 LINKS\n` +
    `• Друг пригласил кого-то = +100 LINKS тебе!`,
    { reply_markup: shareKeyboard }
  );
});

// /team
bot.command('team', async (ctx) => {
  const userId = ctx.from.id;
  const team = await db.getReferralTree(userId);
  
  let message = `🔗 ТВОЯ ЦЕПЬ\n\n`;
  message += `📈 Level 1 (${team.level1.length} друзей):\n`;
  team.level1.forEach(ref => {
    message += `├─ @${ref.username} — ${ref.links} LINKS\n`;
  });
  
  message += `\n📈 Level 2 (${team.level2.length} человек)\n`;
  message += `\n💰 Твой доход:\n`;
  message += `• От L1: ${team.level1Earnings} LINKS\n`;
  message += `• От L2: ${team.level2Earnings} LINKS\n`;
  
  await ctx.reply(message);
});
```

#### Deliverables:
- ✅ Реф. ссылка работает
- ✅ LINKS начисляются автоматически (L1 + L2)
- ✅ Уведомления приходят реферам
- ✅ Команда /team показывает цепочку

---

### **DAY 5-6: Leaderboards & Teams**

#### Задачи:
```
□ Глобальный лидерборд (топ-100)
□ Команды (создать/вступить/покинуть)
□ Командный лидерборд
□ Команды: /leaderboard, /guilds
□ Pagination для больших списков
□ Real-time обновление позиций
```

#### База данных:
```sql
-- Команды
CREATE TABLE guilds (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  creator_id BIGINT NOT NULL REFERENCES users(telegram_id),
  description TEXT,
  total_links BIGINT DEFAULT 0,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Членство в командах
CREATE TABLE guild_members (
  guild_id BIGINT REFERENCES guilds(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(telegram_id),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id)
);

-- Добавить к users
ALTER TABLE users ADD COLUMN guild_id BIGINT REFERENCES guilds(id);
```

#### Лидерборд:
```javascript
// /leaderboard
bot.command('leaderboard', async (ctx) => {
  const topUsers = await db.query(`
    SELECT 
      username, 
      links_balance,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = users.telegram_id AND level = 1) as referral_count
    FROM users 
    ORDER BY links_balance DESC 
    LIMIT 100
  `);
  
  let message = `🌍 ТОП ИГРОКОВ\n\n`;
  topUsers.forEach((user, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
    message += `${medal} @${user.username} — ${user.links_balance.toLocaleString()} LINKS (${user.referral_count} друзей)\n`;
  });
  
  // Показать позицию текущего юзера
  const userRank = await db.getUserRank(ctx.from.id);
  message += `\n#${userRank} ТЫ — ${ctx.session.user.links_balance} LINKS\n`;
  
  await ctx.reply(message);
});
```

#### Команды (гильдии):
```javascript
// /guilds
bot.command('guilds', async (ctx) => {
  const topGuilds = await db.getTopGuilds(10);
  const userGuild = await db.getUserGuild(ctx.from.id);
  
  let message = `🏆 ТОП КОМАНД\n\n`;
  topGuilds.forEach((guild, idx) => {
    const medal = idx < 3 ? ['🥇','🥈','🥉'][idx] : `#${idx + 1}`;
    message += `${medal} ${guild.name} — ${guild.total_links.toLocaleString()} LINKS (${guild.member_count} игроков)\n`;
  });
  
  if (userGuild) {
    message += `\n📌 Твоя команда: ${userGuild.name}\n`;
  } else {
    message += `\n💡 У тебя пока нет команды!\n`;
  }
  
  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Создать команду', callback_data: 'create_guild' }],
        [{ text: '🔍 Все команды', callback_data: 'browse_guilds' }]
      ]
    }
  });
});

// Callback: Создать команду
bot.action('create_guild', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.session.awaitingGuildName = true;
  await ctx.reply('Введи название команды (макс. 30 символов):');
});

// Обработка текста (название команды)
bot.on('text', async (ctx) => {
  if (ctx.session.awaitingGuildName) {
    const guildName = ctx.message.text.trim();
    
    if (guildName.length > 30) {
      return ctx.reply('❌ Слишком длинное название! Максимум 30 символов.');
    }
    
    // Создать команду
    const guild = await db.createGuild({
      name: guildName,
      creator_id: ctx.from.id
    });
    
    // Добавить юзера в команду
    await db.joinGuild(ctx.from.id, guild.id);
    
    ctx.session.awaitingGuildName = false;
    await ctx.reply(`✅ Команда "${guildName}" создана! Приглашай друзей!`);
  }
});
```

#### Deliverables:
- ✅ Лидерборд работает (топ-100)
- ✅ Можно создать команду
- ✅ Можно вступить в команду
- ✅ Командный лидерборд показывает топ
- ✅ Очки команды = сумма очков участников

---

### **DAY 7: Testing & Bug Fixes**

#### Задачи:
```
□ Протестировать все команды
□ Проверить реферальную логику (L1 + L2)
□ Тест на race conditions (2 юзера регистрируются одновременно)
□ Проверить начисление LINKS
□ Тест создания команд
□ Найти и исправить баги
□ Добавить error handling
□ Логирование (Winston/Bunyan)
```

#### Тест-кейсы:
```
✓ User A приглашает User B → B получает 100 LINKS, A получает 1000
✓ User B приглашает User C → C получает 100, B получает 1000, A получает 100
✓ Дубликат регистрации (тот же telegram_id) → ошибка или игнорируется
✓ Реф. ссылка на себя → блокируется
✓ Создание команды с одинаковым названием → ошибка
✓ Вступление в 2 команды одновременно → последняя побеждает
✓ Лидерборд с 0 пользователями → пустое сообщение
✓ Лидерборд с 1M пользователей → pagination работает
```

#### Error Handling:
```javascript
// Обёртка для всех команд
bot.catch((err, ctx) => {
  console.error('Error:', err);
  ctx.reply('⚠️ Произошла ошибка. Попробуй позже.');
  
  // Логировать в Sentry/LogRocket
  Sentry.captureException(err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

---

## 📦 WEEK 2: POLISH & LAUNCH

### **DAY 8-9: Characters & Rewards**

#### Задачи:
```
□ 4 стартовых персонажа (изображения)
□ Выбор персонажа при регистрации
□ Команда /characters (мои персонажи)
□ Команда /shop (купить персонажа)
□ Gacha механика (открытие сундука)
□ Еженедельные награды (mock данные)
□ Команда /rewards (мои награды)
```

#### Персонажи:
```javascript
// characters.js
const CHARACTERS = [
  { id: 1, name: 'Forest Fox', rarity: 'common', bonus: 5, cost: 0 },
  { id: 2, name: 'Cloud Dreamer', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 3, name: 'Neon Knight', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 4, name: 'Spark Bot', rarity: 'common', bonus: 5, cost: 10000 },
  { id: 5, name: 'Cyber Dragon', rarity: 'rare', bonus: 10, cost: 50000 },
  // ... остальные
];

// Выбор персонажа при старте
bot.start(async (ctx) => {
  // ... создание юзера ...
  
  if (!user.character_id) {
    await ctx.reply(
      '🎁 Выбери стартового персонажа:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🦊 Forest Fox', callback_data: 'char_1' }],
            [{ text: '☁️ Cloud Dreamer', callback_data: 'char_2' }],
            [{ text: '⚔️ Neon Knight', callback_data: 'char_3' }],
            [{ text: '🤖 Spark Bot', callback_data: 'char_4' }]
          ]
        }
      }
    );
  }
});

// Callback: выбор персонажа
bot.action(/char_(\d+)/, async (ctx) => {
  const charId = parseInt(ctx.match[1]);
  await db.setCharacter(ctx.from.id, charId);
  
  const char = CHARACTERS.find(c => c.id === charId);
  await ctx.editMessageText(
    `✅ Ты выбрал ${char.name}!\n\n` +
    `Бонус: +${char.bonus}% LINKS от рефералов\n\n` +
    `Теперь начни приглашать друзей! 🚀`
  );
  
  await ctx.reply('Главное меню:', mainMenuKeyboard);
});
```

#### Gacha (открытие сундука):
```javascript
// /shop
bot.command('shop', async (ctx) => {
  await ctx.reply(
    `🎁 МАГАЗИН\n\n` +
    `💰 Твой баланс: ${ctx.session.user.links_balance} LINKS\n\n` +
    `Открыть сундук: 10,000 LINKS\n` +
    `Шанс получить:\n` +
    `• Common: 70%\n` +
    `• Rare: 20%\n` +
    `• Epic: 8%\n` +
    `• Legendary: 2%`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎁 Открыть сундук (10,000 LINKS)', callback_data: 'open_chest' }]
        ]
      }
    }
  );
});

bot.action('open_chest', async (ctx) => {
  const userId = ctx.from.id;
  const user = await db.getUser(userId);
  
  if (user.links_balance < 10000) {
    return ctx.answerCbQuery('❌ Недостаточно LINKS!', { show_alert: true });
  }
  
  // Снять LINKS
  await db.addLinks(userId, -10000);
  
  // Gacha roll
  const roll = Math.random() * 100;
  let rarity, character;
  
  if (roll < 70) {
    rarity = 'common';
    character = CHARACTERS.filter(c => c.rarity === 'common')[Math.floor(Math.random() * 4)];
  } else if (roll < 90) {
    rarity = 'rare';
    character = CHARACTERS.filter(c => c.rarity === 'rare')[Math.floor(Math.random() * 4)];
  } else if (roll < 98) {
    rarity = 'epic';
    character = CHARACTERS.filter(c => c.rarity === 'epic')[Math.floor(Math.random() * 2)];
  } else {
    rarity = 'legendary';
    character = CHARACTERS.filter(c => c.rarity === 'legendary')[Math.floor(Math.random() * 2)];
  }
  
  // Сохранить персонажа
  await db.addCharacterToCollection(userId, character.id);
  
  await ctx.editMessageText(
    `✨ ТЫ ПОЛУЧИЛ:\n\n` +
    `${character.name}\n` +
    `Редкость: ${rarity.toUpperCase()}\n` +
    `Бонус: +${character.bonus}% LINKS\n\n` +
    `Поздравляем! 🎉`
  );
});
```

#### Deliverables:
- ✅ 4 персонажа на старте
- ✅ Gacha система работает
- ✅ Можно купить сундук
- ✅ Персонажи сохраняются в коллекцию

---

### **DAY 10-11: Multi-language**

#### Задачи:
```
□ Система переводов (i18n)
□ 5 языков: EN, RU, ES, PT, HI
□ Команда /language (сменить язык)
□ Автоопределение языка при /start
□ Перевести все сообщения
□ Тестирование на всех языках
```

#### Структура:
```javascript
// locales/en.json
{
  "welcome": "👋 Welcome to CHAINZ!",
  "choose_character": "🎁 Choose your starter character:",
  "balance": "💰 Balance: {links} LINKS",
  "invite_text": "🚀 INVITE FRIENDS!\n\nYour link:\n{link}\n\n💎 For each friend:\n• Friend joins = +1,000 LINKS\n• Friend invites someone = +100 LINKS to you!",
  "leaderboard_title": "🌍 TOP PLAYERS",
  // ... все фразы ...
}

// locales/ru.json
{
  "welcome": "👋 Добро пожаловать в CHAINZ!",
  "choose_character": "🎁 Выбери стартового персонажа:",
  "balance": "💰 Баланс: {links} LINKS",
  // ...
}
```

#### Использование:
```javascript
const i18n = require('i18n');

i18n.configure({
  locales: ['en', 'ru', 'es', 'pt', 'hi'],
  directory: __dirname + '/locales',
  defaultLocale: 'en'
});

// Middleware
bot.use(async (ctx, next) => {
  const user = await db.getUser(ctx.from.id);
  ctx.i18n = {
    locale: user?.language_code || ctx.from.language_code || 'en',
    t: (key, params) => i18n.__({ phrase: key, locale: ctx.i18n.locale }, params)
  };
  await next();
});

// В командах
bot.start(async (ctx) => {
  await ctx.reply(ctx.i18n.t('welcome'));
});

// /language
bot.command('language', async (ctx) => {
  await ctx.reply(
    ctx.i18n.t('choose_language'),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
          [{ text: '🇪🇸 Español', callback_data: 'lang_es' }],
          [{ text: '🇵🇹 Português', callback_data: 'lang_pt' }],
          [{ text: '🇮🇳 हिन्दी', callback_data: 'lang_hi' }]
        ]
      }
    }
  );
});

bot.action(/lang_(\w+)/, async (ctx) => {
  const lang = ctx.match[1];
  await db.setLanguage(ctx.from.id, lang);
  await ctx.answerCbQuery('✅ Language changed!');
  await ctx.editMessageText(i18n.__({ phrase: 'language_changed', locale: lang }));
});
```

#### Deliverables:
- ✅ 5 языков поддерживаются
- ✅ Можно переключить язык
- ✅ Все сообщения переведены

---

### **DAY 12-13: Admin Panel**

#### Задачи:
```
□ Простая админка (web UI)
□ Статистика: пользователи, рефералы, команды
□ Графики роста
□ Возможность начислить LINKS/CROWNS вручную
□ Просмотр логов
□ Ban/Unban пользователей
□ Отправка broadcast сообщений
```

#### Tech Stack:
```
Frontend: React (или простой HTML + Chart.js)
Backend:  Express.js API
Auth:     Basic auth (логин/пароль админа)
```

#### API Endpoints:
```javascript
// admin-api.js
const express = require('express');
const router = express.Router();

// Middleware: проверка авторизации
router.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth === `Basic ${Buffer.from(process.env.ADMIN_PASSWORD).toString('base64')}`) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// GET /api/stats
router.get('/stats', async (req, res) => {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
      SUM(links_balance) as total_links,
      (SELECT COUNT(*) FROM guilds) as total_guilds
    FROM users
  `);
  
  res.json(stats.rows[0]);
});

// GET /api/users?page=1&limit=50
router.get('/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  
  const users = await db.query(`
    SELECT 
      telegram_id, username, first_name, 
      links_balance, crowns_balance,
      created_at,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = users.telegram_id AND level = 1) as referral_count
    FROM users 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  res.json(users.rows);
});

// POST /api/users/:telegram_id/add-balance
router.post('/users/:telegram_id/add-balance', async (req, res) => {
  const { telegram_id } = req.params;
  const { links, crowns, reason } = req.body;
  
  if (links) await db.addLinks(telegram_id, links);
  if (crowns) await db.addCrowns(telegram_id, crowns);
  
  // Логирование
  await db.logAdminAction({
    action: 'add_balance',
    target_user: telegram_id,
    data: { links, crowns, reason }
  });
  
  res.json({ success: true });
});

// POST /api/broadcast
router.post('/broadcast', async (req, res) => {
  const { message, target_users } = req.body;
  
  const users = target_users === 'all' 
    ? await db.getAllUsers() 
    : target_users;
  
  // Отправить сообщения (с rate limiting)
  for (const userId of users) {
    await bot.telegram.sendMessage(userId, message);
    await sleep(50); // 20 сообщений/сек (Telegram limit)
  }
  
  res.json({ success: true, sent: users.length });
});

module.exports = router;
```

#### Frontend (простой):
```html
<!-- admin/index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>CHAINZ Admin</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>CHAINZ Admin Panel</h1>
  
  <div id="stats">
    <h2>Statistics</h2>
    <p>Total Users: <span id="total-users">-</span></p>
    <p>New Users (24h): <span id="new-users-24h">-</span></p>
    <p>New Users (7d): <span id="new-users-7d">-</span></p>
    <p>Total LINKS: <span id="total-links">-</span></p>
  </div>
  
  <canvas id="growthChart" width="400" height="200"></canvas>
  
  <script>
    fetch('/api/stats', {
      headers: { 'Authorization': 'Basic ' + btoa('admin:' + prompt('Password:')) }
    })
    .then(r => r.json())
    .then(data => {
      document.getElementById('total-users').textContent = data.total_users;
      document.getElementById('new-users-24h').textContent = data.new_users_24h;
      document.getElementById('new-users-7d').textContent = data.new_users_7d;
      document.getElementById('total-links').textContent = data.total_links.toLocaleString();
    });
    
    // График роста (mock)
    const ctx = document.getElementById('growthChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        datasets: [{
          label: 'New Users',
          data: [12, 19, 27, 45, 78, 124, 189],
          borderColor: 'rgb(75, 192, 192)'
        }]
      }
    });
  </script>
</body>
</html>
```

#### Deliverables:
- ✅ Админка доступна по `/admin`
- ✅ Видна статистика пользователей
- ✅ Можно начислить баланс вручную
- ✅ Можно отправить broadcast

---

### **DAY 14: Soft Launch**

#### Задачи:
```
□ Final testing
□ Deploy на production
□ Настроить monitoring (UptimeRobot/Pingdom)
□ Создать backup БД
□ Пригласить первых 50 тестеров
□ Собрать feedback
□ Hotfixes если нужно
```

#### Pre-launch Checklist:
```
✓ Бот отвечает на все команды
✓ Рефералы работают (проверено на 5+ юзерах)
✓ Лидерборд обновляется
✓ Команды создаются/вступают
✓ Персонажи выбираются
✓ Gacha работает
✓ 5 языков поддерживаются
✓ Админка доступна
✓ Database backup настроен (daily)
✓ Error logging (Sentry)
✓ Monitoring (UptimeRobot)
✓ Rate limiting (anti-spam)
✓ Environment variables secured
```

#### Soft Launch Strategy:
1. **Пригласить 10 близких друзей** → попросить feedback
2. **Пригласить 20 человек из crypto Telegram групп** → наблюдать за поведением
3. **Пригласить 20 человек из creator communities** → проверить целевую аудиторию
4. **Собрать feedback** → форма Google Forms или прямо в боте
5. **Фиксить критичные баги** → hotfix deploy в тот же день
6. **Наблюдать метрики** (K-factor, retention D1, confusion rate)

#### Metrics Day 1-3:
```
□ Registrations: ___ / 50 (goal)
□ K-factor: ___ (goal: >1.0)
□ Onboarding completion: ___ % (goal: >80%)
□ First referral sent: ___ % (goal: >60%)
□ D1 retention: ___ % (goal: >40%)
□ Bugs found: ___ (fix all P0 immediately)
□ User feedback: ___ positive / ___ negative
```

---

## 💰 BUDGET BREAKDOWN

### **Вариант 1: Hire Developer**

| Item | Cost | Notes |
|------|------|-------|
| **Developer** | $2,000-3,000 | Freelancer (Upwork/Fiverr), 2 weeks full-time |
| **Designer** | $300-500 | 4 персонажа + иконки (optional) |
| **Hosting** | $15/month | Railway/Render Pro plan |
| **Database** | $10/month | Managed PostgreSQL |
| **Domain** | $10/year | chainz.app или similar |
| **Monitoring** | Free | UptimeRobot free tier |
| **Error tracking** | Free | Sentry free tier (5K events/month) |
| **Buffer** | $500 | Unexpected costs |
| **TOTAL** | **$3,000-5,000** | |

### **Вариант 2: DIY (Do It Yourself)**

| Item | Cost | Notes |
|------|------|-------|
| **Your time** | $0 | 2 weeks evenings/weekends |
| **Hosting** | $0-5/month | Railway free tier (enough for MVP) |
| **Database** | $0 | Railway included PostgreSQL |
| **Domain** | $10/year | |
| **AI персонажи** | $0-50 | MidJourney ($10/month) or free (DALL-E) |
| **TOTAL** | **$100-500** | |

**Рекомендация**: Start DIY если умеешь кодить. Hire developer если нужна скорость и нет времени.

---

## 📊 SUCCESS METRICS (Week 1-2)

### **Week 1 (50 users)**
```
✓ K-factor: >1.0 (каждый приводит 1+ друга)
✓ Onboarding completion: >80%
✓ First invite sent: >60%
✓ D1 retention: >40%
✓ No critical bugs
```

### **Week 2 (100-200 users)**
```
✓ K-factor: >1.5 (organic growth)
✓ D7 retention: >30%
✓ Guild creation rate: >20%
✓ Positive feedback: >70%
✓ Referral chain depth: >2 levels (L1→L2→L3)
```

---

## 🚨 RISK MITIGATION

### **Technical Risks**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Telegram API rate limits** | High | Medium | Implement queue, respect limits (20 msg/sec) |
| **Database crash** | Critical | Low | Daily backups, managed service (Railway/Render) |
| **Bot downtime** | High | Medium | Health checks, auto-restart, monitoring |
| **Race conditions (referrals)** | Medium | High | Database transactions, unique constraints |
| **Memory leak** | Medium | Low | Proper session management, restart daily |

### **Product Risks**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Low K-factor (<1.0)** | Critical | Medium | Increase rewards, improve messaging |
| **High churn (D1 <30%)** | High | Medium | Better onboarding, daily quests |
| **Fraud/bots** | High | High | Phone verification (optional), velocity limits |
| **Users don't understand** | High | Low | Clear tutorial, tooltips, /help |
| **No viral growth** | Critical | Medium | Referral competitions, leaderboard push notifications |

---

## ✅ DEFINITION OF DONE (MVP Ready)

MVP готов к public launch когда:

```
✅ Technical
  ├─ All commands работают (tested)
  ├─ Database stable (no errors 24h)
  ├─ Bot uptime >99% (monitoring green)
  ├─ Admin panel functional
  └─ Error logging configured

✅ Product
  ├─ Onboarding <2 minutes
  ├─ Referral system works (tested with 10+ users)
  ├─ Leaderboards real-time
  ├─ Teams create/join works
  └─ Characters select/buy works

✅ Metrics (Week 1-2 soft launch)
  ├─ K-factor >1.0
  ├─ D1 retention >40%
  ├─ No critical bugs
  ├─ Positive feedback >70%
  └─ 50+ active users

✅ Documentation
  ├─ README (how to run)
  ├─ API docs (for admin)
  ├─ Runbook (common issues)
  └─ User guide (/help command)
```

---

## 🎯 NEXT STEPS AFTER MVP

### **If MVP succeeds (K-factor >1.5)**

**Week 3-4: Scale to 1,000 users**
- Product Hunt launch
- Reddit posts
- Influencer outreach
- First referral competition

**Week 5-8: Add Week 2 challenge**
- YouTube Shorts challenge
- Manual moderation (admin checks videos)
- CROWNS distribution to winners
- Collect feedback

**Week 9-12: Scale to 10K users**
- Partnerships
- Paid ads (optional)
- Community managers
- Week 3-4 challenges

### **If MVP struggles (K-factor <1.0)**

**Pivot options:**
1. **Increase rewards** (2,000 LINKS per referral instead of 1,000)
2. **Simplify** (remove teams, focus on referrals only)
3. **Add utility** (LINKS can buy something immediately)
4. **Change platform** (web app instead of Telegram)
5. **Target different audience** (crypto degens vs creators)

---

## 💬 ГОТОВ НАЧАТЬ?

**Следующие шаги:**

1. **📝 Нужен технический spec?**
   - Database schema (full SQL)
   - API endpoints (REST)
   - Bot commands (full flow)
   - File structure (project organization)

2. **👨‍💻 Нужна помощь с кодом?**
   - Starter template (Node.js + Telegraf)
   - Key functions (referral logic, leaderboard)
   - Deployment guide (Railway step-by-step)

3. **🎨 Нужен дизайн?**
   - Персонажи (brief для MidJourney)
   - UI/UX flow (mockups)
   - Brand guidelines

4. **💼 Нужен pitch deck?**
   - Для поиска co-founder
   - Для seed инвестиций

**Скажи что нужно — детализирую!** 🚀