require('dotenv').config({path:__dirname+'/sec.env'});
const express = require('express')
const sequelize = require('./database/database')
const User = require('./database/Users')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 


const app = express()
app.use(express.static("public"))
app.use(express.json()) // Middleware para parsear JSON
port = 3000

sequelize.sync().then(() => {
	console.log('Banco de Dados sincronizado');
});

// Rota de login
app.post('/login', async (req, res) => {
	try {
	  const { username, password } = req.body;
  
	  // Buscar o usuário no banco de dados
	  const user = await User.findOne({ where: { username } });
  
	  if (!user) {
		return res.status(404).json({ error: 'Usuário não encontrado' });
	  }
  
	  // Comparar a senha fornecida com a senha criptografada
	  const isMatch = await bcrypt.compare(password, user.password);
  
	  if (!isMatch) {
		return res.status(400).json({ error: 'Senha incorreta' });
	  }
	  // Gera um token JWT
	  const token = jwt.sign(
		{ id: user.id, username: user.username }, // Payload (dados do usuário)
		process.env.JWT_SECRET, // Chave secreta (variável de ambiente)
		{ expiresIn: '1h' } // Tempo de expiração do token
	  );
  
	  // Retorna o token e os dados do usuário
	  res.json({ message: 'Login bem-sucedido', token, user: { id: user.id, username: user.username } });
	} catch (error) {
	  res.status(500).json({ error: error.message });
	}
  });

app.listen(port, () => {
	console.log(`Servidor na porta ${port}`)
});

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']; // O token é enviado no cabeçalho da requisição

  if (!token) {
    return res.status(403).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Adiciona os dados do usuário decodificados à requisição
    req.user = decoded;
    next(); // Passa para a próxima função (rota)
  });
};