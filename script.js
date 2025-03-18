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
                },
                body: JSON.stringify({ video_url: videoUrl })
            });

            if (!classifyResponse.ok) {
                throw new Error('Failed to classify comments');
            }

            // Then, get the classified comments
            const getResponse = await fetch('{{commentsUrl}}/get');
            if (!getResponse.ok) {
                throw new Error('Failed to fetch comments');
            }

            const comments = await getResponse.json();
            displayComments(comments);
        } catch (error) {
            showError('An error occurred while processing your request. Please try again.');
            console.error('Error:', error);
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