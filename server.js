const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const fileupload = require('express-fileupload')
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
// const logger = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler')
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

// Cookie Parser
app.use(cookieParser())

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Express file upload
app.use(fileupload())

// Set Static folder
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use(errorHandler)
// Middleware has to be in linear order

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))

// Handle unhandled rejection
// If database doesn't work we want our app to crash
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`)
    // Close server and exit process
    server.close(() => process.exit(1))
})