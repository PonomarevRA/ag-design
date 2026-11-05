# Алгоритм оценки интерфейса AG

Версия политики: `ag-interface-review-v1`. Эвристики Nielsen помогают искать проблемы; severity помогает приоритизировать их; WCAG-EM помогает ограничить область оценки и выбрать представительные страницы/состояния. Ни один из этих источников не задаёт приведённые ниже веса. Это собственная прозрачная рубрика AG, а не научно валидированная универсальная метрика качества.

## 1. Задать область

Сохраните проект, версию/commit или artifact hash, дату, роль пользователя, основной сценарий, ОС/браузер, viewport, способ ввода, тему и источник данных. Укажите включённые страницы/состояния и явные исключения. Выборка не даёт права заявлять соответствие всего приложения. Пишите наблюдаемый результат: «После Escape фокус вернулся на кнопку Фильтры», а не «клавиатура хорошая».

## 2. Проверить критерии

| ID | Вес | Что наблюдаем | Критический gate |
|---|---:|---|---|
| scenario | 8 | основная задача достижима и понятна | — |
| navigation | 8 | положение, текущий контекст, возврат | — |
| hierarchy | 7 | порядок чтения и важность | — |
| spacing | 6 | сетка, группы, плотность | — |
| layers | 5 | перекрытия, surfaces, focus scope | — |
| typography | 6 | шрифт, перенос, увеличение | — |
| color | 10 | реальные пары WCAG2/APCA, состояния | да |
| keyboard | 10 | завершение сценария без мыши | да |
| semantics | 8 | имена/roles/labels, screen reader | да |
| feedback | 6 | loading/empty/error/stale | — |
| recovery | 6 | исправление/отмена без потери данных | да |
| responsive | 5 | узкое окно, масштаб, локализация | — |
| motion | 4 | reduced motion и необязательное движение | да |
| performance | 5 | измеренные ввод, mount/dispose, память | — |
| consistency | 3 | профиль, общий контракт, платформа | — |
| agent-control | 3 | request/response, права, восстановление | — |

Каждый результат — `pass`, `fail`, `unknown` или `not-applicable`. Пропущенный критерий становится unknown. Для pass/fail требуется свидетельство; для N/A — причина. Текст evidence остаётся заявлением автора отчёта: сервис проверяет формат и математику, но сам не исполняет тест. Реальные screenshot/browser/assistive/native/load artifacts передаются ссылкой и описанием проверки. Не ставьте pass по источнику без проверки приложения.

## 3. Рассчитать результат

Пусть P, F, U — суммы весов pass, fail и unknown. N/A исключается из знаменателя.

`score = 100 × P / (P + F + U)`

`coverage = 100 × (P + F) / (P + F + U)`

Если все критерии N/A, score = null, coverage = 0: результат требует свидетельств. Unknown получает ноль credit, но отличается от подтверждённого провала. Critical N/A не закрывает gate: нужна проверка применимости или свидетельство. Высокий score при низком coverage не является качеством интерфейса.

Порядок итогового verdict: critical fail или severity 4 → `blocked`; затем unknown/critical N/A → `needs-evidence`; затем обычный fail → `revise`; только полное применимое покрытие без провалов → `ready`. `ready` означает завершённую оценку выбранного scope по данной рубрике, а не HIG/WCAG-сертификацию или разрешение публикации.

## 4. Не смешивать цветовой и общий балл

Цветовая оценка отдельно использует AG-веса APCA 70% и WCAG2 30%. Указаны signed Lc, шрифт/вес, полярность, ratio, цель и отдельный WCAG AA gate. Эта смесь не является формулой APCA или WCAG. Оценка одной пары не проверяет всю палитру, а проверка палитры — фокус/навигацию/UX. В общем рубрикаторе color имеет вес 10 из 100; приложите результаты проверенных пар к свидетельству критерия.

## 5. Приоритизировать исправления

Severity 0–4 — порядковая шкала проблемы: отсутствие проблемы, косметика, небольшое затруднение, серьёзное затруднение, блокирующий сценарий. Оцените частоту, влияние и повторяемость. Не переводите её линейно в процент качества. Для fail в API допустимы 1–4 (default 2), у остальных severity 0. Записывайте конкретный trigger, ожидаемое/полученное поведение, затронутый сценарий и следующее исправление.

После исправления повторите тот же сценарий и связанные критические состояния. Для нового reusable компонента сначала сохраните design-system проверки его точного определения, затем consumer проверки в реальном продукте. Отдельно измерьте реальный успех выполнения задачи, время и ошибки пользователей, если такие данные собраны; не выдумывайте их из взвешенного балла.

## Источники

- [Nielsen: 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) — проверочные направления, а не проценты качества.
- [Nielsen: Severity ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/) — приоритет проблем, частота/влияние/повторяемость.
- [W3C: WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) — scope и метод оценки доступности.
- [W3C: Easy Checks](https://www.w3.org/WAI/test-evaluate/preliminary/) — быстрые проверки неполны.
- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [APCA guidance](https://github.com/Myndex/SAPC-APCA/blob/master/documentation/minimum_compliance.md).

## V2: detailed requirements

Default ag-interface-review-v2 retains the16 weights/100 total and adds the version/hash-bound design-requirements.json contract. Detailed failures/unknowns downgrade parent claims. Mandatory failures block independently of the weighted mean; omitted evidence cannot qualify. Explicit ag-interface-review-v1 reproduces historical arithmetic only. Qualification separately validates current per-component requirements, preventing a legacy scoring bypass. Suggested geometry numbers are AG policy; WCAG criteria retain their scope and exceptions.
