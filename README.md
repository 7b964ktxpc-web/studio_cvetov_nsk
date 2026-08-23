# Студия Цветов — Новосибирск

Чистый production-репозиторий сайта цветочного магазина «Студия Цветов».

## Stack

- React + TypeScript
- Vite
- Supabase Auth / Postgres / Storage
- CSS без привязки к старому HealthAI-проекту

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

Переменные окружения:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## CMS

Админка: `/admin`

Вход: `/admin/login`

Управление:

- товары и цены;
- категории;
- фотографии через Supabase Storage;
- отзывы;
- заказы и их статусы;
- контакты и настройки магазина;
- SEO.

## Данные магазина

Студия Цветов

улица Невельского, 3Ак4, Новосибирск

+7 (952) 916-52-15

+7 (993) 028-49-94

Ежедневно 09:00–21:30

Координаты: 54.993045, 82.833637

Доставка: Яндекс Доставка

<!-- Vercel production redeploy trigger -->
