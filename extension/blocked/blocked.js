// blocked.js - Intercepted blocked site landing page controller

const quotes = [
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
];

document.addEventListener('DOMContentLoaded', () => {
  const urlParam = new URLSearchParams(window.location.search).get('url');
  
  if (urlParam) {
    try {
      const urlObj = new URL(urlParam);
      let host = urlObj.hostname;
      if (host.startsWith('www.')) host = host.substring(4);
      document.getElementById('blocked-url').textContent = host;
    } catch (e) {
      document.getElementById('blocked-url').textContent = urlParam;
    }
  } else {
    document.getElementById('blocked-url').textContent = 'Restricted Domain';
  }

  // Populate a random quote
  const randomIdx = Math.floor(Math.random() * quotes.length);
  const selectedQuote = quotes[randomIdx];
  document.getElementById('motivational-quote').textContent = `"${selectedQuote.text}"`;
  document.querySelector('.author').textContent = `— ${selectedQuote.author}`;

  // Action listeners
  document.getElementById('btn-close-tab').addEventListener('click', () => {
    // Attempt to close current tab via chrome tabs API
    chrome.tabs.getCurrent((tab) => {
      if (tab) {
        chrome.tabs.remove(tab.id);
      } else {
        // Fallback for standard browsers
        window.close();
      }
    });
  });

  document.getElementById('btn-go-back').addEventListener('click', () => {
    // Go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no history, redirect to google.com
      window.location.href = 'https://www.google.com';
    }
  });
});
