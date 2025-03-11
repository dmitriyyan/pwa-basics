import { urlBase64ToUint8Array } from './utility.js';

const confirmationToast = document.getElementById('confirmation-toast');


/// <reference lib="esnext" />
/// <reference lib="webworker" />
/*
  Service worker registration
*/
if ('serviceWorker' in navigator) {
  try {
    await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered!');
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}


/*
  Push-notification handling
*/
const enableNotificationsButtons = document.querySelectorAll('.enable-notifications');
const SUBSCRIBE_API_URL = 'http://localhost:3000/api/subscribe';
const PUBLIC_VAPID_KEY = 'BEBajQmYy6mouMGbKw_laQuRZK1k71_8gMPXH633JZ0f9EGuXRmBy8GkXZ6-CCOrg6CNoWAbjHaejGgFvD5Jk6s';

if ('Notification' in window) {
  enableNotificationsButtons.forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', askForNotificationPermission);
  });
}

async function displayConfirmationNotification() {
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("Success!", {
    body: 'Successfully subscribed to notifications (from SW)',
    icon: "/src/images/icons/app-icon-96x96.png",
    image: "/src/images/sf-boat.jpg",
    vibrate: [ 100, 50, 200 ],
    badge: "/src/images/icons/app-icon-96x96.png",
    tag: "confirmation-notification",
    renotify: false,
    actions: [
      {action: 'confirm', title: 'Ok', icon: "/src/images/icons/app-icon-96x96.png"},
      {action: 'cancel', title: 'Cancel', icon: "/src/images/icons/app-icon-96x96.png"},
    ]
  });
}

async function configurePushSub() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub === null) {
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
      const response = await fetch(SUBSCRIBE_API_URL, {
        method: 'POST',
        body: JSON.stringify({subscription: newSub}),
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        await displayConfirmationNotification();
      } else {
        confirmationToast.MaterialSnackbar.showSnackbar({
          message: 'Failed to subscribe to push notifications',
      });
      }
    } else {

    }
  } catch (error) {
    console.error('Error configuring push subscription:', error);
  }
}

async function askForNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    configurePushSub();
  }
}