var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
        if(err) {
            return next(err);
        }
        res.render('bookinstance_list', {
            title: 'Book Instance List',
            instance_list: list_bookinstances
        });
    });
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, book_instance) {
            if(err) {
                return next(err);
            }
            if(book_instance==null) {
                var err = new Error('No Instance found');
                err.status = 404;
                return next(err);
            }

            res.render('book_instance', {
               title: 'Book Instance', 
               book_instance: book_instance
            });
        });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
        .exec(function (err, books){
            if(err) {
                return next(res);
            }
            res.render('bookinstance_form', {
                title: 'Create BookInstance',
                book_list: books
            });
        });
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res, next) {
    
    req.checkBody('book', 'Book must be specified').notEmpty();
    req.checkBody('imprint', 'Imprint must not be empty').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601();

    //sanitizing the data
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();

    //triming data
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();
    req.sanitize('status').escape();

    var errors = req.validationErrors();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
    });

    if(errors) {
        Book.find(function(err, book) {
            if(err) { return next(err); }
            res.render('bookinstance_form',{
                title: 'Book Instance create',
                book_list: book,
                selected_book: bookinstance.book._id,
                errors: errors,
                bookinstance: bookinstance
            });
        });
    }
    else {
        bookinstance.save(function(err) {
            if(err) {
                return next(res);
            }
            res.redirect(bookinstance.url);
        });
    }
    
};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
            .exec(function(err, book_instance) {
            if(err) { return next(err); }
            res.render('bookinstance_delete', {
                title: 'Book Instance Delete',
                book_instance: book_instance
            });
    }); 
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res, next) {
    req.checkBody('bookinstanceid','Bookinstance id is required').notEmpty();

    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function(err) {
        if(err) { return next(err); }
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};