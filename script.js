document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    const commentsContainer = document.getElementById('commentsContainer');

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;

        // Show loading spinner
        loadingSpinner.style.display = 'block';
        commentsContainer.innerHTML = '';

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

            // Then, get the classified comments
            const getResponse = await fetch('http://127.0.0.1:5000/comments/get', {
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
                throw new Error('Network error occurred while fetching comments.');
            });

            if (!getResponse) {
                throw new Error('No response received while fetching comments');
            }

            console.log('Get Response Status:', getResponse.status);

            if (!getResponse.ok) {
                const errorText = await getResponse.text();
                console.error('Error Response:', errorText);
                throw new Error(`Failed to fetch comments: ${errorText}`);
            }

            const comments = await getResponse.json();
            console.log('Comments Data:', comments);

            if (!comments || comments.length === 0) {
                showError('No comments found for this video.');
                return;
            }

            displayComments(comments);
        } catch (error) {
            console.error('Full Error:', error);
            showError(`An error occurred: ${error.message}`);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function displayComments(comments) {
        if (comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="alert alert-info">
                    No comments found for this video.
                </div>
            `;
            return;
        }

        const commentsHTML = comments.map(comment => `
            <div class="card comment-card mb-3 sentiment-${comment.sentiment_category}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <p class="card-text">${comment.text}</p>
                            <small class="text-muted">
                                <i class="bi bi-calendar"></i> ${formatDate(comment.published_at)}
                                <i class="bi bi-hand-thumbs-up ms-2"></i> ${comment.like_count}
                            </small>
                        </div>
                        <span class="badge bg-${getSentimentColor(comment.sentiment_category)}">
                            ${comment.sentiment_category}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        commentsContainer.innerHTML = commentsHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getSentimentColor(sentiment) {
        switch (sentiment.toLowerCase()) {
            case 'positive':
                return 'success';
            case 'negative':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    function showError(message) {
        commentsContainer.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
        `;
    }
}); 