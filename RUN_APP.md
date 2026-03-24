# Как запустить приложение Juno

## Вариант 1: Если приложение уже установлено в симуляторе

1. Открой **Терминал** (Terminal.app)
2. Перейди в папку проекта:
   ```bash
   cd /Users/janisolksnis/Desktop/juno-app-ios-safe
   ```
3. Запусти Metro с очисткой кэша:
   ```bash
   npx expo start --clear
   ```
4. Когда Metro запустится, нажми **`i`** в терминале — откроется iOS симулятор
5. Или открой симулятор вручную (Spotlight → Simulator) и нажми на иконку Juno

---

## Вариант 2: Полный запуск (сборка + симулятор)

1. Закрой Xcode, если открыт
2. Открой **Терминал**
3. Выполни:
   ```bash
   cd /Users/janisolksnis/Desktop/juno-app-ios-safe
   npm run dev:ios
   ```
4. Подожди 3–5 минут — симулятор откроется автоматически

---

## Вариант 3: Если порт 8081 занят

```bash
cd /Users/janisolksnis/Desktop/juno-app-ios-safe
npx expo start --clear --port 8082
```

Затем нажми **`i`** для iOS.

---

## Быстрая перезагрузка (если приложение уже запущено)

В симуляторе нажми **Cmd + R** для перезагрузки.
