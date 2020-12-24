const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const api = require('./api')
const { connectToDb } = require('./dao')
const { PORT } = require('./utils/constants')
const app = express()

app.use(cors())
app.use(bodyParser.json())

async function start() {
    try {
        connectToDb()
        app.listen(PORT, () => {
            console.log(`Server has been started on port ${PORT}`)
        })
    } catch (e) {
        console.log(e)
    }
}

start()
api(app)