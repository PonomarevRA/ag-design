# Проектирование и повторное использование

## Выбор решения

Сначала определите проект, этап (планирование / компоновка / компонент / ревью / выпуск), платформу, задачу пользователя и существующую палитру. Вызовите `design_status`, `design_search`, прочитайте подходящий компонент. Отсутствие точного совпадения — повод запросить `design_recommendations`, а не молча изобретать новый контрол. Рекомендации — детерминированные правила и зарегистрированные факты, не оценка нейросетью и не сертификат соответствия.

Apple HIG используется для иерархии, контекстной панели инструментов, нативной оболочки и доступности: https://developer.apple.com/design/human-interface-guidelines/toolbars . Google Material — для семантических токенов, состояний и адаптивной компоновки: https://m3.material.io/foundations/ и https://m3.material.io/foundations/layout/canonical-examples/overview . Правила Студии Артемия Лебедева — для устойчивой структуры навигации, определения текущего положения и предсказуемости переходов: https://www.artlebedev.ru/backstage/navigation-rules/ и https://www.artlebedev.ru/kovodstvo/sections/76/ . Это источники принципов, а не разрешение копировать графику или фирменный стиль. При конфликте приоритет имеют задача пользователя, требования доступности и соглашения конкретной ОС. Суммарная оценка не заменяет ручное ревью.

## Цветовые профили и контраст

Все компоненты используют семантические `--ag-*` токены. Профиль содержит accent, onAccent, surface, surfaceAlt, text, muted, border, danger, success для светлой и тёмной темы. Смена профиля меняет цвета, сохраняя поведение, геометрию и читаемость. По умолчанию зарегистрированный компонент поддерживает все профили. Профиль проекта выбирается явно; существующие пять палитр сохранены.

`design_contrast` и `evaluateColorPair` используют неизменённый алгоритм **apca-w3 0.1.9**. Полярность Lc сохраняется. Для ранжирования вес APCA — **70%**, WCAG2 — **30%**. Неудачный WCAG AA остаётся отдельным блокирующим результатом и не маскируется высоким общим баллом. Порог WCAG — 4.5:1 для обычного текста и 3:1 для крупного (24px либо 18.67px при жирности >=700). APCA — экспериментальный дополнительный сигнал, не норматив WCAG2; целевой Lc зависит от размера, веса и назначения текста. Возвращается исходная таблица размеров шрифта; специальные значения не означают разрешение для основного текста. Цвета в API — непрозрачные #RRGGBB. Прозрачность, изображения, реальный шрифт и фон требуют проверки в приложении.

Источники: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html ; https://github.com/Myndex/SAPC-APCA/blob/master/documentation/minimum_compliance.md . Условия и уведомления upstream находятся в APCA-LICENSE.md и COLORPARSLEY-LICENSE.md внутри пакета. Не заявляйте APCA/WCAG-сертификацию по одному вычислению.

## Жизненный цикл и доказательства

1. Найти существующий компонент и решить, достаточно ли композиции/callback/CSS-токенов.
2. Новый компонент сначала разработать в ag-design. Зарегистрировать draft с intendedUse, rationale, alternatives, limitations, sources, версиями и бюджетом. `design_register_component` принимает метаданные, не исполняемый код.
3. Проверить в дизайн-системе функциональность, клавиатуру/фокус, все профили, нагрузку и очистку. `design_report_checks(report={..., "stage":"design-system", ...})` привязывает отчёт к версии, **хэшу определения и SHA-256 npm-артефакта** (`artifactHash`, заполняется pack:local). Более новый провал отменяет допуск. Передача в продукт разрешена только после pass.
4. Подключить фиксированный локальный npm tarball; vanilla-приложения поставляют точные файлы и SHA-256 manifest. Runtime не зависит от запущенного ag-design или соседнего checkout.
5. Проверить реальный продукт: узкая ширина, 200% текст, темы, keyboard, loading/empty/error, reduced motion, fallback браузера и нативный артефакт. Отчёт `stage=consumer` требует актуального DS pass.
6. `design_register_usage` фиксирует место, версию, проект и короткую причину выбора только после актуальной проверки потребителя. Неизвестные доказательства остаются неизвестными. Несоответствия записываются как дизайн-долг с источником, целью и статусом.

Проверки caller-reported: сервис хранит результаты, но не доказывает их исполнение. Производительность сравнивается в одинаковой среде; Node/jsdom не измеряет реальную отрисовку браузера или native RSS. Отрицательная дельта heap после GC не доказывает отсутствие утечки.

## Внешняя библиотека

Живая база описаний находится **вне кода и replaceable bundle**: `AG_DESIGN_LIBRARY_DIR`, `--library-dir` или системная папка AGDesignLibrary. Каталоги components/rules/usage/debt/profiles/patterns и `packages/*.tgz` остаются после замены приложения. SQLite отчётов расположен отдельно в папке данных сервиса. Поставляемый catalog — шаблон начального заполнения. При обновлении неизменённые managed записи обновляются, пользовательские правки сохраняются и показываются как конфликты. Пакеты — архивы сборки; сервис их не импортирует как плагины. Перед переносом папки остановите запись и скопируйте библиотеку целиком; файлы нельзя подменять симлинками.

Loading/error/result feedback follows Apple design principles and Nielsen visibility of system status, not an unverified claim about the Lebedev navigation article. Source-backed full sections are available through design_rule_sections/design_rule_section.

Before new controls, apply [addressed reuse decisions](reuse-decisions.md). A draft factory is not absent code; native fallback still needs shared geometry/state/focus checks. Research prototypes follow the same choice-record rule.

For compound patterns or page templates, read `atomic-design-composition`. Start from the user's screen/task, reuse exact inspected components and separate shared structure from representative fixture data. Record slots, child versions, ownership and known dependencies; verify both parts and affected screens with current changed-block/width checks. Taxonomy is advisory, not a mandatory five-layer architecture; a child PASS does not qualify the page. Offline recipes: `@ag-design/rules/atomic-design.json`.
