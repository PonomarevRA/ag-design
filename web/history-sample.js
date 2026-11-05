import {
  createGitHistory,
  createTaskHistory,
} from "./vendor/ag-design/index.js";
import { historyDemoData } from "./system-styles/component-lab-data.js";
/** Use the public factories for catalogue/sandbox samples, with independent synthetic snapshots. */
export function buildHistorySample(
  id,
  props = {},
  document = globalThis.document,
) {
  const data = historyDemoData();
  const handle =
    id === "git-history"
      ? createGitHistory({
          document,
          commits: data.commits,
          label: props.label ?? "История Git",
        })
      : createTaskHistory({
          document,
          ...data,
          label: props.label ?? "История задач",
        });
  return {
    ...handle,
    interact: () => handle.select(id === "git-history" ? "c82a41f" : "ev8"),
  };
}
