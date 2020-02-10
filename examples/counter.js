/**
 * Simple counter example for at-iohook module
 * @version 0.1.0
 */

const iohook = require('..');

// Create counter object
const counters = { keyboard: 0, mouse: 0, move: 0 };

// Setup different events listeners
iohook.on('mousemove', () => (counters.move += 1));
iohook.on('mousedown', () => (counters.mouse += 1));
iohook.on('mousewheel', () => (counters.mouse += 1));
iohook.on('keydown', () => (counters.keyboard += 1));

// Activate event subscriptions
iohook.start();

// Log counters into console each second
setInterval(() => console.log(counters), 1000);
