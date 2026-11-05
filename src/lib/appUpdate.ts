export function shouldReloadOnControllerChange(
  hadController: boolean,
  unsavedEdits: boolean,
  alreadyReloaded: boolean,
) {
  return hadController && !unsavedEdits && !alreadyReloaded;
}

let registration: ServiceWorkerRegistration | undefined;
let hadController = false;
let unsavedEdits = false;
let reloadDeferred = false;
let reloadStarted = false;
let lastUpdate = 0;

export function setUnsavedEdits(value: boolean) {
  unsavedEdits = value;
  if (
    !value &&
    reloadDeferred &&
    shouldReloadOnControllerChange(hadController, false, reloadStarted)
  ) {
    reloadStarted = true;
    reloadDeferred = false;
    window.location.reload();
  }
}

async function updateRegistration() {
  if (!registration) return;
  const now = Date.now();
  if (now - lastUpdate < 10 * 60 * 1000) return;
  lastUpdate = now;
  await registration.update();
}

export function startAppUpdate() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!shouldReloadOnControllerChange(hadController, unsavedEdits, reloadStarted)) {
      reloadDeferred = hadController && unsavedEdits;
      return;
    }
    reloadStarted = true;
    window.location.reload();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void updateRegistration();
  });
  void navigator.serviceWorker.ready.then((ready) => {
    registration = ready;
    void updateRegistration();
  });
}
