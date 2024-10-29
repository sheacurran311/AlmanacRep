export const errorHandler = (_error, _req, res, _next) => {
    console.error('Error:', _error.message);
    if (_error.stack)
        console.error('Stack:', _error.stack);
    res.status(500).json({ message: 'Something went wrong!' });
};
