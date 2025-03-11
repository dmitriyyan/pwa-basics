const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
const webpush = require('web-push');

const PRIVATE_VAPID_KEY = process.env.PRIVATE_VAPID_KEY;
const PUBLIC_VAPID_KEY = 'BEBajQmYy6mouMGbKw_laQuRZK1k71_8gMPXH633JZ0f9EGuXRmBy8GkXZ6-CCOrg6CNoWAbjHaejGgFvD5Jk6s';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// local dbs
const posts = [];
const pushSubscriptions = [];

// Generate a random Instagram-like post
function generatePost() {
  return {
    id: faker.string.uuid(),
    image: {
      url: faker.image.url({ width: 640, height: 480 }),
    },
    location: faker.location.city() + ', ' + faker.location.state({ abbreviated: true }),
    title: faker.lorem.words({ min: 2, max: 5 }),
  };
}

// Generate an array of posts
function generatePosts(count = 10) {
  const posts = [];
  for (let i = 0; i < count; i++) {
    posts.push(generatePost());
  }
  return posts;
}

// Endpoint to fetch all posts
app.get('/api/posts', (req, res) => {
  if (posts.length === 0) {
    posts.push(...generatePosts(3));
  }
  res.json({
    posts
  });
});

// Endpoint to fetch a single post by ID
app.get('/api/posts/:id', (req, res) => {
  // Since we're generating fake data, we'll just create a post with the requested ID
  const post = generatePost();
  post.id = req.params.id;
  res.json(post);
});
// Endpoint to create a new post/posts
app.post('/api/posts', (req, res) => {
  // Check if the request body is an array or a single object
  const isArray = Array.isArray(req.body);
  const postData = isArray ? req.body : [req.body];
  const createdPosts = [];
  const errors = [];

  // Process each post
  postData.forEach((data, index) => {
    const { id, title, location, image } = data;

    // Validate required fields
    if (!title || !location) {
      errors.push({
        index,
        error: 'Title and location are required',
        data
      });
      return; // Skip this post
    }

    // Create new post object
    const newPost = {
      id,
      title,
      location,
      // TODO: change to image from frontend
      image: {
        url: faker.image.url({ width: 640, height: 480 })
      }
    };

    createdPosts.push(newPost);
    posts.unshift(newPost); // Add to the beginning of the array
  });

  // Return appropriate response
  if (errors.length > 0 && createdPosts.length === 0) {
    // All posts failed validation
    return res.status(400).json({
      error: 'Validation failed for all posts',
      details: errors
    });
  }
  webpush.setVapidDetails('mailto:test@test.com', PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY);
  pushSubscriptions.forEach(async subscription => {
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'New post created',
        body: 'A new post has been created',
        openUrl: '/help'
      }));
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });
  if (errors.length > 0) {
    // Some posts failed validation, but some succeeded
    return res.status(207).json({
      message: 'Some posts were created successfully',
      created: createdPosts,
      failed: errors
    });
  } else {
    // All posts were created successfully
    return res.status(201).json({
      message: 'All posts created successfully',
      posts: createdPosts,
      // For backward compatibility with existing frontend
      post: isArray ? createdPosts[0] : createdPosts[0]
    });
  }
});

app.post('/api/subscribe', (req, res) => {
  const { subscription } = req.body;
  pushSubscriptions.push(subscription);
  res.status(201).json({
    message: 'Subscription created'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});