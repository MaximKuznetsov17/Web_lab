const PORT = 3000
const BASE_URL = 'http://localhost:' + PORT + '/weather'
const SITE_PREFIX = 'https:'
const TEMP_POSTFIX = '°C'
const HUMIDITY_POSTFIX = '%'
const PRESSURE_POSTFIX = ' hpa'
const WIND_POSTFIX = 'm/s '
const DEFAULT_CITY = 'Saint-Petersburg'

async function getLocation() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((location) => resolve(location.coords), reject)
    })
}

async function addCityInDb(cityName) {
    let response = await fetch(`${BASE_URL}/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify({ "city": cityName })
    })
    if (!response.ok) {
        console.error('Can\'t add city. Error on server')
    }
    return await response.json()
}

async function removeCityFromDb(cityName) {
    let response = await fetch(`${BASE_URL}/favourites?q=${cityName}`, {
        method: 'DELETE'
    })
    if (!response.ok) {
        console.error('Can\'t remove city. Error on server')
    }
    return await response.json()
}

async function getFavouritesCityFromDb() {
    let response = await fetch(`${BASE_URL}/favourites`)
    if (!response.ok) {
        console.error('Can\'t get favorites cities from server')
    }
    return await response.json()
}

async function getWeatherByGeolocation() {
    let location = await getLocation()
    const url = `${BASE_URL}/coordinates?lat=${location.latitude}&lon=${location.longitude}`
    let weatherResponse = await getWeatherByUrl(url)
    return weatherResponse
}

async function getWeatherByCityName(cityName) {
    const url = `${BASE_URL}/city?q=${cityName}`
    let weatherResponse = await getWeatherByUrl(url)
    return weatherResponse
}

async function addCity(name) {
    if (name.length === 0) {
        alert("Поле ввода названия города пустое!")
        return
    }
    try {
        const favorites = await getFavouritesCityFromDb()
        if (!isCityExist(favorites, name)) {
            const weather = await loadCity(name)
            if (weather === undefined) {
                alert("Невозможно добавить город с именем " + name)
                return
            }
            addCityInDb(weather.location.name.toLowerCase())
        } else {
            alert("Такой город уже есть в избранном!")
            return
        }
    } catch (e) {
        console.error(e)
        alert("Невозможно добавить город с именем " + name)
    } finally {
        clearInput()
    }
}

function isCityExist(favorites, city) {
    for (let key in favorites) {
        if (favorites[key].city === city.toLowerCase()) {
            return true
        }
    }
    return false
}

async function loadCity(name) {
    const favoritesEl = document.getElementById('favorites')
    const loaderTemplate = document.getElementById('loader-template')
    const loader = document.importNode(loaderTemplate.content, true)
    const loaderEl = loader.children[0]
    favoritesEl.appendChild(loader)

    const weather = await getWeatherByCityName(name)
    if (weather !== undefined) {
        const template = document.getElementById('city-template')
        const city = document.importNode(template.content, true)
        const el = city.children[0]

        el.setAttribute('city-id', name.toLowerCase())
        el.querySelector('.delete-city-btn')
            .addEventListener('click', event => deleteCity(name))
        fillWeatherProperties(el, weather)
        fillWeatherHeader(el, weather)
        favoritesEl.removeChild(loaderEl)
        favoritesEl.appendChild(city)
    } else {
        favoritesEl.removeChild(loaderEl)
    }
    return weather
}

function clearInput() {
    document.getElementById("input-city").value = ''
}

async function updateWeatherInMyLocation() {
    const weatherHere = document.getElementById('weather-here')
    const weatherHeader = document.getElementById('weather-here-header')
    weatherHere.classList.add('onload')
    weatherHeader.classList.add('onload')
    document.getElementsByClassName('loader')[0].style['display'] = 'block'

    let weather
    try {
        weather = await getWeatherByGeolocation()
    } catch (e) {
        weather = await getWeatherByCityName(DEFAULT_CITY)
    }
    if (weather === undefined) {
        weatherHere.classList.remove('onload')
        weatherHeader.classList.remove('onload')
        document.getElementsByClassName('loader')[0].style['display'] = 'none'
        return
    }
    fillWeatherProperties(weatherHere, weather)
    fillWeatherHeader(weatherHeader, weather)

    weatherHere.classList.remove('onload')
    weatherHeader.classList.remove('onload')
    document.getElementsByClassName('loader')[0].style['display'] = 'none'
}

async function deleteCity(name) {
    const response = await removeCityFromDb(name.toLowerCase())
    if (response !== undefined) {
        const favoritesElement = document.getElementById('favorites')
        const city = favoritesElement.querySelector(`.city-weather[city-id="${name.toLowerCase()}"]`)
        if (city !== null) {
            favoritesElement.removeChild(city)
        }
    }
}

function fillWeatherProperties(el, weather) {
    el.querySelector('.weather-property .wind-velocity').textContent = weather.current.wind_kph + WIND_POSTFIX
    el.querySelector('.weather-property .wind-direction').textContent = weather.current.wind_dir
    el.querySelector('.weather-property .pressure').textContent = weather.current.pressure_mb + PRESSURE_POSTFIX
    el.querySelector('.weather-property .cloudiness').textContent = weather.current.condition.text
    el.querySelector('.weather-property .humidity').textContent = weather.current.humidity + HUMIDITY_POSTFIX
    el.querySelector('.weather-property .coord-lat').textContent = weather.location.lat
    el.querySelector('.weather-property .coord-lon').textContent = weather.location.lon
}

function fillWeatherHeader(el, weather) {
    el.querySelector('.city-name').textContent = weather.location.name
    el.querySelector('.weather-icon').src = SITE_PREFIX + weather.current.condition.icon
    el.querySelector('.city-temp').textContent = weather.current.temp_c + TEMP_POSTFIX
}

async function getWeatherByUrl(url) {
    try {
        let response = await fetch(url)
        if (response.ok) {
            let json = await response.json()
            return json
        }
    } catch (e) {
        alert('Ошибка сети!')
        console.error(e)
    }
}

function addCityEvent(event) {
    event.preventDefault()
    let cityInput = document.getElementById("input-city")
    addCity(cityInput.value)
}

window.addEventListener('load', async () => {
    for (const el of document.getElementsByClassName('update-btn')) {
        el.addEventListener('click', updateWeatherInMyLocation)
    }

    document.querySelector('.add-city-btn')
        .addEventListener('submit', addCityEvent)

    document.querySelector('.add-city-btn')
        .addEventListener('click', addCityEvent)

    const favorites = await getFavouritesCityFromDb()
    updateWeatherInMyLocation()
    for (let key in favorites) {
        loadCity(favorites[key].city)
    }
})