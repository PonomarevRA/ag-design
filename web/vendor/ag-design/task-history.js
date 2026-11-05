import { taskHistoryModel } from "./history-model.js";
import { createHistoryView } from "./history-view.js";
/** Display task event lanes and explicit dependencies; status actions are requests to the host. */
export function createTaskHistory({
  tasks = [],
  events = [],
  dependencies = [],
  label = "История задач",
  ...options
} = {}) {
  return createHistoryView({
    ...options,
    label,
    model: taskHistoryModel({ tasks, events, dependencies }),
    buildModel: taskHistoryModel,
  });
}
