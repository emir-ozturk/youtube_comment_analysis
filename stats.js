document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    let sentimentChart, likesChart, scoreChart;

    // Initialize charts
    initializeCharts();

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;

        // Show loading spinner
        loadingSpinner.style.display = 'block';

        try {
            const response = await fetch('{{commentsUrl}}/stats_by_date', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_url: videoUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const stats = await response.json();
            updateCharts(stats);
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
                labels: [],
                datasets: [
                    {
                        label: 'Positive',
                        data: [],
                        backgroundColor: '#198754',
                        borderColor: '#198754',
                        borderWidth: 1
                    },
                    {
                        label: 'Neutral',
                        data: [],
                        backgroundColor: '#6c757d',
                        borderColor: '#6c757d',
                        borderWidth: 1
                    },
                    {
                        label: 'Negative',
                        data: [],
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
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
                labels: [],
                datasets: [
                    {
                        label: 'Positive',
                        data: [],
                        backgroundColor: '#198754',
                        borderColor: '#198754',
                        borderWidth: 1
                    },
                    {
                        label: 'Neutral',
                        data: [],
                        backgroundColor: '#6c757d',
                        borderColor: '#6c757d',
                        borderWidth: 1
                    },
                    {
                        label: 'Negative',
                        data: [],
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
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

        // Sentiment Score Trends Chart
        const scoreCtx = document.getElementById('scoreChart').getContext('2d');
        scoreChart = new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Positive',
                        data: [],
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Neutral',
                        data: [],
                        borderColor: '#6c757d',
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Negative',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        fill: true
                    }
                ]
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

    function updateCharts(stats) {
        const dates = stats.map(stat => formatDate(stat.published_at));
        
        // Update Sentiment Distribution Chart
        sentimentChart.data.labels = dates;
        sentimentChart.data.datasets[0].data = stats.map(stat => stat.positive.count);
        sentimentChart.data.datasets[1].data = stats.map(stat => stat.neutral.count);
        sentimentChart.data.datasets[2].data = stats.map(stat => stat.negative.count);
        sentimentChart.update();

        // Update Likes Distribution Chart
        likesChart.data.labels = dates;
        likesChart.data.datasets[0].data = stats.map(stat => stat.positive.like);
        likesChart.data.datasets[1].data = stats.map(stat => stat.neutral.like);
        likesChart.data.datasets[2].data = stats.map(stat => stat.negative.like);
        likesChart.update();

        // Update Sentiment Score Trends Chart
        scoreChart.data.labels = dates;
        scoreChart.data.datasets[0].data = stats.map(stat => stat.positive.score_mean);
        scoreChart.data.datasets[1].data = stats.map(stat => stat.neutral.score_mean);
        scoreChart.data.datasets[2].data = stats.map(stat => stat.negative.score_mean);
        scoreChart.update();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
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