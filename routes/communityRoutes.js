
const express = require('express');
const router = express.Router();

// Temporary in-memory storage for demo purposes
const posts = [];
const reports = [];

router.get('/', (req, res) => {
  res.json({
    message: 'Sakhi Health Community API',
    posts
  });
});

router.post('/', (req, res) => {
  const { content } = req.body || {};

  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      error: 'Please enter a community post.'
    });
  }

  if (content.length > 2000) {
    return res.status(400).json({
      error: 'Posts must be 2000 characters or fewer.'
    });
  }

  const post = {
    id: Date.now().toString(),
    author: 'Community member',
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);
  res.status(201).json({ post });
});

router.post('/:id/report', (req, res) => {
  const post = posts.find(item => item.id === req.params.id);

  if (!post) {
    return res.status(404).json({
      error: 'Post not found.'
    });
  }

  reports.push({
    postId: post.id,
    reason: String(req.body?.reason || 'Other').slice(0, 200),
    reportedAt: new Date().toISOString()
  });

  res.json({ message: 'Report submitted for review.' });
});

module.exports = router;
