document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    let sentimentChart, likesChart, scoreChart, countTrendChart;
    let currentStats = []; // Store the current stats globally

    // Add date range selector
    const dateRangeSelector = document.createElement('select');
    dateRangeSelector.className = 'form-select mt-3';
    dateRangeSelector.id = 'dateRange';
    dateRangeSelector.innerHTML = `
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 90 Days</option>
        <option value="all" selected>All Time</option>
    `;
    searchForm.appendChild(dateRangeSelector);

    // Add event listener for date range changes
    dateRangeSelector.addEventListener('change', () => {
        if (currentStats.length > 0) {
            const filteredStats = filterStatsByDateRange(currentStats, dateRangeSelector.value);
            updateCharts(filteredStats);
            updateSummaryCounts(filteredStats);
        }
    });

    // Initialize charts
    initializeCharts();

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;

        // Show loading spinner
        loadingSpinner.style.display = 'block';

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

            const response = await fetch('http://127.0.0.1:5000/comments/stats_by_date', {
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
                throw new Error('Failed to fetch statistics');
            }

            const stats = await response.json();
            console.log('Received Stats:', stats);

            if (!Array.isArray(stats) || stats.length === 0) {
                throw new Error('No statistics data received');
            }

            // Validate and normalize data
            const isValidData = stats.every(stat => {
                console.log('Validating stat:', stat);
                return (
                    stat &&
                    typeof stat === 'object' &&
                    'published_at' in stat
                );
            });

            if (!isValidData) {
                console.error('Invalid data structure:', stats);
                throw new Error('Invalid data structure received from server');
            }

            // Normalize data
            currentStats = stats.map(stat => {
                const defaultSentiment = { count: 0, like: 0, score_mean: 0 };
                return {
                    ...stat,
                    positive: stat.positive || defaultSentiment,
                    neutral: stat.neutral || defaultSentiment,
                    negative: stat.negative || defaultSentiment
                };
            });

            // Filter stats based on selected date range
            const filteredStats = filterStatsByDateRange(currentStats, dateRangeSelector.value);
            updateCharts(filteredStats);
            updateSummaryCounts(filteredStats);

        } catch (error) {
            showError('An error occurred while fetching statistics. Please try again.');
            console.error('Error:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function filterStatsByDateRange(stats, range) {
        if (range === 'all') return stats;

        const days = parseInt(range);
        const now = new Date();
        const cutoffDate = new Date(now.setDate(now.getDate() - days));

        return stats.filter(stat => {
            const statDate = new Date(stat.published_at);
            return statDate >= cutoffDate;
        }).sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
    }

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

        // Comment Count Trends Chart
        const countTrendCtx = document.getElementById('countTrendChart').getContext('2d');
        countTrendChart = new Chart(countTrendCtx, {
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
                        title: {
                            display: true,
                            text: 'Number of Comments'
                        }
                    }
                }
            }
        });
    }

    function updateCharts(stats) {
        try {
            console.log('Updating charts with stats:', stats);

            const dates = stats.map(stat => formatDate(stat.published_at));

            // Helper function to safely get values
            const getValue = (obj, prop) => {
                if (!obj || typeof obj !== 'object') return 0;
                const value = obj[prop];
                return typeof value === 'number' ? value : 0;
            };

            // Update Sentiment Distribution Chart
            sentimentChart.data.labels = dates;
            sentimentChart.data.datasets[0].data = stats.map(stat => getValue(stat.positive, 'count'));
            sentimentChart.data.datasets[1].data = stats.map(stat => getValue(stat.neutral, 'count'));
            sentimentChart.data.datasets[2].data = stats.map(stat => getValue(stat.negative, 'count'));
            sentimentChart.update();

            // Update Likes Distribution Chart
            likesChart.data.labels = dates;
            likesChart.data.datasets[0].data = stats.map(stat => getValue(stat.positive, 'like'));
            likesChart.data.datasets[1].data = stats.map(stat => getValue(stat.neutral, 'like'));
            likesChart.data.datasets[2].data = stats.map(stat => getValue(stat.negative, 'like'));
            likesChart.update();

            // Update Sentiment Score Trends Chart
            scoreChart.data.labels = dates;
            scoreChart.data.datasets[0].data = stats.map(stat => getValue(stat.positive, 'score_mean'));
            scoreChart.data.datasets[1].data = stats.map(stat => getValue(stat.neutral, 'score_mean'));
            scoreChart.data.datasets[2].data = stats.map(stat => getValue(stat.negative, 'score_mean'));
            scoreChart.update();

            // Update Comment Count Trends Chart
            countTrendChart.data.labels = dates;
            countTrendChart.data.datasets[0].data = stats.map(stat => getValue(stat.positive, 'count'));
            countTrendChart.data.datasets[1].data = stats.map(stat => getValue(stat.neutral, 'count'));
            countTrendChart.data.datasets[2].data = stats.map(stat => getValue(stat.negative, 'count'));
            countTrendChart.update();

        } catch (error) {
            console.error('Error updating charts:', error);
            showError('Error updating charts. Please try again.');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    function updateSummaryCounts(stats) {
        // Helper function to safely get values
        const getValue = (obj, prop) => {
            if (!obj || typeof obj !== 'object') return 0;
            const value = obj[prop];
            return typeof value === 'number' ? value : 0;
        };

        // Calculate total counts
        const totalPositive = stats.reduce((sum, stat) => sum + getValue(stat.positive, 'count'), 0);
        const totalNeutral = stats.reduce((sum, stat) => sum + getValue(stat.neutral, 'count'), 0);
        const totalNegative = stats.reduce((sum, stat) => sum + getValue(stat.negative, 'count'), 0);

        // Update the DOM
        document.getElementById('positiveCount').textContent = totalPositive;
        document.getElementById('neutralCount').textContent = totalNeutral;
        document.getElementById('negativeCount').textContent = totalNegative;
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