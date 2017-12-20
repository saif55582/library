var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');
var Author = require('../models/author');
var Genre = require('../models/genre');

var async = require('async');

exports.index = function(req, res, next) {
    async.parallel({
        book_count: function(callback) {
            Book.count(callback);
        },
        book_instance_count: function(callback) {
            BookInstance.count(callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.count({status: 'Available'}, callback);
        },
        author_count: function(callback) {
            Author.count(callback);
        },
        genre_count: function(callback) {
            Genre.count(callback);
        }
    }, function(err, result) {
        res.render('index', 
        {
            title: 'Library Managment System', 
            error: err, 
            data: result 
        });
    });
};

// Display list of all books
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
        if(err) {
            return next(err);
        }
        //success so render
        res.render('book_list', {title: 'Book List', book_list: list_books});
    });
};

// Display detail page for a specific book
exports.book_detail = function(req, res, next) {
    async.parallel({
       book: function(callback) {
        Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback)
       },
       book_instance: function(callback) {
        BookInstance.find({'book':req.params.id})
            .exec(callback)
       }
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if(results.book==null) { //if no book found for given id
            var err = new Error('No Book Found');
            err.status = 404;
            return next(err);
        }
        
        res.render('book_detail', {
            title: 'Book Detail',
            book: results.book,
            book_instance: results.book_instance
        });
    });
};

// Display book create form on GET
exports.book_create_get = function(req, res, next) {
    //Get all the authors and book used in book create form
    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genre: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if(err) { return next(err); }
        res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genre
        })
    });
};

// Handle book create on POST
exports.book_create_post = function(req, res, next) {
    
    req.checkBody('title', 'Title must not be empty').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

    //sanitizing data
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();

    //trimming data
    req.sanitize('title').trim();
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();

    //escaping genre as it may be single string or an array
    if(req.body.genre instanceof Array ) {
        req.body.genre = req.body.genre.map((gen)=> {
            req.body.tempGenre = gen;
            req.sanitize('tempGenre').escape();
            return req.body.tempGenre;
        });
        delete req.body.tempGenre;
    }
    else{
        req.sanitize('genre').escape();
    }

    var book = new Book( {
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined' ? [] : req.body.genre)
    });

    console.log(book);

    var errors = req.validationErrors();
    if(errors) {
        //some problem occured
        console.log('Genre '+ req.body.genre);

        console.log(errors);

        //get all authors and genre for form rendering
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if(err) {
                return next(err);
            }
            //mark out selected genre as checked
            // Mark our selected genres as checked
            for (let i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    //console.log('IS_IN_GENRES: '+results.genres[i].name);
                    results.genres[i].checked='true';
                    //console.log('ADDED: '+results.genres[i]);
                }
            }
            res.render('book_form', {
                title: 'Create Book',
                authors: results.authors,
                genres: results.genres,
                book: book,
                errors: errors
            });
        });
    }
    else{
        //Data from form is valid
        // we could check if book exists already, but lets just save

        book.save(function(err){
            if(err) {
                return next(err);
            }
            res.redirect(book.url);
        });
    }    
};

// Display book delete form on GET
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({'book':req.params.id})
                .exec(callback);
        }
    }, function(err, results) {
        res.render('book_delete',{
            title: 'Book Delete',
            book: results.book,
            book_instance: results.book_instance
        });
    });
};

// Handle book delete on POST
exports.book_delete_post = function(req, res) {
    req.checkBody('bookid','Id is required').notEmpty();

    async.parallel({
        book: function(callback) {
            Book.findById(req.body.bookid)
                .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({'book':req.body.bookid})
                .exec(callback);
        }
    }, function(err, results) {
        if(err) {
            return next(err);
        }
        if(results.book_instance.length > 0) {
            res.render('book_delete', {
                title: 'Delete Book',
                book: results.book,
                book_instance: results.book_instance
            });
        }
        else {
            Book.findByIdAndRemove(req.body.bookid, function(err) {
                if(err) { return next(err); }
                res.redirect('/catalog/books');
            });
        }
    })

};

// Display book update form on GET
exports.book_update_get = function(req, res, next) {
    
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                    .exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if(err) { return next(res); }

        //Mark our selected genres as checked
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
            for (var book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', {
            title: 'Book Update',
            book: results.book,
            authors: results.authors,
            genres: results.genres
        });
    });
};

// Handle book update on POST
exports.book_update_post = function(req, res, next) {
    
    //Sanitize id passed in.
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //Check other data
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();

    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();

        //Sanitize genre array for each value individually (validator only works for strings)
        // Use legacy validator!
         if(req.body.genre instanceof Array){
            req.body.genre = req.body.genre.map((initialGenre)=>{
                req.body.tempGenre = initialGenre;
                req.sanitize('tempGenre').escape();
                return req.body.tempGenre;
            });
            delete req.body.tempGenre;
            }else
                req.sanitize('genre').escape();

    var book = new Book(
        { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id //This is required, or a new ID will be assigned!
        });
    var errors = req.validationErrors();
        
    if(errors) {
        
        // Re-render book with error information
        // Get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }

            // Mark our selected genres as checked
            for (let i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    results.genres[i].checked='true';
                }
            }
            res.render('book_form', { title: 'Update Book',authors:results.authors, genres:results.genres, book: book, errors: errors });
        });
    }
    else {
        Book.findByIdAndUpdate(req.params.id, book, {},  function(err, updated) {
            if(err) {return nextTick(err); }
            res.redirect(updated.url);
        });
    }
};
