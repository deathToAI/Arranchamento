const bcrypt = require('bcryptjs');

// Pega a senha passada como argumento
const senha = process.argv[2];

if (!senha) {
    console.error('Uso: node cripto.js <senha>');
    process.exit(1);
}

const saltRounds = 10;

bcrypt.hash(senha, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log(hash);
});
