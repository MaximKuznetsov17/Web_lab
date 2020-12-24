const PORT = process.env.PORT || 3000
const DB_CONNECTION = 'mongodb+srv://admin:adminadmin@weathercluster.yobnd.mongodb.net/weather'
const API_KEY = '53562889d1794973baa210845201610'
const BASE_URL = 'https://api.weatherapi.com/v1/current.json'

module.exports = {
    PORT: PORT,
    DB_CONNECTION: DB_CONNECTION,
    API_KEY: API_KEY,
    BASE_URL: BASE_URL
}