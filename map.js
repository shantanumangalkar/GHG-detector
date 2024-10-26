$(document).ready(function () {
    const map = L.map('map').setView([20, 0], 2); // Default center point

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let cityMarker;
    let emissionCircle;

    document.getElementById('search-btn').addEventListener('click', () => {
        const cityName = document.getElementById('city-input').value;

        // Fetch city geolocation
        fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const lat = data[0].lat;
                    const lon = data[0].lon;

                    map.setView([lat, lon], 13);

                    if (cityMarker) {
                        map.removeLayer(cityMarker);
                    }
                    cityMarker = L.marker([lat, lon]).addTo(map).bindPopup(cityName).openPopup();

                    const apiKey = '99a6ee308f0c9c9ef4d789bbb674a152'; // Replace with your OpenWeather API Key
                    return { lat, lon, request: fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`) };
                } else {
                    alert("City not found!");
                    throw new Error("City not found");
                }
            })
            .then(({ lat, lon, request }) => {
                return request.then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json().then(data => ({ data, lat, lon }));
                });
            })
            .then(({ data, lat, lon }) => {
                if (data) {
                    const aqi = data.list[0].main.aqi;
                    const gases = data.list[0].components; // Contains concentrations of gases
                    const co2 = gases.co; // Carbon monoxide
                    const no2 = gases.no2; // Nitrogen dioxide
                    const o3 = gases.o3; // Ozone
                    const so2 = gases.so2; // Sulfur dioxide
                    const pm2_5 = gases.pm2_5; // PM2.5
                    const pm10 = gases.pm10; // PM10
                    const co = gases.co; // Carbon monoxide
                    
                    let emissions, color, rating;

                    switch (aqi) {
                        case 1:
                            emissions = 50;
                            color = 'lightgreen';
                            rating = "Good - Low Emissions";
                            break;
                        case 2:
                            emissions = 100;
                            color = 'yellow';
                            rating = "Fair - Moderate Emissions";
                            break;
                        case 3:
                            emissions = 150;
                            color = 'orange';
                            rating = "Moderate - Considerable Emissions";
                            break;
                        case 4:
                            emissions = 200;
                            color = 'red';
                            rating = "Poor - High Emissions";
                            break;
                        case 5:
                            emissions = 300;
                            color = 'darkred';
                            rating = "Very Poor - Very High Emissions";
                            break;
                        default:
                            emissions = 0;
                            color = 'gray';
                            rating = "Unknown - No Data Available";
                    }

                    if (emissionCircle) {
                        map.removeLayer(emissionCircle);
                    }

                    emissionCircle = L.circle([lat, lon], {
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.5,
                        radius: emissions * 20
                    }).addTo(map).bindPopup(`
                        <strong>Estimated GHG Emissions Level:</strong> ${emissions} tons<br>
                        <strong>Rating:</strong> ${rating}<br>
                        <strong>Gas Emissions:</strong><br>
                        CO₂: ${co2} µg/m³<br>
                        NO₂: ${no2} µg/m³<br>
                        O₃: ${o3} µg/m³<br>
                        SO₂: ${so2} µg/m³<br>
                        PM2.5: ${pm2_5} µg/m³<br>
                        PM10: ${pm10} µg/m³<br>
                    `);

                    // Add city marker back to the map
                    cityMarker.addTo(map);
                }
            })
            .catch(error => {
                console.error('Error fetching emissions data:', error);
            });
    });
});
