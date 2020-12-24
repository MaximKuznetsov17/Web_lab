global.fetch = require("node-fetch")

async function getWeatherByUrl(url) {
    try {
        let response = await fetch(encodeURI(url))
        return response
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    getWeatherByUrl: getWeatherByUrl
}