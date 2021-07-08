const nodeGeoCoder = require('node-geocoder')

const geocoder = nodeGeoCoder({
    provider: 'mapquest',
    httpAdapter: 'https',
    apiKey: 'LFyYi9ArKwiXOGrTWHzu7EO82TBIDPoR',
    formatter: null
})

module.exports = geocoder