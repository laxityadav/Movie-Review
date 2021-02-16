const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const fetch = require('node-fetch');

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
    let keyword = req.query.search;
    if (!keyword) keyword = 'avengers';
    let url = ''.concat(baseURL, 'search/movie?api_key=', APIKEY, '&query=', keyword);
    const fetchResponse = await fetch(url);
    const data = await fetchResponse.json();
    const values = data.results;
    res.render('home', { values });
});

app.get('/movie/:id', async (req, res) => {
    const id = req.params.id;
    let url = `${baseURL}movie/${id}?api_key=${APIKEY}`;
    const fetchResponse = await fetch(url);
    const value = await fetchResponse.json();
    res.render('show', { value });
});


app.listen(3000, () => {
    console.log('Listening on port 3000');
});