# Team Haim — מערכת ניהול אימונים 🏃‍♂️🏆

מערכת אישית לכל ספורטאי בקבוצה. קובץ HTML יחיד שמתחבר ל-Google Sheet אישי דרך Google Apps Script.

## מבנה
- `index.html` — האפליקציה (קובץ אחד, כל 7 הדפים)
- `apps-script/Code.gs` — הבק־אנד ב-Apps Script
- `apps-script/appsscript.json` — manifest
- `logo_blue.png`, `logo_white.png` — לוגואים

## פריסה לכל ספורטאי חדש (5 דק׳)

### שלב 1 — שכפל את ה-Google Sheet
1. צור גיליון Google Sheets חדש בשם `TeamHaim_<שם הספורטאי>`.
2. **Extensions → Apps Script** → מחק את כל הקוד הקיים → הדבק את התוכן של `apps-script/Code.gs`.
3. **Project Settings → Show "appsscript.json"** → הדבק את התוכן של `apps-script/appsscript.json`.
4. שמור (Ctrl+S).

### שלב 2 — Deploy
1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. **Deploy** → תן הרשאות.
6. העתק את ה-Web App URL (משהו כמו `https://script.google.com/macros/s/AKfy.../exec`).

### שלב 3 — צור קובץ HTML אישי
1. שכפל את `index.html` לקובץ חדש (לדוגמה `yossi.html`).
2. ערוך בתחילת תגית `<script>`:
   ```javascript
   const APPS_SCRIPT_URL = "כאן ה-URL שהעתקת מ-Apps Script";
   const ATHLETE_NAME    = "יוסי כהן";
   ```
3. שלח לספורטאי את הקובץ + שני הלוגואים (`logo_blue.png`, `logo_white.png`) באותה תיקייה.
   *(או העלה לאחסון סטטי: GitHub Pages / Netlify / Vercel — והעבר לו לינק.)*

## עיצוב
- רקע: `#0D0D0D`  • זהב: `#C9A84C` • כתב: Heebo
- RTL מלא, עברית

## Stack
- Frontend: HTML/CSS/JS גולמי + Chart.js
- Backend: Google Apps Script + Google Sheets

© Team Haim