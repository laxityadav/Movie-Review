const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    movieId: Number,
    image: String,
    title: String,
    tagline: String,
    vote_average: Number,
    vote_count: Number,
    release_date: String,
    budget: Number,
    revenue: Number,
    runtime: Number,
    overview: String
});

module.exports = mongoose.model('Movie', MovieSchema);