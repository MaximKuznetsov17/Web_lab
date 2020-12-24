const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mocha = require('mocha')
const chai = require('chai')
const sinon = require('sinon')
const chaiHttp = require('chai-http')
const api = require('../backend/api')
const { API_KEY, BASE_URL } = require('../backend/utils/constants')
const fs = require('fs')
const fetchMock = require("fetch-mock")

const mongoose = require('mongoose')
const MockMongoose = require('mock-mongoose').MockMongoose
const mockMongoose = new MockMongoose(mongoose)

chai.use(chaiHttp)
const { describe, it } = mocha
const { request, expect } = chai

const app = express()
app.use(cors())
app.use(bodyParser.json())
api(app)

describe('REST API tests', () => {

    beforeEach(async () => {
        await mockMongoose.prepareStorage()
        const conn = await mongoose.connect("mongodb://example.com/TestingDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        conn.connection.db.dropDatabase()
    })

    after(async () => {
        await mockMongoose.killMongo()
    })

    // GET ROUTE 

    describe('GET /weather/city', () => {
        after(async () => {
            fetchMock.reset()
        })
        it('Should return 200, because city with name Paris exists', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/test_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}&q=Paris`), testResponse)
            request(app)
                .get('/weather/city?q=Paris')
                .end((err, response) => {
                    expect(response).to.have.status(200)
                    expect(response).to.be.json
                    expect(response.body).to.not.be.empty
                    expect(response.body).to.deep.equal(testResponse)
                    done()
                })
        })

        it('Should return 400, because city with name 123123 does not exist', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/error_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}&q=123123`), () => {
                return {
                    status: 400, 
                    body: testResponse
                }
            })
            request(app)
                .get('/weather/city?q=123123')
                .end((err, response) => {
                    expect(response).to.have.status(400)
                    done()
                })
        })

        it('Should return 500, because query parameter q was missed', (done) => {
            request(app)
                .get('/weather/city')
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })
    })

    describe('GET /weather/coordinates', () => {
        after(async () => {
            fetchMock.reset()
        })
        it('Should return 200, because city with coordinates [55.04, 82.93] exist', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/test_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}&q=55.04,82.93`), testResponse)
            request(app)
                .get('/weather/coordinates?lat=55.04&lon=82.93')
                .end((err, response) => {
                    expect(response).to.have.status(200)
                    expect(response).to.be.json
                    expect(response.body).to.not.be.empty
                    expect(response.body).to.deep.equal(testResponse)
                    done()
                })
        })

        it('Should return 500, because query parameters lat & lon were missed', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/miss_params_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}`), () => {
                return {
                    status: 400, 
                    body: testResponse
                }
            })
            request(app)
                .get('/weather/coordinates')
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })

        it('Should return 400, because query parameter lat was missed', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/miss_params_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}?q=,82.93`),  () => {
                return {
                    status: 400, 
                    body: testResponse
                }
            })
            request(app)
                .get('/weather/coordinates?lon=82.93')
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })

        it('Should return 400, because query parameter lon was missed', (done) => {
            const testResponse = JSON.parse(fs.readFileSync('./tests/resources/miss_params_response.json', 'utf8'))
            fetchMock.get(encodeURI(`${BASE_URL}?key=${API_KEY}?q=55.04`),  () => {
                return {
                    status: 400, 
                    body: testResponse
                }
            })
            request(app)
                .get('/weather/coordinates?lat=55.04')
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })
    })

    describe('GET /weather/favourites', () => {
        it('Should return 200, because list of favorite cities return ' +
            'by route /weather/favourites without params', (done) => {
                request(app)
                    .get('/weather/favourites')
                    .end((err, response) => {
                        expect(response).to.have.status(200)
                        expect(response).to.be.json
                        expect(response.body).to.deep.equal([])
                        done()
                    })
            })
    })

    // POST ROUTE 

    describe('POST /weather/favourites', () => {
        it('Should return 200 because city with name Paris was added in DB', (done) => {
            request(app)
                .post('/weather/favourites')
                .send({ city: 'Paris' })
                .end((err, response) => {
                    expect(response).to.have.status(200)
                    expect(response.body).to.have.property('success', true)
                    done()
                })
        })

        it('Should return 500 because body is empty', (done) => {
            request(app)
                .post('/weather/favourites')
                .send({})
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })

        it('Should return 500 because city value is empty', (done) => {
            request(app)
                .post('/weather/favourites')
                .send({ city: '' })
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })

    })

    // DELETE ROUTE 

    describe('DELETE /weather/favourites', () => {
        it('Should return 200', (done) => {
            request(app)
                .delete('/weather/favourites?q=Paris')
                .end((err, response) => {
                    expect(response).to.have.status(200)
                    expect(response.body).to.have.property('success', true)
                    done()
                })
        })

        it('Should return 500, because query parameter q was missed', (done) => {
            request(app)
                .delete('/weather/favourites')
                .end((err, response) => {
                    expect(response).to.have.status(500)
                    done()
                })
        })
    })
})