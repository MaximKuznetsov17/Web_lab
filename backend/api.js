const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const { API_KEY, BASE_URL } = require('./utils/constants')
const { getWeatherByUrl } = require('./utils/weatherApi')
const { Weather } = require('./dao')

function api(app) {
    app.get('/weather/city', async (req, res) => {
        try {
            const cityName = req.query.q;
            if (!cityName) {
                console.log('Parameter q for city name is empty or null')
                res.status(500).end()
                return
            }
            const url = `${BASE_URL}?key=${API_KEY}&q=${cityName}`
            const response = await getWeatherByUrl(url)
            if (response.ok) {
                const data = await response.json()
                if (data !== undefined) {
                    res.json(data)
                } else {
                    res.status(404).end()
                }
            } else {
                res.status(response.status).end()
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
            if (!lat || !lon) {
                console.log('Some coordinates for getting city weather is empty or null')
                res.status(500).end()
                return
            }
            const url = `${BASE_URL}?key=${API_KEY}&q=${lat},${lon}`
            const response = await getWeatherByUrl(url)
            if (response.ok) {
                const data = await response.json()
                if (data !== undefined) {
                    res.json(data)
                } else {
                    res.status(404).end()
                }
            } else {
                res.status(response.status).end()
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
            let bo
            if (!req.body) {
                console.log('Body is empty or null')
                res.status(500).end()
                return
            }
            let city = req.body.city
            if (!city) {
                console.log('City name for add is empty or null')
                res.status(500).end()
                return
            }
            const weather = new Weather({
                city: req.body.city
            })
            weather.save()
                .then(data => {
                    res.json({ success: true })
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
            if (!cityName) {
                console.log('City name for delete is empty or null')
                res.status(500).end()
                return
            }
            Weather.findOneAndDelete({ city: cityName }, (err, data) => {
                if (!err) {
                    res.json({ success: true })
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
}

module.exports = api