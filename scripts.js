
                // API key - should be managed securely in production
                const apiKey = "15b277589f55c0e4341672c345de7cd7c1677d5d";
                let currentSelectedRegion = null;
                let bookmarkedLocations = JSON.parse(localStorage.getItem('bookmarkedLocations') || '[]');
                
                // Smooth scroll implementation
                document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                    anchor.addEventListener('click', function (e) {
                        e.preventDefault();
                        const target = document.querySelector(this.getAttribute('href'));
                        if (target) {
                            target.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }
                    });
                });
                
                // Scroll to top function
                function scrollToTop() {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
                
                // Dark mode toggle function
                function toggleDarkMode() {
                    document.documentElement.classList.toggle('dark');
                    const isDark = document.documentElement.classList.contains('dark');
                    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
                    
                    // Update maps for dark mode
                    if (window.Map && window.heatmapMap) {
                        if (isDark) {
                            document.querySelectorAll('.leaflet-tile-container img').forEach(tile => {
                                tile.style.filter = 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)';
                            });
                        } else {
                            document.querySelectorAll('.leaflet-tile-container img').forEach(tile => {
                                tile.style.filter = '';
                            });
                        }
                        
                        // Update charts for dark mode
                        if (window.aqiTrendChart) {
                            updateChartTheme(window.aqiTrendChart, isDark);
                        }
                        if (window.pollutantChart) {
                            updateChartTheme(window.pollutantChart, isDark);
                        }
                    }
                }
                
                // Update chart theme based on dark mode
                function updateChartTheme(chart, isDark) {
                    if (!chart) return;
                    
                    chart.options.plugins.legend.labels.color = isDark ? '#e2e8f0' : '#4a5568';
                    chart.options.scales.x.ticks.color = isDark ? '#e2e8f0' : '#4a5568';
                    chart.options.scales.y.ticks.color = isDark ? '#e2e8f0' : '#4a5568';
                    chart.options.scales.x.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    chart.update();
                }
                
                // Show toast notification
                function showToast(message, duration = 5000) {
                    const toast = document.getElementById('toast');
                    toast.textContent = message;
                    toast.style.display = 'block';
                    
                    setTimeout(() => {
                        toast.style.display = 'none';
                    }, duration);
                }
                
                // Apply saved dark mode preference on load
                document.addEventListener('DOMContentLoaded', function() {
                    // Mobile menu toggle
                    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                    const mobileMenu = document.getElementById('mobileMenu');
                    
                    if (mobileMenuBtn && mobileMenu) {
                        mobileMenuBtn.addEventListener('click', function() {
                            mobileMenu.classList.toggle('hidden');
                        });
                    }
                    
                    // Apply dark mode if saved
                    if (localStorage.getItem('darkMode') === 'enabled') {
                        document.documentElement.classList.add('dark');
                        // Update toggle checkbox state
                        const darkModeToggle = document.getElementById('darkModeToggle');
                        if (darkModeToggle) {
                            darkModeToggle.checked = true;
                        }
                    } else if (localStorage.getItem('darkMode') === 'disabled') {
                        document.documentElement.classList.remove('dark');
                    }
                    
                    // Random weather alert - show about 30% of the time
                    if (Math.random() < 0.3) {
                        const weatherAlerts = [
                            "Weather alert: High pollution levels expected due to upcoming weather conditions.",
                            "Air quality warning: Dust storm expected in the region in the next 24 hours.",
                            "Health advisory: Increased humidity may cause pollutants to stay closer to ground level.",
                            "Weather update: Light rain expected, which may temporarily improve air quality."
                        ];
                        const randomAlert = weatherAlerts[Math.floor(Math.random() * weatherAlerts.length)];
                        document.getElementById('alert-text').textContent = randomAlert;
                        document.getElementById('weather-alert').classList.remove('hidden');
                    }
                    
                    // Initialize maps
                    initializeMaps();
                    
                    // Initialize charts
                    initializeCharts();
                    
                    // Setup event listeners for buttons
                    setupEventListeners();
                    
                    // Try to get user location for initial data
                    getUserLocation();
                });
                
                // Initialize maps
                function initializeMaps() {
                    // Initialize AQI map
                    window.Map = L.map('map').setView([20.5937, 78.9629], 5);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.Map);
                    
                    // Initialize pollution heatmap
                    window.heatmapMap = L.map('pollution-heatmap').setView([20.5937, 78.9629], 5);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.heatmapMap);
                    
                    // Apply dark mode to maps if needed
                    if (document.documentElement.classList.contains('dark')) {
                        document.querySelectorAll('.leaflet-tile-container img').forEach(tile => {
                            tile.style.filter = 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)';
                        });
                    }
                    
                    // Add click event for AQI map
                    window.Map.on('click', async function(e) {
                        var lat = e.latlng.lat;
                        var lng = e.latlng.lng;
                        await handleLocationSelect(lat, lng);
                    });
                    
                    // Add click event for pollution heatmap
                    window.heatmapMap.on('click', async function(e) {
                        var lat = e.latlng.lat;
                        var lng = e.latlng.lng;
                        await fetchLocationName(lat, lng).then(region => {
                            document.getElementById("pollution-info").classList.remove("hidden");
                            fetchAirPollution(lat, lng, region);
                        });
                    });
                    
                    // Load initial data for maps
                    fetchGlobalAQIData(window.Map, window.heatmapMap);
                }
                
                // Initialize charts with sample data
                function initializeCharts() {
                    // AQI Trend Chart
                    const aqiTrendCtx = document.getElementById('aqiTrendChart').getContext('2d');
                    const dates = getLastSevenDays();
                    const sampleAQIData = [85, 92, 110, 78, 105, 120, 95];
                    
                    window.aqiTrendChart = new Chart(aqiTrendCtx, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [{
                                label: 'Air Quality Index',
                                data: sampleAQIData,
                                backgroundColor: 'rgba(66, 153, 225, 0.2)',
                                borderColor: 'rgba(66, 153, 225, 1)',
                                borderWidth: 2,
                                tension: 0.3,
                                pointBackgroundColor: 'rgba(66, 153, 225, 1)',
                                pointRadius: 4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top',
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const aqi = context.parsed.y;
                                            let status = getAQICondition(aqi).label;
                                            return `AQI: ${aqi} (${status})`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.1)'
                                    },
                                    ticks: {
                                        color: '#4a5568'
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false
                                    },
                                    ticks: {
                                        color: '#4a5568'
                                    }
                                }
                            }
                        }
                    });
                    
                    // Apply dark mode to chart if needed
                    if (document.documentElement.classList.contains('dark')) {
                        updateChartTheme(window.aqiTrendChart, true);
                    }
                    
                    // Pollutant Comparison Chart
                    const pollutantCtx = document.getElementById('pollutantChart').getContext('2d');
                    
                    window.pollutantChart = new Chart(pollutantCtx, {
                        type: 'bar',
                        data: {
                            labels: ['PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'],
                            datasets: [{
                                label: 'Current Levels',
                                data: [55, 38, 25, 12, 30, 8],
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.6)',
                                    'rgba(54, 162, 235, 0.6)',
                                    'rgba(255, 206, 86, 0.6)',
                                    'rgba(75, 192, 192, 0.6)',
                                    'rgba(153, 102, 255, 0.6)',
                                    'rgba(255, 159, 64, 0.6)'
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',
                                    'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)',
                                    'rgba(75, 192, 192, 1)',
                                    'rgba(153, 102, 255, 1)',
                                    'rgba(255, 159, 64, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Concentration (µg/m³)'
                                    }
                                }
                            }
                        }
                    });
                    
                    // Apply dark mode to chart if needed
                    if (document.documentElement.classList.contains('dark')) {
                        updateChartTheme(window.pollutantChart, true);
                    }
                }
                
                // Get last seven days for chart labels
                function getLastSevenDays() {
                    const dates = [];
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        dates.push(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));
                    }
                    return dates;
                }
                
                // Setup event listeners for interactive elements
                function setupEventListeners() {
                    // Quick search button
                    const quickSearchBtn = document.getElementById('quickSearchBtn');
                    if (quickSearchBtn) {
                        quickSearchBtn.addEventListener('click', function() {
                            const selection = document.getElementById('quickSearch').value;
                            if (selection) {
                                const [lat, lng] = selection.split(',');
                                handleLocationSelect(parseFloat(lat), parseFloat(lng));
                                
                                // Also update the pollution map view
                                window.heatmapMap.setView([parseFloat(lat), parseFloat(lng)], 9);
                            }
                        });
                    }
                    
                    // User location button
                    const userLocationBtn = document.getElementById('userLocationBtn');
                    if (userLocationBtn) {
                        userLocationBtn.addEventListener('click', function() {
                            getUserLocation();
                        });
                    }
                    
                    // Bookmark button
                    const bookmarkBtn = document.getElementById('bookmarkLocation');
                    if (bookmarkBtn) {
                        bookmarkBtn.addEventListener('click', function() {
                            if (currentSelectedRegion) {
                                saveBookmark(currentSelectedRegion);
                            }
                        });
                    }
                    
                    // Newsletter subscription
                    const subscribeBtn = document.getElementById('subscribeBtn');
                    if (subscribeBtn) {
                        subscribeBtn.addEventListener('click', function() {
                            const emailInput = subscribeBtn.previousElementSibling;
                            if (emailInput && emailInput.value) {
                                showToast("Thank you for subscribing to our newsletter!");
                                emailInput.value = "";
                            } else {
                                showToast("Please enter a valid email address");
                            }
                        });
                    }
                }
                
                // Get user's current location
                function getUserLocation() {
                    if (navigator.geolocation) {
                        document.getElementById('user-location-aqi').innerHTML = `
                            <span class="inline-block">
                                <i class="fas fa-location-crosshairs mr-1"></i> Getting your location...
                            </span>`;
                        
                        navigator.geolocation.getCurrentPosition(
                            // Success callback
                            function(position) {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                
                                // Update maps with user location
                                window.Map.setView([lat, lng], 10);
                                window.heatmapMap.setView([lat, lng], 10);
                                
                                // Fetch AQI for user location
                                fetchLocationName(lat, lng).then(region => {
                                    fetchUserLocationAQI(lat, lng, region);
                                    handleLocationSelect(lat, lng);
                                });
                            },
                            // Error callback
                            function(error) {
                                console.error("Error getting location:", error);
                                document.getElementById('user-location-aqi').innerHTML = `
                                    <span class="text-yellow-300">
                                        <i class="fas fa-exclamation-triangle mr-1"></i> 
                                        Unable to get your location. Please check your permissions.
                                    </span>`;
                            }
                        );
                    } else {
                        document.getElementById('user-location-aqi').innerHTML = `
                            <span class="text-yellow-300">
                                <i class="fas fa-exclamation-triangle mr-1"></i> 
                                Geolocation is not supported by your browser.
                            </span>`;
                    }
                }
                
                // Handle location selection (from map click or quick search)
                async function handleLocationSelect(lat, lng) {
                    try {
                        const region = await fetchLocationName(lat, lng);
                        
                        // Set map marker
                        if (window.currentMarker) {
                            window.Map.removeLayer(window.currentMarker);
                        }
                        window.currentMarker = L.marker([lat, lng]).addTo(window.Map);
                        window.currentMarker.bindPopup(`<b>${region}</b>`).openPopup();
                        
                        // Update UI
                        document.getElementById("info").innerHTML = `<p class='text-center'>Fetching air quality data for ${region}...</p>`;
                        
                        // Fetch data
                        await fetchAirQuality(lat, lng, region);
                        
                        // Store current region for bookmark feature
                        currentSelectedRegion = {
                            name: region,
                            lat: lat,
                            lng: lng
                        };
                        
                        // Show bookmark section
                        document.getElementById('bookmark-section').classList.remove('hidden');
                        
                        // Check if location is already bookmarked
                        const isBookmarked = bookmarkedLocations.some(loc => 
                            loc.lat === lat && loc.lng === lng
                        );
                        
                        const bookmarkBtn = document.getElementById('bookmarkLocation');
                        if (isBookmarked) {
                            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark mr-1"></i> Bookmarked';
                            bookmarkBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                            bookmarkBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
                        } else {
                            bookmarkBtn.innerHTML = '<i class="far fa-bookmark mr-1"></i> Bookmark This Location';
                            bookmarkBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
                            bookmarkBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                        }
                        
                        // Update charts with real data
                        fetchHistoricalData(lat, lng);
                        
                    } catch (error) {
                        document.getElementById("info").innerHTML = `<p class='text-red-600 dark:text-red-400'>Failed to fetch location data: ${error.message}</p>`;
                    }
                }
                
                // Fetch location name from coordinates
                async function fetchLocationName(lat, lng) {
                    try {
                        let response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                        if (!response.ok) throw new Error('Location lookup failed');
                        
                        let locationData = await response.json();
                        return locationData.display_name || 'Unknown location';
                    } catch (error) {
                        console.error("Error fetching location name:", error);
                        return "Unknown location";
                    }
                }
                
                function getColorFromAQI(aqi) {
                    if (aqi <= 50) return "#009966";        // Good - Green
                    else if (aqi <= 100) return "#ffde33";  // Moderate - Yellow
                    else if (aqi <= 150) return "#ff9933";  // Unhealthy for Sensitive Groups - Orange
                    else if (aqi <= 200) return "#cc0033";  // Unhealthy - Red
                    else if (aqi <= 300) return "#660099";  // Very Unhealthy - Purple
                    else return "#7e0023";                  // Hazardous - Maroon
                }

                // Fetch AQI for user's current location
                async function fetchUserLocationAQI(lat, lng, region) {
                    try {
                        let response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${apiKey}`);
                        if (!response.ok) throw new Error('AQI API request failed');
                        
                        let data = await response.json();

                        if (data.status === "ok") {
                            let aqi = data.data.aqi;
                            let condition = getAQICondition(aqi);
                            let color = getColorFromAQI(aqi);
                            
                            document.getElementById('user-location-aqi').innerHTML = `
                                <i class="fas fa-map-marker-alt mr-1"></i> 
                                Your Location: <strong>${region.split(',')[0]}</strong> | 
                                Current AQI: <strong style="color:${color}">${aqi}</strong> 
                                (<span style="color:${color}">${condition.label}</span>)
                            `;
                        } else {
                            document.getElementById('user-location-aqi').innerHTML = `
                                <i class="fas fa-map-marker-alt mr-1"></i> 
                                Your Location: <strong>${region.split(',')[0]}</strong> | 
                                AQI: <span class="text-yellow-300">Data unavailable</span>
                            `;
                        }
                    } catch (error) {
                        document.getElementById('user-location-aqi').innerHTML = `
                            <i class="fas fa-map-marker-alt mr-1"></i> 
                            Your Location: <strong>${region.split(',')[0]}</strong> | 
                            <span class="text-red-300">Error loading AQI data</span>
                        `;
                    }
                }

                // Fetch historical data for charts
                async function fetchHistoricalData(lat, lng) {
                    // In a real implementation, you would fetch actual historical data
                    // This is a simulation with random data based on current AQI
                    try {
                        let response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${apiKey}`);
                        if (!response.ok) throw new Error('AQI API request failed');
                        
                        let data = await response.json();

                        if (data.status === "ok") {
                            let currentAQI = data.data.aqi;
                            
                            // Generate random historical data based on current AQI
                            const historicalData = [];
                            for (let i = 0; i < 7; i++) {
                                // Random variation between +/-25% of current AQI
                                const randomFactor = 0.75 + (Math.random() * 0.5);
                                historicalData.push(Math.round(currentAQI * randomFactor));
                            }
                            
                            // Update AQI trend chart
                            window.aqiTrendChart.data.datasets[0].data = historicalData;
                            window.aqiTrendChart.update();
                            
                            // Update pollutant chart if data available
                            if (data.data.iaqi) {
                                const pollutants = {
                                    'pm25': data.data.iaqi.pm25?.v || 0,
                                    'pm10': data.data.iaqi.pm10?.v || 0,
                                    'no2': data.data.iaqi.no2?.v || 0,
                                    'so2': data.data.iaqi.so2?.v || 0,
                                    'o3': data.data.iaqi.o3?.v || 0,
                                    'co': data.data.iaqi.co?.v || 0
                                };
                                
                                window.pollutantChart.data.datasets[0].data = [
                                    pollutants.pm25,
                                    pollutants.pm10,
                                    pollutants.no2,
                                    pollutants.so2,
                                    pollutants.o3,
                                    pollutants.co
                                ];
                                window.pollutantChart.update();
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching historical data:", error);
                    }
                }
                
                // Save bookmark to local storage
                function saveBookmark(location) {
                    // Check if already bookmarked
                    const exists = bookmarkedLocations.some(loc => 
                        loc.lat === location.lat && loc.lng === location.lng
                    );
                    
                    if (!exists) {
                        bookmarkedLocations.push(location);
                        localStorage.setItem('bookmarkedLocations', JSON.stringify(bookmarkedLocations));
                        showToast(`${location.name.split(',')[0]} has been added to your bookmarks!`);
                        
                        // Update button state
                        const bookmarkBtn = document.getElementById('bookmarkLocation');
                        bookmarkBtn.innerHTML = '<i class="fas fa-bookmark mr-1"></i> Bookmarked';
                        bookmarkBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
                        bookmarkBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
                    } else {
                        // If already bookmarked, remove it
                        bookmarkedLocations = bookmarkedLocations.filter(loc => 
                            !(loc.lat === location.lat && loc.lng === location.lng)
                        );
                        localStorage.setItem('bookmarkedLocations', JSON.stringify(bookmarkedLocations));
                        showToast(`${location.name.split(',')[0]} has been removed from your bookmarks.`);
                        
                        // Update button state
                        const bookmarkBtn = document.getElementById('bookmarkLocation');
                        bookmarkBtn.innerHTML = '<i class="far fa-bookmark mr-1"></i> Bookmark This Location';
                        bookmarkBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
                        bookmarkBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
                    }
                }
                function getRecommendedActions(aqi) {
                    if (aqi <= 50) {
                        return "Enjoy outdoor activities and fresh air.";
                    } else if (aqi <= 100) {
                        return "Limit prolonged outdoor exertion, especially for sensitive groups.";
                    } else if (aqi <= 200) {
                        return "Avoid outdoor activities. Use masks if needed.";
                    } else if (aqi <= 300) {
                        return "Stay indoors with windows closed. Use air purifiers.";
                    } else {
                        return "Stay indoors, wear N95 masks if going out, and consult a doctor if symptoms appear.";
                    }
                }

                async function fetchAirQuality(lat, lng, region) {
                    try {
                        let response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${apiKey}`);
                        if (!response.ok) throw new Error('AQI API request failed');
                        
                        let data = await response.json();

                        if (data.status === "ok") {
                            let aqi = data.data.aqi;
                            let condition = getAQICondition(aqi);
                            let color = getColorFromAQI(aqi);
                            
                            let lastUpdate = new Date(data.data.time.v * 1000).toLocaleString();
                            
                            document.getElementById("info").innerHTML = `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p><strong>Region:</strong> ${region}</p>
                                        <p><strong>AQI:</strong> <span style="color:${color}; font-weight:bold;">${aqi} (${condition.label})</span></p>
                                        <p><strong>Last Updated:</strong> ${lastUpdate}</p>
                                        <p><strong>Dominant Pollutant:</strong> ${data.data.dominentpol || 'Not available'}</p>
                                    </div>
                                    <div>
                                        <p><strong>Possible Health Issues:</strong> ${condition.diseases}</p>
                                        <p><strong>Precautions:</strong> ${condition.precautions}</p>
                                        <p><strong>Recommended Actions:</strong> ${getRecommendedActions(aqi)}</p>
                                    </div>
                                </div>`;
                        } else {
                            document.getElementById("info").innerHTML = `
                                <p class='text-red-600 dark:text-red-400 text-center'>
                                    <i class="fas fa-exclamation-circle mr-1"></i>
                                    No air quality data available for ${region}.
                                </p>
                                <p class='text-center mt-2'>
                                    This might be due to no monitoring stations in this area or temporary service disruption.
                                </p>`;
                        }
                    } catch (error) {
                        document.getElementById("info").innerHTML = `
                            <p class='text-red-600 dark:text-red-400 text-center'>
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Failed to fetch data: ${error.message}
                            </p>`;
                    }
                }

                async function fetchAirPollution(lat, lng, region) {
                    try {
                        let response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=${apiKey}`);
                        if (!response.ok) throw new Error('Pollution API request failed');
                        
                        let data = await response.json();

                        if (data.status === "ok") {
                            let aqi = data.data.aqi;
                            let condition = getAQICondition(aqi);
                            let color = getColorFromAQI(aqi);
                            
                            // Format pollutants in a more readable way
                            let pollutantsHtml = "";
                            const pollutantNames = {
                                'pm25': 'PM2.5 Particles',
                                'pm10': 'PM10 Particles',
                                'no2': 'Nitrogen Dioxide',
                                'so2': 'Sulfur Dioxide',
                                'o3': 'Ozone',
                                'co': 'Carbon Monoxide',
                                'h': 'Humidity',
                                't': 'Temperature',
                                'w': 'Wind Speed',
                                'p': 'Pressure',
                                'dew': 'Dew Point'
                            };
                            
                            // Create formatted pollutants display
                            if (data.data.iaqi) {
                                Object.keys(data.data.iaqi).forEach(key => {
                                    if (pollutantNames[key]) {
                                        const value = data.data.iaqi[key].v;
                                        let unit = "";
                                        
                                        // Add appropriate units
                                        if (key === 't') unit = "°C";
                                        else if (key === 'h') unit = "%";
                                        else if (key === 'p') unit = "hPa";
                                        else if (key === 'w') unit = "m/s";
                                        else if (key === 'pm25' || key === 'pm10' || key === 'so2' || key === 'no2' || key === 'o3') unit = "µg/m³";
                                        else if (key === 'co') unit = "mg/m³";
                                        
                                        // Color code for pollutants
                                        let valueClass = "";
                                        if (key === 'pm25' || key === 'pm10' || key === 'so2' || key === 'no2' || key === 'o3' || key === 'co') {
                                            // Basic thresholds (would need proper thresholds for each pollutant)
                                            if (value < 20) valueClass = "text-green-600 dark:text-green-400";
                                            else if (value < 50) valueClass = "text-yellow-600 dark:text-yellow-400";
                                            else if (value < 100) valueClass = "text-orange-600 dark:text-orange-400";
                                            else valueClass = "text-red-600 dark:text-red-400";
                                        }
                                        
                                        pollutantsHtml += `
                                            <div class="p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                                <strong>${pollutantNames[key]}:</strong> 
                                                <span class="${valueClass}">${value}${unit}</span>
                                            </div>`;
                                    }
                                });
                            }
                            
                            // If no pollutants data is available
                            if (pollutantsHtml === "") {
                                pollutantsHtml = "No detailed pollutant data available";
                            }
                            
                            document.getElementById("pollution-info").innerHTML = `
                                <p><strong>Region:</strong> ${region}</p>
                                <p><strong>AQI:</strong> ${aqi} (<span style="color:${color}; font-weight:bold;">${condition.label}</span>)</p>
                                <div class="mt-2"><strong>Pollutants:</strong></div>
                                <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">${pollutantsHtml}</div>
                                <p class="mt-2"><strong>Precautions:</strong> ${condition.precautions}</p>`;
                        } else {
                            document.getElementById("pollution-info").innerHTML = `<p class='text-red-600 dark:text-red-400'>No data available for ${region}.</p>`;
                        }
                    } catch (error) {
                        document.getElementById("pollution-info").innerHTML = `<p class='text-red-600 dark:text-red-400'>Failed to fetch data: ${error.message}</p>`;
                    }
                }

                function getAQICondition(aqi) {
                    if (aqi <= 50) return { label: "Good", diseases: "None", precautions: "No precautions needed" };
                    if (aqi <= 100) return { label: "Moderate", diseases: "Minor irritations", precautions: "Stay hydrated, limit outdoor activities" };
                    if (aqi <= 200) return { label: "Unhealthy for Sensitive Groups", diseases: "Allergies, Asthma", precautions: "Use air purifiers, avoid prolonged outdoor exposure" };
                    if (aqi <= 300) return { label: "Unhealthy", diseases: "Breathing Issues, Coughing", precautions: "Wear masks, avoid outdoor activities" };
                    if (aqi <= 400) return { label: "Very Unhealthy", diseases: "Asthma, Bronchitis", precautions: "Stay indoors, use air purifiers" };
                    return { label: "Hazardous", diseases: "Severe respiratory issues", precautions: "Stay indoors, wear masks, seek medical help" };
                }
                
                function getHeatMapColor(aqi) {
                    if (aqi <= 50) return "#00e400"; // Good - Green
                    if (aqi <= 100) return "#ffff00"; // Moderate - Yellow
                    if (aqi <= 200) return "#ff7e00"; // Unhealthy for Sensitive Groups - Orange
                    if (aqi <= 300) return "#ff0000"; // Unhealthy - Red
                    if (aqi <= 400) return "#8f3f97"; // Very Unhealthy - Purple
                    return "#7e0023"; // Hazardous - Maroon
                }

                function analyzeSymptoms() {
                    const symptomsText = document.getElementById('symptoms').value;
                    if (!symptomsText.trim()) {
                        document.getElementById('symptomResult').innerHTML = "Please enter your symptoms";
                        return;
                    }
                    
                    // Simple symptom analysis logic
                    const symptoms = symptomsText.toLowerCase();
                    let result = "Based on your symptoms and current air quality:<br>";
                    
                    if (symptoms.includes("cough") || symptoms.includes("breathing") || symptoms.includes("asthma")) {
                        result += "- You may be experiencing respiratory issues related to air pollution<br>";
                        result += "- Recommendation: Stay indoors, use air purifiers, and consult a doctor if symptoms persist<br>";
                    }
                    
                    if (symptoms.includes("eye") || symptoms.includes("irritation") || symptoms.includes("itchy")) {
                        result += "- Eye irritation is common during high pollution days<br>";
                        result += "- Recommendation: Use eye drops, avoid rubbing eyes, and limit outdoor exposure<br>";
                    }
                    
                    if (symptoms.includes("headache") || symptoms.includes("dizzy") || symptoms.includes("fatigue")) {
                        result += "- Headaches and fatigue can be triggered by certain air pollutants<br>";
                        result += "- Recommendation: Stay hydrated, rest in clean air environments, and consider using an air purifier<br>";
                    }
                    
                    if (!result.includes("-")) {
                        result += "No specific air quality related issues identified from your symptoms. If you're concerned, please consult a healthcare professional.";
                    }
                    
                    document.getElementById('symptomResult').innerHTML = result;
                }

                async function fetchGlobalAQIData(map, heatmapMap) {
                    try {
                        // Major cities to show as examples
                        const majorCities = [
                            {name: "Delhi", lat: 28.6139, lng: 77.2090},
                            {name: "Mumbai", lat: 19.0760, lng: 72.8777},
                            {name: "Bangalore", lat: 12.9716, lng: 77.5946},
                            {name: "Kolkata", lat: 22.5726, lng: 88.3639}
                        ];
                        
                        // Add markers for these cities on both maps
                        for(const city of majorCities) {
                            // Add markers to AQI map
                            const marker = L.marker([city.lat, city.lng]).addTo(map);
                            marker.bindPopup(`<b>${city.name}</b><br>Click to see air quality`);
                            
                            marker.on('click', function() {
                                fetchAirQuality(city.lat, city.lng, city.name);
                            });
                            
                            // Add markers to pollution heatmap
                            const heatMarker = L.marker([city.lat, city.lng]).addTo(heatmapMap);
                            heatMarker.bindPopup(`<b>${city.name}</b><br>Click to see pollution details`);
                            
                            heatMarker.on('click', function() {
                                fetchAirPollution(city.lat, city.lng, city.name);
                            });
                        }
                    } catch (error) {
                        console.error("Error fetching global AQI data:", error);
                    }
                }
        