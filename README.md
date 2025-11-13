# CHAINZ MVP - Telegram Bot

Telegram бот для реферальной игры, где пользователи строят свою империю, приглашая друзей.

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- PostgreSQL 15+
- Telegram Bot Token (получить у @BotFather)

### Установка

1. Клонируйте репозиторий и установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

3. Заполните `.env` файл:

```
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://localhost:5432/chainz
ADMIN_PASSWORD=secure_admin_password
NODE_ENV=development
```

4. Создайте базу данных PostgreSQL:

```bash
createdb chainz
```

5. Запустите миграции:

```bash
npm run migrate
```

6. Запустите бота:

```bash
npm run dev
```

## 📁 Структура проекта

```
CHAINZ/
├── src/
│   ├── bot/              # Логика Telegram бота
│   │   ├── commands/     # Команды бота
│   │   ├── handlers/     # Обработчики callback'ов
│   │   ├── middleware/   # Middleware (session, i18n, logger)
│   │   └── index.ts      # Инициализация бота
│   ├── database/         # Работа с БД
│   │   ├── migrations/   # SQL миграции
│   │   └── connection.ts # Подключение к БД
│   ├── services/         # Бизнес-логика
│   │   ├── referral.service.ts
│   │   ├── leaderboard.service.ts
│   │   ├── guild.service.ts
│   │   ├── character.service.ts
│   │   └── user.service.ts
│   ├── locales/          # Переводы (5 языков)
│   ├── admin/            # Admin panel
│   ├── types/            # TypeScript типы
│   └── index.ts         # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🎮 Команды бота

- `/start` - Начать игру
- `/invite` - Получить реферальную ссылку
- `/balance` - Мой баланс
- `/team` - Моя цепочка рефералов
- `/leaderboard` - Топ игроков
- `/guilds` - Команды
- `/characters` - Мои персонажи
- `/shop` - Магазин
- `/rewards` - Еженедельные награды
- `/language` - Сменить язык
- `/help` - Помощь

## 🔧 Разработка

### Скрипты

- `npm run dev` - Запуск в режиме разработки (с автоперезагрузкой)
- `npm run build` - Сборка TypeScript
- `npm start` - Запуск собранного проекта
- `npm run migrate` - Запуск миграций БД

### База данных

Миграции находятся в `src/database/migrations/`:

1. `001_init.sql` - Пользователи и рефералы
2. `002_guilds.sql` - Команды (гильдии)
3. `003_characters.sql` - Персонажи

### Добавление нового языка

1. Создайте файл `src/locales/{code}.json`
2. Скопируйте структуру из `en.json`
3. Переведите все строки
4. Язык автоматически появится в `/language`

## 📊 Admin Panel

Admin панель доступна на `http://localhost:3001` (по умолчанию).

Для доступа используйте Basic Auth с паролем из `ADMIN_PASSWORD`.

### API Endpoints

- `GET /api/stats` - Статистика системы
- `GET /api/users?page=1&limit=50` - Список пользователей
- `POST /api/users/:telegram_id/add-balance` - Начислить баланс
- `POST /api/broadcast` - Отправить broadcast сообщение

## 🎯 Функционал MVP

### Реферальная система

- **Level 1**: Прямой реферал = +1,000 LINKS
- **Level 2**: Реферал реферала = +100 LINKS

### Лидерборды

- Глобальный топ-100 игроков
- Командный топ (гильдии)

### Персонажи

- 12 персонажей (4 common, 4 rare, 2 epic, 2 legendary)
- Gacha система (открытие сундуков за 10,000 LINKS)
- Бонусы к заработку LINKS

### Команды (Guilds)

- Создание команд
- Вступление в команды
- Командный лидерборд

### Мультиязычность

Поддержка 5 языков:
- 🇬🇧 English
- 🇷🇺 Русский
- 🇪🇸 Español
- 🇵🇹 Português
- 🇮🇳 हिन्दी

## 🐛 Troubleshooting

### Бот не отвечает

1. Проверьте `BOT_TOKEN` в `.env`
2. Убедитесь, что бот запущен (`npm run dev`)
3. Проверьте логи на ошибки

### Ошибки подключения к БД

1. Убедитесь, что PostgreSQL запущен
2. Проверьте `DATABASE_URL` в `.env`
3. Убедитесь, что база `chainz` создана

### Миграции не применяются

1. Проверьте права доступа к БД
2. Убедитесь, что база данных существует
3. Проверьте SQL синтаксис в миграциях

## 📝 Лицензия

ISC

## 🤝 Поддержка

При возникновении проблем создайте issue в репозитории.

