# Быстрый старт для Beget

## Шаги деплоя

### 1. Подготовка проекта локально

```bash
# Установите зависимости
npm install

# Соберите проект
npm run build

# Проверьте, что папка dist/ создана
ls -la dist/
```

### 2. Загрузка на Beget

**Вариант A: Через Git (рекомендуется)**
```bash
# На сервере Beget
cd ~/
git clone your-repository-url chainz
cd chainz
```

**Вариант B: Через FTP/SFTP**
- Загрузите все файлы проекта, кроме:
  - `node_modules/` (будет установлен на сервере)
  - `.env` (создадите на сервере)
  - `dist/` (будет создан при сборке)

### 3. Настройка на сервере

```bash
# Установите зависимости
npm install --production

# Соберите проект
npm run build

# Создайте .env файл
cp .env.example .env
nano .env
```

**Заполните .env:**
```env
BOT_TOKEN=ваш_токен_бота
DATABASE_URL=postgresql://username:password@localhost:5432/chainz
ADMIN_PASSWORD=ваш_безопасный_пароль
NODE_ENV=production
PORT=3000
```

### 4. Настройка базы данных

1. В панели Beget создайте PostgreSQL базу данных
2. Запишите данные подключения
3. Обновите `DATABASE_URL` в `.env`
4. Запустите миграции:
```bash
npm run migrate:prod
```

### 5. Настройка Node.js приложения в панели Beget

1. Войдите в панель управления Beget
2. Перейдите в "Node.js приложения"
3. Создайте новое приложение:
   - **Путь:** `/home/u/username/chainz` (замените username)
   - **Файл запуска:** `server.js`
   - **Порт:** `3000`
   - **Node.js версия:** `18.x` или `20.x`

4. Добавьте переменные окружения:
   - `BOT_TOKEN`
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
   - `PORT=3000`

5. Запустите приложение

### 6. Проверка

- **Бот:** Откройте Telegram, найдите бота, отправьте `/start`
- **Админ-панель:** `https://your-domain.com/admin`
- **API:** `https://your-domain.com/api/stats`

## Обновление

```bash
cd ~/chainz
git pull  # или загрузите новые файлы
npm install --production
npm run build
npm run migrate:prod  # если есть новые миграции
# Перезапустите приложение в панели Beget
```

## Проблемы?

1. Проверьте логи в панели Beget
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что база данных доступна
4. См. подробную инструкцию в `DEPLOY.md`

