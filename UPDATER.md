# Публикация обновлений PepeChat

Updater включён только в собранном Tauri-приложении. Перед первой публикацией:

1. Создайте ключи один раз: `npm run tauri signer generate -- -w ~/.tauri/pepechat.key`.
2. Замените `REPLACE_WITH_YOUR_TAURI_UPDATER_PUBLIC_KEY` и `https://updates.example.com/...` в `src-tauri/tauri.conf.json`. Endpoint обязан использовать HTTPS и вернуть Tauri v2 dynamic update JSON для переданных `target`, `arch` и `current_version` либо HTTP 204, если обновления нет.
3. Храните приватный ключ и пароль только в секретах CI: `TAURI_SIGNING_PRIVATE_KEY` и `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Никогда не коммитьте их.

Для релиза синхронно увеличьте SemVer-версию в `package.json`, `src-tauri/Cargo.toml` и `src-tauri/tauri.conf.json`, затем выполните `npm run tauri build`. Благодаря `createUpdaterArtifacts: true` рядом с установщиками появятся подписанные updater-артефакты и подписи. Загрузите артефакт/подпись в хранилище и обновите JSON endpoint только после завершения загрузки всех файлов.

Минимальный ответ endpoint:

```json
{
  "version": "0.2.0",
  "notes": "Что изменилось",
  "pub_date": "2026-07-12T18:00:00Z",
  "url": "https://updates.example.com/pepechat/PepeChat_0.2.0_x64-setup.nsis.zip",
  "signature": "содержимое файла .sig"
}
```

Для production рекомендуется публиковать через CI, ограничить запись в хранилище релизным job и выставлять манифест атомарно последним шагом. Старая версия не должна видеть манифест до доступности подписанного файла.
