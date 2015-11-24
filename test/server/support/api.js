var express = require('express')
var request = require('supertest')
var router = require('../../../server')

var app = exrpess()
app.use(router)

module.exports = request(app)