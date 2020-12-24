global.fetch = require('node-fetch')
const mocha = require('mocha')
const chai = require('chai')
const sinon = require('sinon')
const fs = require('fs')
const fetchMock = require('fetch-mock')

const { expect } = chai
const { mock, stub } = sinon

const indexHtml = fs.readFileSync('public/index.html', { encoding: 'utf8', flag: 'r' })
const { JSDOM } = require('jsdom')
global.document = new JSDOM(indexHtml).window.document
global.window = new JSDOM(indexHtml).window
global.window.alert = new JSDOM(indexHtml).window.alert
global.alert = (msg) => { console.log(msg) }
global.navigator = {
    geolocation: {
        getCurrentPosition: (success, err, options) => {
            let position = {
                'timestamp': 1421093714138,
                'coords':
                {
                    'longitude': 82.93,
                    'latitude': 55.04
                }
            }
            success(position)
        }
    }
}

const defaultResponse = JSON.parse(fs.readFileSync('./tests/resources/test_response.json', 'utf8'))
const errorResponse = JSON.parse(fs.readFileSync('./tests/resources/error_response.json', 'utf8'))
const favoritesResponse = JSON.parse(fs.readFileSync('./tests/resources/favorites_response.json', 'utf8'))
const successResponse = { success: true }
fetchMock.get(encodeURI(`http://localhost:3000/weather/city?q=Paris`), defaultResponse, {overwriteRoutes: true})
fetchMock.get(encodeURI(`http://localhost:3000/weather/coordinates?lat=55.04&lon=82.93`), defaultResponse, {overwriteRoutes: true})
fetchMock.get(encodeURI(`http://localhost:3000/weather/favourites`), favoritesResponse, {overwriteRoutes: true})
fetchMock.delete(encodeURI(`http://localhost:3000/weather/favourites?q=Paris`), successResponse, {overwriteRoutes: true})
fetchMock.post(encodeURI(`http://localhost:3000/weather/favourites`), successResponse, {overwriteRoutes: true})

const {
    getWeatherByUrl,
    removeCityFromDb,
    deleteCity,
    addCityInDb,
    updateWeatherInMyLocation,
    loadCity,
    getLocation,
    isCityExist,
    addCity,
    getWeatherByCityName,
    getWeatherByGeolocation,
    getFavouritesCityFromDb,
} = require('../public/script')

describe('Frontend tests', () => {
    describe('Get weather by url', () => {
        it('Should get, because correct url', async () => {
            const url = 'http://localhost:3000/weather/city?q=Paris'
            const result = await getWeatherByUrl(url)
            expect(result).to.deep.equal(defaultResponse)
        })
        it('Should failed, because invalid url', async () => {
            fetchMock.get('http://localhost:3001/weather/city?q=Paris', { status: 400, body: errorResponse }, {overwriteRoutes: true})
            const url = 'http://localhost:3001/weather/city?q=Paris'
            const result = await getWeatherByUrl(url)
            expect(result).to.be.an('undefined')
        })
    })
    describe('Get weather by city name', () => {
        it('Should get, because correct city name', async () => {
            const cityName = 'Paris'
            const result = await getWeatherByCityName(cityName)
            expect(result).to.deep.equal(defaultResponse)
        })
        it('Should not get, because invalid city name', async () => {
            fetchMock.get(encodeURI(`http://localhost:3000/weather/city?q=InvalidName`), { status: 400, body: errorResponse }, {overwriteRoutes: true})
            const cityName = 'InvalidName'
            const result = await getWeatherByCityName(cityName)
            expect(result).to.be.an('undefined')
        })
    })
    describe('Remove city from DB by city name', () => {
        it('Should delete, because correct city name', async () => {
            const cityName = 'Paris'
            const result = await removeCityFromDb(cityName)
            expect(result).to.have.property('success', true)
        })
        it('Should not delete, because invalid city name', async () => {
            fetchMock.delete(encodeURI(`http://localhost:3000/weather/favourites?q=123123123`), { status: 400, body: errorResponse }, {overwriteRoutes: true})
            const cityName = '123123123'
            const result = await removeCityFromDb(cityName)
            expect(result).to.deep.equal(errorResponse)
        })
    })
    describe('Add city in DB by city name', () => {
        it('Should add, because correct city name', async () => {
            const cityName = 'Paris'
            const result = await addCityInDb(cityName)
            expect(result).to.have.property('success', true)
        })
        it('Should not add, because invalid city name', async () => {
            fetchMock.post(encodeURI(`http://localhost:3000/weather/favourites`), { status: 400, body: errorResponse }, {overwriteRoutes: true})
            const cityName = null
            const result = await addCityInDb(cityName)
            expect(result).to.deep.equal(errorResponse)
        })
    })
    describe('Get favorite cities from DB', () => {
        it('Should get, because correct request', async () => {
            const result = await getFavouritesCityFromDb()
            expect(result).to.deep.equal(favoritesResponse)
        })
        it('Should get favorite, because correct request with empty db storage', async () => {
            fetchMock.get(encodeURI(`http://localhost:3000/weather/favourites`), [], {overwriteRoutes: true})
            const result = await getFavouritesCityFromDb()
            expect(result).to.deep.equal([])
        })
        it('Should not get favorite, because invalid request', async () => {
            fetchMock.get(encodeURI(`http://localhost:3000/weather/favourites`), { status: 400, body: errorResponse}, {overwriteRoutes: true})
            const result = await getFavouritesCityFromDb()
            expect(result).to.deep.equal(errorResponse)
        })
    })
    describe('Get weather by geolocation', () => {
        it('Should get, because geolocation is correct', async () => {
            const result = await getWeatherByGeolocation()
            expect(result).to.deep.equal(defaultResponse)
        })
    })
    describe('Add city method', () => {
        it('Should not add, because city variable is empty', async () => {
            const cityName = ''
            const result = await addCity(cityName)
            expect(result).to.be.an('undefined')
        })
        it('Should not add, because city already exist in favourites', async () => {
            fetchMock.get(encodeURI(`http://localhost:3000/weather/favourites`), favoritesResponse, {overwriteRoutes: true})
            const cityName = 'Paris'
            const result = await addCity(cityName)
            expect(result).to.be.an('undefined')
        })
        it('Should not add, because city name is invalid', async () => {
            fetchMock.get(encodeURI(`http://localhost:3000/weather/favourites`), favoritesResponse, {overwriteRoutes: true})
            fetchMock.get(encodeURI(`http://localhost:3000/weather/city?q=1231356`), { status: 400, body: errorResponse}, {overwriteRoutes: true})
            const cityName = '1231356'
            const result = await addCity(cityName)
            expect(result).to.be.an('undefined')
        })
    })
}) 