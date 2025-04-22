document.addEventListener('DOMContentLoaded', () => {
    const compareForm = document.getElementById('compareForm');
    const loadingSpinner = document.querySelector('.loading');
    let sentimentChart, likesChart, scoreChart;
    let videoStats = []; // Store stats for each video

    // Initialize charts
    initializeCharts();

    // Add event listener for form submission
    compareForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const videoUrls = Array.from(document.querySelectorAll('#videoInputs input[type="url"]'))
            .map(input => input.value.trim())
            .filter(url => url !== '');

        if (videoUrls.length === 0) {
            showError('Please add at least one video URL');
            return;
        }

        loadingSpinner.style.display = 'block';
        videoStats = [];

        try {
            // Fetch stats for each video
            for (const url of videoUrls) {
                const response = await fetch('http://127.0.0.1:5000/comments/stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ video_url: url })
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch statistics for video: ${url}`);
                }

                const stats = await response.json();
                videoStats.push({
                    url: url,
                    stats: stats
                });
            }

            updateCharts();

        } catch (error) {
            showError('An error occurred while fetching statistics. Please try again.');
            console.error('Error:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function initializeCharts() {
        // Sentiment Distribution Chart
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        sentimentChart = new Chart(sentimentCtx, {
            type: 'bar',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Comments'
                        }
                    }
                }
            }
        });

        // Likes Distribution Chart
        const likesCtx = document.getElementById('likesChart').getContext('2d');
        likesChart = new Chart(likesCtx, {
            type: 'bar',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Likes'
                        }
                    }
                }
            }
        });

        // Sentiment Score Chart
        const scoreCtx = document.getElementById('scoreChart').getContext('2d');
        scoreChart = new Chart(scoreCtx, {
            type: 'bar',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Sentiment Score'
                        }
                    }
                }
            }
        });
    }

    function updateCharts() {
        const colors = [
            '#198754', // green
            '#0d6efd', // blue
            '#6f42c1', // purple
            '#d63384', // pink
            '#fd7e14', // orange
            '#20c997', // teal
            '#e83e8c', // pink
            '#6c757d'  // gray
        ];

        // Helper function to safely get values
        const getValue = (obj, prop) => {
            if (!obj || typeof obj !== 'object') return 0;
            const value = obj[prop];
            return typeof value === 'number' ? value : 0;
        };

        // Update Sentiment Distribution Chart
        sentimentChart.data.datasets = videoStats.map((video, index) => ({
            label: `Video ${index + 1}`,
            data: [
                getValue(video.stats.positive, 'count'),
                getValue(video.stats.neutral, 'count'),
                getValue(video.stats.negative, 'count')
            ],
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 1
        }));
        sentimentChart.update();

        // Update Likes Distribution Chart
        likesChart.data.datasets = videoStats.map((video, index) => ({
            label: `Video ${index + 1}`,
            data: [
                getValue(video.stats.positive, 'like'),
                getValue(video.stats.neutral, 'like'),
                getValue(video.stats.negative, 'like')
            ],
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 1
        }));
        likesChart.update();

        // Update Sentiment Score Chart
        scoreChart.data.datasets = videoStats.map((video, index) => ({
            label: `Video ${index + 1}`,
            data: [
                getValue(video.stats.positive, 'score_mean'),
                getValue(video.stats.neutral, 'score_mean'),
                getValue(video.stats.negative, 'score_mean')
            ],
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length],
            borderWidth: 1
        }));
        scoreChart.update();
    }

    function showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-4';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
});

// Functions for managing video inputs
function addVideoInput() {
    const videoInputs = document.getElementById('videoInputs');
    const newInput = document.createElement('div');
    newInput.className = 'video-input-group';
    newInput.innerHTML = `
        <div class="input-group">
            <input type="url" class="form-control" placeholder="Enter YouTube video URL" required>
            <button class="btn btn-danger" type="button" onclick="removeVideoInput(this)">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    videoInputs.appendChild(newInput);
}

function removeVideoInput(button) {
    const videoInputs = document.getElementById('videoInputs');
    if (videoInputs.children.length > 1) {
        button.closest('.video-input-group').remove();
    } else {
        showError('At least one video URL is required');
    }
} 