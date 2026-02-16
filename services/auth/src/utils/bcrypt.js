import bcrypt from '@node-rs/bcrypt';

const saltRound = 10;

export const hashPassword = (password) => {
    return bcrypt.hashSync(password, saltRound)
}

export const hashCompare = (password, hash) => {
    return bcrypt.compareSync(password, hash)
}