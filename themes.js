document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    const themesContainer = document.getElementById('themesContainer');
    const BACKEND_URL = 'http://127.0.0.1:5000';

    // Theme colors for different topics
    const themeColors = [
        { bg: '#e3f2fd', border: '#90caf9' }, // Light Blue
        { bg: '#f3e5f5', border: '#ce93d8' }, // Light Purple
        { bg: '#e8f5e9', border: '#a5d6a7' }, // Light Green
        { bg: '#fff3e0', border: '#ffcc80' }, // Light Orange
        { bg: '#fce4ec', border: '#f48fb1' }  // Light Pink
    ];

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;

        // Show loading spinner
        loadingSpinner.style.display = 'block';
        themesContainer.innerHTML = '';

        try {
            // First, classify the comments
            const classifyResponse = await fetch('http://127.0.0.1:5000/comments/classify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ video_url: videoUrl })
            }).catch(error => {
                console.error('Fetch Error:', error);
                throw new Error('Network error occurred. Please check your connection and try again.');
            });

            if (!classifyResponse) {
                throw new Error('No response received from server');
            }

            console.log('Classify Response Status:', classifyResponse.status);
            console.log('Classify Response Headers:', classifyResponse.headers);

            const responseData = await classifyResponse.json();
            console.log('Classify Response Data:', responseData);

            if (!classifyResponse.ok) {
                throw new Error(responseData.error || `HTTP error! status: ${classifyResponse.status}`);
            }

            // Then proceed with the themes request
            const response = await fetch(`${BACKEND_URL}/comments/theme_named_v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({ video_url: videoUrl })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.error ||
                    `Server error (${response.status}): ${response.statusText}`
                );
            }

            const themes = await response.json();
            console.log('Received themes:', themes); // Debug log
            displayThemes(themes);
        } catch (error) {
            console.error('Error details:', error);
            let errorMessage = 'An error occurred while analyzing themes.';

            if (error.message.includes('Cannot connect to backend')) {
                errorMessage = 'Cannot connect to server. Please make sure the backend server is running.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your internet connection.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }

            showError(errorMessage);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function displayThemes(themes) {
        if (!themes || themes.length === 0) {
            showError('No themes found for this video.');
            return;
        }

        // Sort themes by importance_score in descending order
        const sortedThemes = [...themes].sort((a, b) => b.importance_score - a.importance_score);

        const themesHTML = sortedThemes.map((theme, index) => {
            const colorIndex = index % themeColors.length;
            const color = themeColors[colorIndex];

            return `
                <div class="col-md-4 mb-4">
                    <div class="card theme-card h-100" 
                         style="border-color: ${color.border}; background-color: ${color.bg}">
                        <div class="card-body">
                            <h5 class="card-title mb-3">${theme.name}</h5>
                            <div class="theme-words">
                                ${theme.top_words.map(word => `
                                    <span class="theme-word" style="border-color: ${color.border}">
                                        ${word}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        themesContainer.innerHTML = themesHTML;
    }

    function showError(message) {
        themesContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${message}
                </div>
            </div>
        `;
    }
}); 