import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       🚀 LevelUp AI Backend             ║
  ║       Running on port ${PORT}              ║
  ║       Environment: ${process.env.NODE_ENV || 'development'}      ║
  ╚══════════════════════════════════════════╝
  `);
});
