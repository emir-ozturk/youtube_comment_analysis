document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const loadingSpinner = document.querySelector('.loading');
    const wordCloudContainer = document.getElementById('wordCloudContainer');
    let wordCloudSvg;

    // Sample data for initial display
    const sampleData = [
        { word: "movie", count: 33 },
        { word: "harry", count: 25 },
        { word: "potter", count: 20 },
        { word: "film", count: 19 },
        { word: "like", count: 13 },
        { word: "voice", count: 12 },
        { word: "love", count: 12 },
        { word: "first", count: 7 },
        { word: "chamber", count: 7 },
        { word: "think", count: 7 },
        { word: "child", count: 7 },
        { word: "book", count: 7 },
        { word: "best", count: 6 }
    ];

    // Initialize word cloud with sample data
    createWordCloud(sampleData);

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) return;

        // Show loading spinner
        loadingSpinner.style.display = 'block';

        try {
            const response = await fetch('{{commentsUrl}}/wordcloud', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_url: videoUrl })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch word cloud data');
            }

            const words = await response.json();
            createWordCloud(words);
        } catch (error) {
            showError('An error occurred while generating the word cloud. Please try again.');
            console.error('Error:', error);
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    function createWordCloud(words) {
        // Clear previous word cloud
        d3.select("#wordCloudContainer").selectAll("*").remove();

        // Create SVG
        const width = wordCloudContainer.clientWidth;
        const height = wordCloudContainer.clientHeight;
        wordCloudSvg = d3.select("#wordCloudContainer")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width/2},${height/2})`);

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
                .on("mouseover", function(event, d) {
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
                .on("mouseout", function() {
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
            createWordCloud(sampleData);
        }
    });
}); 