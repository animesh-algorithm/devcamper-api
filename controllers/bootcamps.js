const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const Bootcamp = require('../models/Bootcamp')
const path = require('path')

// @desc        Get ALL Bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query

    // Copy req.query
    const reqQuery = {  ...req.query }
    
    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    // Delete removeField from reqQuery 
    removeFields.forEach(param => delete reqQuery[param])

    // Create Query String
    let queryStr = JSON.stringify(reqQuery)
    
    // Creating mongoose operators
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

    // Finding Resource
    query = Bootcamp.find(JSON.parse(queryStr)).populate('courses')

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ')
        // console.log(fields)
        query = query.select(fields)
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10
    const startIndex = (page - 1) * limit
    const endIndex = page*limit
    const total = await Bootcamp.countDocuments()

    query = query.skip(startIndex).limit(limit)

    // Executing Query
    const bootcamps = await query

    // Pagination Result
    const pagination = {}

    if (endIndex < total) {
        pagination.next = {
            page: page+1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page-1,
            limit
        }
    }

    res.status(200).json({
        success: true,
        data: bootcamps,
        pagination,
        count: bootcamps.length,
    })

})

// @desc        Get a single Bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id).populate('courses')
    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404)
        )
    }
    res.status(200).json({
        success: true,
        data: bootcamp
    })

})

// @desc        Create a Bootcamp
// @route       POST /api/v1/bootcamps
// @access      Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body)
    res.status(201).json({
        success: true,
        data: bootcamp
    })  

})

// @desc        Update Bootcamp
// @route       PUT /api/v1/bootcamps/:id
// @access      Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!bootcamp) {
        // Make sure you return
        return next(
            new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404)
        )
    }
    res.status(200).json({
        success: true, data: bootcamp
    })

})

// @desc        Delete Bootcamps
// @route       DELETE /api/v1/bootcamps/:id
// @access      Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404)
        )
    }
    bootcamp.remove()
    res.status(200).json({
        success: true
    })

})

// @desc        GET Bootcamps withing radius
// @route       GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access      Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3963mi /6368 km
    const radius = distance / 3963
    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })
    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
})

// @desc        Upload photo for a bootcamp
// @route       PUT /api/v1/bootcamps/:id/photo
// @access      Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404)
        )
    }
    if (!req.files) {
        return next(
            new ErrorResponse(`Please upload a file`, 400)
        )
    }
    // console.log(req.files)
    const file = req.files.file

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please Upload an image file`, 400))
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`), 400)
    }

    // Create custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err)
            return next(
                new ErrorResponse(
                    `Problem with file upload`, 500
                )
            )
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, {
            photo: file.name
        })
    })
})