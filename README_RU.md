# Tashev Relay

**Git помнит код. Relay помнит, где вы остановились.**

Tashev Relay — лёгкий local-first CLI для продолжения разработки между AI-агентами, терминалами и компьютерами без повторного восстановления контекста.

```bash
relay save --task "Исправить авторизацию" --next "Запустить интеграционные тесты" --agent claude

# переключились на другой AI
relay handoff codex --stdout
relay resume
```

Relay сохраняет текущую задачу, следующий шаг, ветку и commit Git, изменённые/staged/untracked файлы, последний агент и заметки.

## Установка

```bash
git clone https://github.com/tashev11/tashev-relay.git
cd tashev-relay
npm install -g .
relay --help
```

## Основные команды

```bash
relay init
relay save --task "..." --next "..."
relay resume
relay doctor
relay checkpoint
relay handoff claude
relay handoff codex
relay sync push
relay sync pull
```

## Безопасность

Relay не читает содержимое `.env`, API-токены, приватные SSH-ключи, cookies или учётные данные AI-сервисов. Состояние работы хранится локально и игнорируется Git; для необязательной синхронизации используется отдельный `refs/notes/relay`.

Учётные данные из адреса `origin` удаляются всегда. Строки, похожие на токены, в задаче и заметках маскируются: за это отвечает настройка `security.redactSecrets`, по умолчанию она включена. В синхронизируемое состояние не попадают имя компьютера и локальные пути. Помните, что `refs/notes/relay` может прочитать любой, у кого есть доступ на чтение репозитория.

Полное описание и roadmap находятся в [README.md](README.md) и [ROADMAP.md](ROADMAP.md).

MIT © 2026 Rinat Tashev.
