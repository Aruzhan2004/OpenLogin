const express = require("express");
const path = require("path");
const collection = require("./src/config");
const Weather = require("./src/weather");
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const axios = require("axios");


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
    console.log(req.body)

    const data = {
        name: req.body.name,
        password: req.body.password
    }

    // Check if the username already exists in the database
    const existingUser = await collection.findOne({ name: data.name });

    if (existingUser) {
        res.send('User already exists. Please choose a different username.');
    } else {
        const saltRounds = 10; // Number of salt rounds for bcrypt
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword; // Replace the original password with the hashed one

        const userdata = await collection.insertMany(data);
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

    async function fetchData(url, callback) {
        const response = await axios.get(url).then((res) => callback(res.data));

    }

    fetchData(openWeatherURL, async function (currentWeather) {
        const apodExplanation = await axios.get(nasaAPODURL);
        const triviaQuestion = await axios.get(triviaURL);
        const rainVolume = await axios.get(openWeatherForecastURL);
        console.log("2222", triviaQuestion.data);
        const weatherData = {
            cityName: currentWeather.name,
            temp: currentWeather.main.temp,
            weatherDescription: currentWeather.weather[0].description,
            icon: currentWeather.weather[0].icon,
            imageURL: `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`,
            coordinates: currentWeather.coord,
            feelsLike: currentWeather.main.feels_like,
            humidity: currentWeather.main.humidity,
            pressure: currentWeather.main.pressure,
            windSpeed: currentWeather.wind.speed,
            countryCode: currentWeather.sys.country,
            apodExplanation: apodExplanation.data.explanation,
            triviaQuestion: triviaQuestion.data.results[0].question,
            // rainVolue: rainVolume.someData
        };
        


    Weather.create({
        city: weatherData.cityName,
        temperature: weatherData.temp,
    }).then(() => {
        res.render("weather.ejs", { weatherData });
    }).catch(error => {
        console.error(error);
        res.status(500).send("Error saving weather data");
    });

    });
});


// Define Port for Application
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
});