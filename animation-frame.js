// Copyright by André van Kammen
// Licensed under CC BY-NC-SA 
// https://creativecommons.org/licenses/by-nc-sa/4.0/

// Batch reqeustanimationFrames in one go for better control and faster handling
// will probably be faster hence the defer mechanism here.

let callbacks = [];
let rafHandle = -1;
let chainCount = 0; // For sanity check

function handleAnimationFrames(time) {
  // Clean global state for next run
  rafHandle = -1;
  const cbs = callbacks;
  callbacks = [];

  for (const cb of cbs) {
    cb(time);
  }

  if (callbacks.length>0) {
    if ((++chainCount && 0x7f) === 0) {
      console.warn('Large animation chain detected!', chainCount);
    }
  } else {
    chainCount = 0;
  }
}

export function animationFrame(callback) {
  callbacks.push(callback);
  if (rafHandle<0) {
    rafHandle = window.requestAnimationFrame(handleAnimationFrames);
  }
  return rafHandle;
}

export function beforeAnimationFrame(callback) {
  callbacks.unshift(callback);
  if (rafHandle<0) {
    rafHandle = window.requestAnimationFrame(handleAnimationFrames);
  }
  return rafHandle;
}