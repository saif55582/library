var Author = require('../models/author');
var Book = require('../models/book');
var async = require('async');


//display list of all author
exports.author_list = function(req, res, next) {
    Author.find()
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
        if(err) {
            return next(err);
        }
        res.render('author_list', {
            title: 'Author List ',
            author_list: list_authors
        });
    });
};


// Display detail page for a specific Author
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id)
                .exec(callback)
        },
        author_books: function(callback) {
            Book.find({'author':req.params.id},'title summary')
                .exec(callback);
        }
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if(results.author==null) { //if no author found
            var err = new Error('No author found');
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author,
            author_books: results.author_books
        });
    });
};

// Display Author create form on GET
exports.author_create_get = function(req, res, next) {
    res.render('author_form', {
        title: 'Create Author'
    });
};

// Handle Author create on POST
exports.author_create_post = function(req, res, next) {
       
    req.checkBody('first_name', 'First Name is required').notEmpty();
    req.checkBody('family_name', 'Family Nam is required').notEmpty();
    req.checkBody('family_name', 'Family name must be alphanumeric text').isAlphanumeric();
    req.checkBody('date_of_birth', "Invalid Date").optional({checkFalsy: true}).isISO8601();
    req.checkBody('date_of_death', "Invalid Date").optional({checkFalsy: true}).isISO8601();

    req.sanitize('first_name').escape();
    req.sanitize('family_name').escape();
    req.sanitize('first_name').trim();
    req.sanitize('family_name').trim();

    //check for errors
    var errors = req.validationErrors();
    req.sanitize('date_of_birth').toDate();
    req.sanitize('date_of_death').toDate();

    var author = new Author(
        {
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        }
    );

    if(errors) {
        res.render('author_form', {
            title: 'Create Author',
            author: author,
            errors: errors
        });
    }
    else {
        author.save(function(err) {
            if(err) {
                return next(err);
            }
            res.redirect(author.url);
        });
    }

};

// Display Author delete form on GET
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        author_books: function(callback) {
            Book.find({'author':req.params.id}, callback);
        }
    }, function(err, results) {
        if(err) {return next(err); }
        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.author_books
        });
    });
};

// Handle Author delete on POST 
exports.author_delete_post = function(req, res, next) {
    req.checkBody('authorid','Id must not be empty').notEmpty();

    async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid)
                .exec(callback);
        },
        author_books: function(callback) {
            Book.find({'author':req.body.authorid})
                .exec(callback);
        }
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if(results.author_books.length > 0) {
            res.render('author_delete', {
                title: 'Delete Author',
                author: results.author,
                author_books: results.author_books
            });
        }
        else {
            Author.findByIdAndRemove(req.body.authorid, function(err) {
                if(err) { return next(err); }
                res.redirect('/catalog/authors');
            });
        }
    })
};

// Display Author update form on GET
exports.author_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update GET');
};

// Handle Author update on POST
exports.author_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Author update POST');
};