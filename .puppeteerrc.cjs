const { join } = require('path');

/**
 * Keep Puppeteer's downloaded Chrome inside the deployed app directory.
 * This makes Render deployments reliable because the browser binary is
 * available to the running service after the build finishes.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer')
};
