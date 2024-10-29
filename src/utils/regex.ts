const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/

// Regular expression for MongoDB ObjectID validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/

export { passwordRegex, objectIdRegex }
