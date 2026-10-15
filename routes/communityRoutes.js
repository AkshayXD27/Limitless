const express = require('express');
const router = express.Router();
const { getDbPool, ensureDb } = require('../data/userStore');

// Temporary in-memory fallback
const memoryPosts = [];
const memoryReports = [];

router.get('/', async (req, res) => {
  const connected = await ensureDb();
  if (connected) {
    try {
      const pool = getDbPool();
      const result = await pool.query(
        'SELECT id::text, author, content, created_at AS "createdAt" FROM community_posts ORDER BY created_at DESC LIMIT 50'
      );
      return res.json({
        message: 'Sakhi Health Community API',
        posts: result.rows
      });
    } catch (err) {
      console.error('Community fetch error:', err);
    }
  }

  res.json({
    message: 'Sakhi Health Community API',
    posts: memoryPosts
  });
});

router.post('/', async (req, res) => {
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

  const trimmed = content.trim();
  const connected = await ensureDb();
  if (connected) {
    try {
      const pool = getDbPool();
      const result = await pool.query(
        'INSERT INTO community_posts (author, content) VALUES ($1, $2) RETURNING id::text, author, content, created_at AS "createdAt"',
        ['Community member', trimmed]
      );
      return res.status(201).json({ post: result.rows[0] });
    } catch (err) {
      console.error('Community post error:', err);
    }
  }

  const post = {
    id: Date.now().toString(),
    author: 'Community member',
    content: trimmed,
    createdAt: new Date().toISOString()
  };

  memoryPosts.unshift(post);
  res.status(201).json({ post });
});

router.post('/:id/report', async (req, res) => {
  const postId = req.params.id;
  const reason = String(req.body?.reason || 'Other').slice(0, 200);

  const connected = await ensureDb();
  if (connected) {
    try {
      const pool = getDbPool();
      const numericId = parseInt(postId, 10);
      if (!isNaN(numericId)) {
        await pool.query(
          'INSERT INTO community_reports (post_id, reason) VALUES ($1, $2)',
          [numericId, reason]
        );
        return res.json({ message: 'Report submitted for review.' });
      }
    } catch (err) {
      console.error('Community report error:', err);
    }
  }

  memoryReports.push({
    postId,
    reason,
    reportedAt: new Date().toISOString()
  });

  res.json({ message: 'Report submitted for review.' });
});

module.exports = router;
