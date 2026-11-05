# Локализация интерфейса

**Правило AG.** Каждый новый интерфейс заранее объявляет язык, доступные локали, fallback, владельца перевода контента и форматирования. RU/EN — готовый базовый набор, а не обязательное включение русского: English-only допустим. Для одного языка зафиксируйте осознанную single-locale конфигурацию; селектор не обязателен. Бизнес-основание добавления языков принадлежит продукту.

**Компоненты.** Встроенные подписи, placeholder, подсказки, ошибки/статусы и accessible names получают стабильные ключи и буквальные словари. Явные caller labels имеют приоритет. Пользовательский текст, код, Markdown, имена/статусы данных не переводятся эвристически. Новые реализации используют createI18nBindings или эквивалентный locale API. Legacy chrome adapters имеют явный allowlist; их нельзя расширять до document-wide перевода содержимого.

**Настройки.** Хост владеет locale/availableLocales/fallbackLocale; русский можно отключить. createI18n по умолчанию использует en и готовые en/ru словари; старые не настроенные компоненты сохраняют RU-совместимость. Новый UI обязан передавать явный контекст. Для другого языка добавляются словари; неподдерживаемая локаль не обходит включённый набор. Перевод не должен выполняться как HTML/код. Смена языка сохраняет фокус, выбор, черновики и асинхронные операции. Сбой browser storage не блокирует экран и не должен показываться как успешное сохранение.

**Адаптация.** Язык объявляется lang; направление задаётся отдельно через dir. Locale-sensitive number/date/plural/list formatting использует Intl, валюты/единицы/timezone задаёт продукт. Направление auto для известных RTL-языков — удобный default AG, не полное определение по script subtag. Контент другого языка можно маркировать собственным lang. Нельзя выбирать язык из цвета, флагов стран или переводимого значения кнопки; используйте стабильные ID.

**Проверка.** Для локализуемого интерфейса проверить RU/EN либо заявленные локали, fallback и English-only; псевдолокаль/длинные подписи, 200% текста, узкий экран, динамические accessible names/ошибки, plural0/1/2/5/21, даты/числа и dispose. Заявленная RTL-поддержка требует отдельного layout/keyboard/mixed-text сценария. Непроверенные языки/AT/native остаются unknown. Наличие словаря и функциональные тесты не квалифицируют продукт автоматически.


## Language selection
Use createLanguageSwitcher (core0.20+) with explicit i18n. Prefer inline full autonyms for a small visible pair, compact globe + native select for constrained/extensible UI. Do not use flags or codes alone. Keep state, focus and persistence host-owned. One locale is static; hide only with focus recovery. See internationalization-localization in the bilingual design book and the USWDS/GOV.UK/W3C sources.

Sources: [USWDS language selector](https://designsystem.digital.gov/components/language-selector/), [GOV.UK language navigation (trial)](https://design-system.service.gov.uk/components/language-navigation/), [W3C localized-content navigation](https://www.w3.org/International/questions/qa-navigation-select). W3C is a historical navigation article; its older label/alt advice is not adopted. AG uses visible and associated accessible labels.

## Placement and quiet navigation · rules0.11.2

Read [Language selection](language-selection.md) for the source-backed scope/placement matrix, pinned-sidebar-footer conditions, equivalent-URL links versus in-place controls, and core0.20.1 auto/quiet/associated-label API. Count thresholds and a pinned sidebar footer are AG defaults; GOV.UK remains trial and historical W3C missing-label advice is not adopted. Keep placement discoverable across locales/mobile and retain chapter/query/drafts/focus.
