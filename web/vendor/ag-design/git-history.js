import { gitHistoryModel } from "./history-model.js";
import { createHistoryView } from "./history-view.js";
/** Display an explicit newest-first Git DAG. No repository commands or network operations are performed. */
export function createGitHistory({
  commits = [],
  label = "История Git",
  ...options
} = {}) {
  return createHistoryView({
    ...options,
    label,
    model: gitHistoryModel(commits),
    buildModel: gitHistoryModel,
  });
}
