/**
 * devtint.github.io - Main JavaScript Logic
 * Handles interactive elements, dynamic GitHub integrations, and utility functions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeCopyToClipboard();
  initializeGitHubStats();
  initializeThemeToggle();
});

/**
 * Copy to Clipboard Utility
 * Searches for all elements with class 'btn-copy' and copies sibling '.cmd-text' content.
 */
function initializeCopyToClipboard() {
  const copyButtons = document.querySelectorAll('.btn-copy');
  
  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const cmdTextContainer = button.closest('.cmd-box')?.querySelector('.cmd-text');
      if (!cmdTextContainer) return;
      
      const textToCopy = cmdTextContainer.textContent.trim();
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        
        // Success visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        button.style.color = '#34d399'; // Mint green feedback
        
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  });
}

/**
 * Dynamic GitHub stats loader
 * Fetches user profile data from the GitHub API and contribution metrics from Jogruber API.
 */
async function initializeGitHubStats() {
  const username = 'devtint';
  const repoCountElement = document.getElementById('stat-repos');
  const contributionElement = document.getElementById('stat-contribs');

  // Fetch Public Repositories count
  if (repoCountElement) {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        if (data.public_repos) {
          animateValue(repoCountElement, parseInt(repoCountElement.textContent) || 0, data.public_repos, 1500);
        }
      }
    } catch (error) {
      console.warn('Could not fetch public repositories from GitHub API.', error);
    }
  }

  // Fetch Contribution Stats count
  if (contributionElement) {
    try {
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
      if (response.ok) {
        const data = await response.json();
        if (data.total) {
          const totalContributions = Object.values(data.total).reduce((sum, val) => sum + val, 0);
          if (totalContributions > 0) {
            animateValue(contributionElement, parseInt(contributionElement.textContent) || 0, totalContributions, 1500);
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch contribution stats from Jogruber API.', error);
    }
  }
}

/**
 * Smooth value animation helper for stats numbers
 */
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start) + '+';
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Theme Toggle Handler
 * Configures sun/moon icons toggle click and loads persisted settings from localStorage.
 */
function initializeThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;
  
  // Load saved preference (default: light)
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
  } else if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
  
  // Listen for clicks
  toggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    
    // Save preference
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}