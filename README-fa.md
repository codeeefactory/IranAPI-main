# IranAPI

IranAPI يک بازار API و پرتال توسعه‌دهنده است که با Django REST و React/Vite ساخته شده و از فارسي و RTL پشتيباني مي‌کند.

در اين نسخه، لايه داده به صورت کامل به MongoDB منتقل شده است و مسيرهاي فعال ديگر به ORM رابطه‌اي جنگو وابسته نيستند.

## اجراي محلي

ابتدا متغيرهاي محيطي را آماده کنيد:

```bash
cp .env.example .env
```

سپس MongoDB را اجرا کنيد و بعد:

```bash
python -m pip install -r requirements.txt
python manage.py runserver
```

آدرس API اصلي:

```text
http://localhost:8000/api/v1
```

## تنظيمات MongoDB

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=iranapi
MONGODB_USE_MOCK=false
```

حالت `MONGODB_USE_MOCK` فقط براي تست‌ها مناسب است.

## انتقال داده از SQLite/PostgreSQL

```bash
python manage.py import_legacy_sql --source-url sqlite:///db.sqlite3 --drop-target
```

يا:

```bash
LEGACY_DATABASE_URL=postgresql://user:pass@host:5432/dbname python manage.py import_legacy_sql --drop-target
```

## داکر

پروژه حالا دو مسير داکري دارد:

- `docker-compose.yml` براي اجراي شبيه محيط استقرار با Gunicorn و Nginx
- `docker-compose.dev.yml` براي توسعه با بارگذاري زنده

### استقرار با يک Dockerfile

بعضي سرويس‌هاي استقرار فقط فايل `Dockerfile` را در ريشه پروژه بررسي مي‌کنند. حالا يک `Dockerfile` در ريشه پروژه وجود دارد که فرانت‌اند را build مي‌کند، فايل‌هاي آن را داخل ايميج Django قرار مي‌دهد، استاتيک‌ها را با WhiteNoise سرو مي‌کند و کل برنامه را با يک کانتينر بالا مي‌آورد.

### اجرا با يک کليک در ويندوز

اگر فقط مي‌خواهيد پروژه را با يک کليک بالا بياوريد:

- روي `Run-IranAPI.bat` دوبار کليک کنيد تا نسخه شبيه استقرار build و اجرا شود
- روي `Run-IranAPI-Dev.bat` دوبار کليک کنيد تا نسخه توسعه‌اي با بارگذاري زنده اجرا شود
- روي `Stop-IranAPI.bat` دوبار کليک کنيد تا سرويس‌ها متوقف شوند

اين لانچرها در صورت نبودن، فايل `.env.docker` را مي‌سازند، کانتينرها را بالا مي‌آورند، منتظر پاسخ فرانت‌اند مي‌مانند و بعد سايت را در مرورگر باز مي‌کنند.

### اجراي شبيه محيط استقرار

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

اگر رابط Mongo Express را هم مي‌خواهيد:

```bash
docker compose --env-file .env.docker --profile tools up --build
```

آدرس‌ها:

- فرانت‌اند: `http://localhost:5173`
- بک‌اند: `http://localhost:8000/api/v1`
- مونگو: `mongodb://localhost:27017`
- رابط Mongo Express: `http://localhost:8081`

### اجراي توسعه‌اي با بارگذاري زنده

```bash
cp .env.docker.example .env.docker
docker compose -f docker-compose.dev.yml --env-file .env.docker up --build
```

در اين حالت:

- سورس فرانت‌اند و بک‌اند داخل کانتينر mount مي‌شود
- جنگو با `runserver` اجرا مي‌شود
- Vite با آدرس `http://localhost:5173` بالا مي‌آيد
- وابستگي‌هاي فرانت‌اند داخل volume جداگانه نگه‌داري مي‌شوند
- با `IRANAPI_AUTO_SEED_SAMPLE_DATA=true` مي‌توان داده نمونه ساخت

## تست و بررسي

```bash
MONGODB_USE_MOCK=true python manage.py check
python manage.py test
```

## نکات

- احراز هويت پرتال با session ذخيره‌شده در MongoDB انجام مي‌شود.
- مسيرهاي قديمي `/api/*` هنوز براي سازگاري فعال هستند اما deprecated شده‌اند.
- توليد کليد API محلي به صورت پيش‌فرض غيرفعال است.
- براي اعتبارسنجي نهايي داکر، بايد دستورات بالا روي سيستمي اجرا شوند که Docker روي آن نصب شده باشد.
