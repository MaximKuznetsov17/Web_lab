const { DB_CONNECTION } = require('./utils/constants')
const mongoose = require('mongoose')

const weatherSchema = mongoose.Schema({
    city: {
        type: String,
        required: true
    }
})

const Weather = mongoose.model("Weather", weatherSchema)

async function connectToDb() {
    await mongoose.connect(DB_CONNECTION, {
        useNewUrlParser: true,
        useFindAndModify: false
    })
}

module.exports = {
    connectToDb: connectToDb,
    Weather: Weather
}