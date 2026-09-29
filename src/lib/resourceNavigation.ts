export const FINISHED_LIBRARY_EVENT = "mengchang-open-finished-library";
export function openFinishedLibrary() {
  window.dispatchEvent(new Event(FINISHED_LIBRARY_EVENT));
}
