//middleware to handle the error

const errorHandler = (err, req, res, next) =>{
    res.status(err.status || 500).json({error: err.message || 'Internal Server Error'});
};


//exporting the middleware 
module.exports = errorHandler;