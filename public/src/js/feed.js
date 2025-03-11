/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference path="../../background-sync.d.ts" />

/*
  UI elements and libraries initialization
*/
const shareImageButton = document.getElementById('share-image-button');
const createPostArea = document.getElementById('create-post');
const closeCreatePostModalButton = document.getElementById('close-create-post-modal-btn');
const sharedMomentsArea = document.getElementById('shared-moments');
const form = document.querySelector('#create-post form');
const titleInput = document.getElementById('title');
const locationInput = document.getElementById('location');
const confirmationToast = document.getElementById('confirmation-toast');
const player = document.getElementById('player');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const pickImage = document.getElementById('pick-image');
const imagePicker = document.getElementById('image-picker');
const locationBtn = document.getElementById('location-btn');
const locationLoader = document.getElementById('location-loader');
const manualLocation = document.getElementById('manual-location');

/** @type {typeof import('idb')} */
const idb = window.idb;

const API_URL = 'http://localhost:3000/api/posts';

const db = await idb.openDB('posts-store', 1, {
  upgrade(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('posts')) {
      upgradeDb.createObjectStore('posts', { keyPath: 'id' });
    }
    if (!upgradeDb.objectStoreNames.contains('sync-posts')) {
      upgradeDb.createObjectStore('sync-posts', { keyPath: 'id' });
    }
  },
});

/*
  UI handling
*/
function showSnackbar(data) {
  confirmationToast.MaterialSnackbar.showSnackbar(data);
}

function openCreatePostModal() {
  initializeCamera();
  createPostArea.style.transform = 'translateY(0)';
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  player.style.display = 'none';
  pickImage.style.display = 'none';
  canvas.style.display = 'none';
  locationLoader.style.display = 'none';
  locationBtn.style.display = 'inline';
  captureBtn.style.display = 'inline';
  if (player.srcObject) {
    player.srcObject.getTracks().forEach(function (track) {
      track.stop();
    });
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(post, isFirst = false) {
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  const cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url("' + post.image.url + '")';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  const cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = post.title;
  cardTitle.appendChild(cardTitleTextElement);
  const cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);
  if (isFirst) {
    sharedMomentsArea.insertBefore(cardWrapper, sharedMomentsArea.firstChild);
  } else {
    sharedMomentsArea.appendChild(cardWrapper);
  }
}

/*
  Data handling
*/
let isNetworkDataReceived = false;

try {
  const res = await fetch(API_URL);
  const data = await res.json();
  isNetworkDataReceived = true;
  clearCards();
  data.posts.forEach(function(post) {
    createCard(post);
  });
} catch (err) {
  console.error('Failed to fetch posts:', err);
}


if (!isNetworkDataReceived) {
  const posts = await db.getAll('posts');
  clearCards();
  posts.forEach(function (post) {
    createCard(post);
  });
}

// Function to submit a new post
async function submitPost(event) {
  event.preventDefault(); // Prevent form from submitting normally

  const hasTitle = titleInput.value.trim() !== '';
  const hasLocation = locationInput.value.trim() !== '';

  if (!hasTitle || !hasLocation) {
    const data = {
      message: 'Title and location are required',
      timeout: 3000
    };
    showSnackbar(data);
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const post = {
      id: crypto.randomUUID(),
      title: titleInput.value,
      location: locationInput.value,
      image: {},
    }
    await db.put('sync-posts', post);
    registration.sync.register('sync-new-posts');

      form.reset();

    closeCreatePostModal();

    // Add new post to the UI
    createCard(post, true);

    // Show confirmation
    const data = {
      message: 'Post created successfully!',
      timeout: 2000
    };
    showSnackbar(data);
  } catch (error) {
    console.error('Error creating post:', error);
    // Show error in toast
    const data = {
      message: error.message || 'Something went wrong!',
      timeout: 3000
    };
    showSnackbar(data);
  }
}

// Add submit event listener to the form
form.addEventListener('submit', submitPost);


/*
  Camera handling
*/
async function initializeCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    player.srcObject = stream;
    player.style.display = 'block';
  } catch (error) {
    console.error('Error initializing camera:', error);
    pickImage.style.display = 'block';
  }
}

captureBtn.addEventListener('click', function (event) {
  canvas.style.display = 'block';
  player.style.display = 'none';
  captureBtn.style.display = 'none';
  const context = canvas.getContext('2d');
  context.drawImage(player, 0, 0, canvas.width, player.videoHeight / (player.videoWidth / canvas.width));
  player.srcObject.getVideoTracks().forEach(function (track) {
    track.stop();
  });
});

/*
  Location handling
*/
locationBtn.addEventListener('click', function (event) {
  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(function (position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    locationInput.value = latitude + ', ' + longitude;
    locationLoader.style.display = 'none';
    manualLocation.classList.add('is-focused');
  }, function (error) {
    console.error('Error getting location:', error);
    locationLoader.style.display = 'none';
    locationBtn.style.display = 'inline';
  }, {timeout: 5000});
});