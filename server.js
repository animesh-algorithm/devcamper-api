const express = require('express')
const dotenv = require('dotenv')
const bootcamps = require('./routes/bootcamps')
// const logger = require('./middleware/logger')
const morgan = require('morgan')

dotenv.config({
    path: './config/config.env'
})

const app = express()

// app.use(logger)

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

app.use('/api/v1/bootcamps', bootcamps)

const PORT = process.env.PORT || 5000

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))