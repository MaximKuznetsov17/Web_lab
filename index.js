const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const fetch = require("node-fetch")
const cors = require('cors')

const PORT = process.env.PORT || 3000
const DB_CONNECTION = 'mongodb+srv://admin:adminadmin@weathercluster.yobnd.mongodb.net/weather'
const API_KEY = '53562889d1794973baa210845201610'
const BASE_URL = 'https://api.weatherapi.com/v1/current.json'
const app = express()

const weatherSchema = mongoose.Schema({
    city: {
        type: String,
        required: true
    }
})
const Weather = mongoose.model("Weather", weatherSchema)

app.use(cors())
app.use(bodyParser.json())

async function getWeatherByUrl(url) {
    try {
        let response = await fetch(encodeURI(url))
        if (response.ok) {
            let json = await response.json()
            return json
        }
    } catch (e) {
        console.log(e)
    }
}

async function start() {
    try {
        await mongoose.connect(DB_CONNECTION, {
            useNewUrlParser: true,
            useFindAndModify: false
        })
        app.listen(PORT, () => {
            console.log(`Server has been started on port ${PORT}`)
        })
    } catch (e) {
        console.log(e)
    }
}

//ROUTES
app.get('/', (req, res) => {
    res.send('Some message!')
})

app.get('/weather/city', async (req, res) => {
    try {
        const cityName = req.query.q;
        const url = `${BASE_URL}?key=${API_KEY}&q=${cityName}`
        const data = await getWeatherByUrl(url)
        if (data !== undefined) {
            res.json(data)
        } else {
            res.status(500).end()   
        }
    } catch (e) {
        console.log(e)
        res.status(500).end()
    }
})

app.get('/weather/coordinates', async (req, res) => {
    try {
        const lat = req.query.lat;
        const lon = req.query.lon;
        const url = `${BASE_URL}?key=${API_KEY}&q=${lat},${lon}`
        const data = await getWeatherByUrl(url)
        if (data !== undefined) {
            res.json(data)
        }
    } catch (e) {
        console.log(e)
        res.status(500).end()
    }
})

app.get('/weather/favourites', (req, res) => {
    try {
        Weather.find({}, (err, data) => {
            if (!err) {
                res.json(data)
            } else {
                console.log(err)
                res.status(500).end()
            }
        });
    } catch (e) {
        console.log(e)
        res.status(500).end()
    }
})

app.post('/weather/favourites', (req, res) => {
    try {
        const weather = new Weather({
            city: req.body.city
        })
        weather.save()
            .then(data => {
                res.json(data)
            })
            .catch(e => {
                console.log(e)
                res.status(500).end()
            })
    } catch (e) {
        console.log(e)
        res.status(500).end()
    }
})

app.delete('/weather/favourites', async (req, res) => {
    try {
        const cityName = req.query.q;
        Weather.findOneAndDelete({city: cityName}, (err, data) => {
            if (!err) {
                res.json(data)
            } else {
                console.log(err)
                res.status(500).end()
            }
        })
    } catch (e) {
        console.log(e)
        res.status(500).end()
    }
})

start()