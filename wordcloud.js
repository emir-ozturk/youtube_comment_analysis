document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    const wordCloudContainer = document.getElementById('wordCloudContainer');
    let wordCloudSvg;
    let currentWordData = []; // Store the current word data

    // Initialize empty word cloud
    createWordCloud([]);

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

            const response = await fetch('http://127.0.0.1:5000/comments/wordcloud', {
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
                throw new Error('Failed to fetch word cloud data');
            }

            const words = await response.json();
            currentWordData = words; // Store the fetched data
            createWordCloud(words);
        } catch (error) {
            showError('An error occurred while generating the word cloud. Please try again.');
            console.error('Error:', error);
            createWordCloud([]); // Reset to empty word cloud on error
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function createWordCloud(words) {
        // Clear previous word cloud
        d3.select("#wordCloudContainer").selectAll("*").remove();

        if (words.length === 0) {
            // Display a message when no data is available
            wordCloudContainer.innerHTML = '<div class="text-center text-muted mt-5">Enter a YouTube URL to generate word cloud</div>';
            return;
        }

        // Create SVG
        const width = wordCloudContainer.clientWidth;
        const height = wordCloudContainer.clientHeight;
        wordCloudSvg = d3.select("#wordCloudContainer")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Create word cloud layout
        const layout = d3.layout.cloud()
            .size([width, height])
            .words(words.map(d => ({
                text: d.word,
                size: 10 + (d.count * 2),
                count: d.count
            })))
            .padding(5)
            .rotate(0)
            .font("Arial")
            .fontSize(d => d.size)
            .on("end", draw);

        layout.start();

        function draw(words) {
            // Create tooltip
            const tooltip = d3.select("#wordCloudContainer")
                .append("div")
                .attr("class", "word-info");

            // Draw words
            wordCloudSvg.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Arial")
                .style("fill", (d, i) => d3.schemeCategory10[i % 10])
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
                .text(d => d.text)
                .classed("word-cloud-word", true)
                .on("mouseover", function (event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .style("font-size", `${d.size * 1.2}px`)
                        .style("cursor", "pointer");

                    tooltip.style("display", "block")
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .html(`Count: ${d.count}`);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .style("font-size", d => `${d.size}px`);
                    tooltip.style("display", "none");
                });
        }
    }

    function showError(message) {
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-4';
        errorDiv.textContent = message;
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (wordCloudSvg) {
            createWordCloud(currentWordData);
        }
    });
}); 