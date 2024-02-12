const express = require("express");
const path = require("path");
const collection = require("./config");
const Weather = require("./weather");
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const https = require("https");



const app = express();
// convert data into json format
app.use(express.json());
// Static file

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));


//use EJS as the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});


app.get("/myw", (req, res) => {
    res.render("index");
});

const connect = mongoose.connect("mongodb+srv://aruzhank:011004@cluster0.4ehiaul.mongodb.net/WeatherApp?retryWrites=true&w=majority");

// Check database connected or not
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch(() => {
    console.log("Database cannot be Connected");
})

// Register User
app.post("/signup", async (req, res) => {

    const data = {
        name: req.body.username,
        password: req.body.password
    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        // Hash the password using bcrypt
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
        console.log(userdata);
        res.render("login");
    }

});

// Login user 
app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ name: req.body.username });
        if (!check) {
            res.send("User name cannot found")
        }
        // Compare the hashed password from the database with the plaintext password
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if (!isPasswordMatch) {
            res.send("wrong Password");
        }
        else {
            res.render("home")
        }
    }
    catch {
        res.send("wrong Details");
    }
});

app.get("/weather", function (req, res) {
    const query = req.query.city;
    const openWeatherAPIKey = '60b8240b37de26d669f85964400fc3ae'; 
    const nasaAPIKey = 'DhLMKTY4NFl5DkUURjiSK12IEiGEkozTceECvWAG'; 
    const unit = "metric";

    const openWeatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${openWeatherAPIKey}&units=${unit}`;
    const openWeatherForecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${openWeatherAPIKey}&units=${unit}`;
    const nasaAPODURL = `https://api.nasa.gov/planetary/apod?api_key=${nasaAPIKey}`;
    const triviaURL = `https://opentdb.com/api.php?amount=1&category=9&difficulty=easy&type=multiple`;

    function fetchData(url, callback) {
        https.get(url, function (response) {
            let data = '';

            response.on("data", function (chunk) {
                data += chunk;
            });

            response.on("end", function () {
                const jsonData = JSON.parse(data);
                callback(jsonData);
            });
        });
    }

    fetchData(openWeatherURL, function (currentWeather) {
        const cityName = currentWeather.name;
        const temp = currentWeather.main.temp;
        const weatherDescription = currentWeather.weather[0].description;
        const icon = currentWeather.weather[0].icon;
        const imageURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        const coordinates = currentWeather.coord;
        const feelsLike = currentWeather.main.feels_like;
        const humidity = currentWeather.main.humidity;
        const pressure = currentWeather.main.pressure;
        const windSpeed = currentWeather.wind.speed;
        const countryCode = currentWeather.sys.country;

        fetchData(nasaAPODURL, function (apodJson) {
            const apodExplanation = apodJson.explanation;

            fetchData(triviaURL, function (triviaJson) {
                const question = triviaJson.results[0]?.question || 'No trivia available';
                fetchData(openWeatherForecastURL, function (forecastData) {
                    const rainVolume = forecastData.list[0]?.rain?.['3h'] || 0;

                const resultHTML = `
                    <div id="weatherResult">
                    <h2>Weather Information for ${cityName}</h2>
                    <p>Temperature: ${temp}°C</p>
                    <p>Feels Like: ${feelsLike}°C</p>
                    <p>Weather: ${weatherDescription}</p>
                    <p>Humidity: ${humidity}%</p>
                    <p>Pressure: ${pressure} hPa</p>
                    <p>Wind Speed: ${windSpeed} m/s</p>
                    <p>Country Code: ${countryCode}</p>
                    <p>Rain Volume (last 3 hours): ${rainVolume} mm</p>
                    <img src="${imageURL}" alt="Weather Icon">
                    </div>

                    <div id="apodResult">
                        <h2>APOD - Astronomy Picture of the Day</h2>
                        <p>${apodExplanation}</p>
                    </div>

                    <div id="triviaResult">
                        <h2>Trivia Question</h2>
                        <p>${question}</p>
                    </div>
                `;

                res.send(resultHTML);
            });
        });
        });
    Weather.create({
        city: cityName,
        temperature: temp,
    }).then(() => {
        res.render("weather.ejs", { cityName, temp });
    }).catch(error => {
        console.error(error);
        res.status(500).send("Error saving weather data");
    });

    });
});


// Define Port for Application
const port = 8000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});