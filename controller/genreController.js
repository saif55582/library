var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

// Display list of all Genre
exports.genre_list = function(req, res, next) {
    Genre.find()
    .sort([['name','ascending']])
    .exec(function(err, list_genre) {
        if(err) {
            return next(err);
        }
        res.render('genre_list', {
            title: 'Genre List',
            genre_list: list_genre
        });

    });

};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre':req.params.id})
                .exec(callback);
        }
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if(results.genre==null) { //if no result
            var err = new Error('Genre Not found');
            err.status = 404;
            return next(err);
        }
        // Success, so render
        res.render('genre_detail', {
            title: 'Genre Detail',
            genre: results.genre,
            genre_books: results.genre_books
        });
    });
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', {
        title: 'Create Genre'
    });
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res, next) {
    //check that the name field is not empty
    req.checkBody('name', 'Gener name is required').notEmpty();

    //trim and escape the field
    req.sanitize('name').escape();
    req.sanitize('name').trim();

    //Run the validator
    var errors = req.validationErrors();

    //Create a genre object with escaped and trimed data
    var genre = new Genre(
        {
            name: req.body.name
        }
    );

    if(errors) {
        res.render('genre_form', {
            title: 'Create Genre',
            genre: genre,
            errors: errors        
        });
    return;
    }
    else {
        //now data from form is valid
        //check if genre name already exists
        Genre.findOne({'name':req.body.name})
            .exec( function(err, found_genre){
                console.log('found-genre'+found_genre);
                if(err) {
                    return next(err);
                }
                if(found_genre){
                    //Genre exists redirect to its detail page
                    res.redirect(found_genre.url);
                }
                else {
                    genre.save( function(err) {
                        if(err) {
                            return next(err);
                        }
                        res.redirect(genre.url);
                    });
                }
            });
    }
};

// Display Genre delete form on GET
exports.genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },
        book_list: function(callback) {
            Book.find({'genre':req.params.id})
                .populate('authors')
                    .exec(callback)
        }
    }, function(err, results) {
        if(err) { return next(err); }
        res.render('genre_delete', {
            title: 'Genre Delete',
            genre: results.genre,
            book_list: results.book_list
        })
    })
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res) {
    req.checkBody('genreid', 'Id is required').notEmpty();

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid)
                .exec(callback);
        },
        book_list: function(callback) {
            Book.find({'genre':req.body.genreid})
                .exec(callback);
        }
    }, function(err, results) {
        if(results.book_list.length > 0){
            res.render('genre_delete', {
                title: 'Genre Delete',
                genre: results.genre,
                book_list: results.book_list
            });
        } 
        else {
            Genre.findByIdAndRemove(req.body.genreid,function(err) {
                if(err) {return next(err); }
                res.redirect('/catalog/genres');
            })
        }
    });
};

// Display Genre update form on GET
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};