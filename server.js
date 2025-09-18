const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());

// Middleware for JSON parsing
app.use(express.json());

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
    const { location } = req.query;
    
    // Validate location parameter
    if (!location) {
        return res.status(400).json({ 
            error: { message: 'Location parameter is required' } 
        });
    }

    try {
        const apiKey = process.env.WEATHER_API_KEY;
        
        // Check if API key exists
        if (!apiKey) {
            throw new Error('Weather API key not configured');
        }
        
        const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=yes`;
        
        console.log(`Fetching weather for: ${location}`);
        
        const response = await fetch(weatherUrl);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: Weather data not found`);
        }
        
        const weatherData = await response.json();
        
        // Log successful request
        console.log(`✅ Weather data fetched for ${weatherData.location.name}`);
        
        res.json(weatherData);
        
    } catch (error) {
        console.error('❌ Weather API Error:', error.message);
        
        // Send appropriate error response
        if (error.message.includes('no matching location found')) {
            res.status(404).json({ 
                error: { message: 'Location not found. Please check the spelling and try again.' } 
            });
        } else if (error.message.includes('API key')) {
            res.status(401).json({ 
                error: { message: 'Weather service temporarily unavailable' } 
            });
        } else {
            res.status(500).json({ 
                error: { message: 'Failed to fetch weather data. Please try again.' } 
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Server is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'WeatherVibe Backend API',
        endpoints: {
            weather: '/api/weather?location=cityname',
            health: '/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌤️  WeatherVibe backend server running on http://localhost:${PORT}`);
    console.log(`🔗 API endpoint: http://localhost:${PORT}/api/weather`);
    console.log(`💊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔑 API key loaded: ${process.env.WEATHER_API_KEY ? '✅ Yes' : '❌ No'}`);
});