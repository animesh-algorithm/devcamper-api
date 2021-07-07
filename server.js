const express = require('express')
const dotenv = require('dotenv')
const bootcamps = require('./routes/bootcamps')
// const logger = require('./middleware/logger')
const morgan = require('morgan')
const connectDB = require('./config/db.js')

dotenv.config({
    path: './config/config.env'
})

connectDB()

const app = express()
// app.use(logger)

// Body Parser
app.use(express.json())

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

app.use('/api/v1/bootcamps', bootcamps)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))

// Handle unhandled rejection
// If database doesn't work we want our app to crash
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`)
    // Close server and exit process
    server.close(() => process.exit(1))
})