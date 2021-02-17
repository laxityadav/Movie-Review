const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const Movie = require('./models/movie');

const dbUrl = 'mongodb://localhost:27017/movie-review';
mongoose.connect(dbUrl, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database Connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const APIKEY = '023cade36f62ae273a49c026b3be3b1e';
let baseURL = 'https://api.themoviedb.org/3/';

//Routes

app.get('/', async (req, res) => {
    const values = await Movie.find({});
    res.render('home', { values });
});

app.get('/abcd', async (req, res) => {
    // const keyword = 'piranha';
    // let url = ''.concat(baseURL, 'search/movie?api_key=', APIKEY, '&query=', keyword);
    // const fetchResponse = await fetch(url);
    // const data = await fetchResponse.json();
    // const value = data.results[0];
    // console.log(value);

    const ids = 43593;
    let url = `${baseURL}movie/${ids}?api_key=${APIKEY}`;
    const fetchResponse = await fetch(url);
    const value = await fetchResponse.json();

    const { id, title, tagline, vote_average, vote_count, release_date, budget, revenue, runtime, overview, poster_path } = value;
    const image = `${poster_path}`;
    //console.log(value);
    //console.log(id, title, tagline, vote_average, vote_count, release_date, budget, revenue, runtime);
    const movieId = id;
    const movie = new Movie({ movieId, title, tagline, vote_average, vote_count, release_date, budget, revenue, runtime, overview, image });
    await movie.save();
    res.render('home');
});

app.get('/show/:id', async (req, res) => {
    const movieId = req.params.id;
    const value = await Movie.findOne({ movieId });
    res.render('show', { value });
});

app.post('/', async (req, res) => {
    const rating = req.body.rating;
    const values = await Movie.find({});
    res.render('home', { values });
});

app.get('/search', async (req, res) => {
    let keyword = req.query.search;
    if (!keyword) keyword = 'avengers';
    let url = ''.concat(baseURL, 'search/movie?api_key=', APIKEY, '&query=', keyword);
    const fetchResponse = await fetch(url);
    const data = await fetchResponse.json();
    const values = data.results;
    res.render('search', { values });
});

app.get('/movie/:id', async (req, res) => {
    const id = req.params.id;
    let url = `${baseURL}movie/${id}?api_key=${APIKEY}`;
    const fetchResponse = await fetch(url);
    const value = await fetchResponse.json();
    res.render('showsearch', { value });
});




app.listen(3000, () => {
    console.log('Listening on port 3000');
});