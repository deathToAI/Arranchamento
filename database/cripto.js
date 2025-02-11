const bcrypt = require('bcryptjs');
const senha = 'camole'; // Senha do usuário
const saltRounds = 10; // Número de rounds para gerar o salt

bcrypt.hash(senha, saltRounds, (err, hash) => {
    if (err) throw err;
    console.log('Senha criptografada:', hash);
});
