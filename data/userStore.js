// Hackathon demo storage only: all records are lost when the server restarts.
// Replace with a persistent database and a production session store before deployment.
const users = new Map();

module.exports = { users };
