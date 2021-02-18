const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');

const { isLoggedIn } = require('./middleware');
const catchAsync = require('./utils/catchAsync');

const MongoDBStore = require('connect-mongo')(session);

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

const secret = 'thisissecret';

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("session store error", e);
});

const sessionConfig = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});



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
    let hasRating = false;
    let rating = 0;
    //console.log(req.user);
    if (req.user) {
        const user = await User.findById(req.user._id);
        for (let movie of user.movies) {
            if (movie.movieId == movieId) {
                hasRating = true;
                rating = movie.rating;
                break;
            }
        }
    }
    //console.log(hasRating, rating);
    res.render('show', { value, hasRating, rating });
});

app.post('/', isLoggedIn, async (req, res) => {
    const rating = req.body.rating;
    const movieId = req.body.movieId;
    //console.log(rating, movieId, req.user._id);
    const user = await User.findByIdAndUpdate(req.user._id, {});
    user.movies.push({ movieId, rating });
    await user.save();
    const values = await Movie.find({});
    res.render('home', { values });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', async (req, res) => {
    req.logout();
    const values = await Movie.find({});
    res.render('home', { values });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), async (req, res) => {
    const values = await Movie.find({});
    res.render('home', { values });
});

app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
        })
    } catch (err) {
        console.error(err.message);
    }
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

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 400));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong';
    res.status(statusCode).render('error', { err });
});


app.listen(3000, () => {
    console.log('Listening on port 3000');
});