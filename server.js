require('dotenv').config({path:__dirname+'/sec.env'});
const express = require('express')
const sequelize = require('./database/database')
const User = require('./database/Users')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.static("public"));
app.use(express.json()); // Middleware para parsear JSON
app.use(cookieParser()); // Habilita o uso de cookies
port = 3000 ; 

sequelize.sync({ alter: true }).then(() => {
    console.log('Banco de Dados atualizado com sucesso!');
}).catch((error) => {
    console.error('Erro ao atualizar o banco de dados:', error);
});

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
	const token = req.cookies.token; // O token é enviado no cabeçalho da requisição

  
	if (!token) {
	  return res.status(403).json({ error: 'Token não fornecido' });
	}
  
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
	  if (err) {
		return res.redirect('/login'); // Redireciona se o token for inválido
	  }
  
	  // Adiciona os dados do usuário decodificados à requisição
	  req.user = decoded;
	  next(); // Passa para a próxima função (rota)
	});
  };

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

	  //Armazena o token do cliente e redireciona
	  res.cookie('token', token, {
		httpOnly: true,
		sameSite: 'Lax', // Permite o envio em navegação normal
	  });

	//   console.log('Token gerado:', token); // Log para verificar o token
	return res.json({ message: 'Login bem-sucedido', redirect: '/dashboard' });
	
	} catch (error) {
	  return res.status(500).json({ error: error.message });
	}
  });

  // Rota para fornecer dados do usuário para o dashboard
app.get('/dashboard', verifyToken, async (req, res) => {
	try {
	  // O token está disponível no req.cookies.token
	  const token = req.cookies.token;
  
	  // Verifique se o token existe
	  if (!token) {
		return res.status(401).json({ error: 'Token não encontrado' });
	  }
  
	  // Decodifique o token
	  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
	  // Busque o usuário no banco de dados
	  const user = await User.findByPk(decoded.id);
  
	  if (!user) {
		return res.status(404).json({ error: 'Usuário não encontrado' });
	  }
  
	  // Retorne os dados do usuário como JSON
	  res.sendFile(__dirname+'/public/dashboard.html');
		// Adicione outros dados do usuário conforme necessário
	
  
	} catch (error) {
	  console.error('Erro ao verificar o token ou carregar dados do usuário:', error);
	  res.status(500).json({ error: 'Erro ao carregar os dados do usuário' });
	}
  });
// Rota para fornecer os dados do dashboard
app.get('/dashboard-data', verifyToken, async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Token não encontrado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            username: user.nome_pg,
			user_id: user.id
        });
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para salvar as seleções do usuário no banco de dados
app.post('/api/salvar-selecoes', verifyToken, async (req, res) => {
    try {
        const { user_id, selecoes } = req.body;

        if (!user_id || !Array.isArray(selecoes)) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        // Para cada refeição selecionada
        for (let selecao of selecoes) {
            const { dia, tipo_refeicao } = selecao;

            // Excluir as refeições anteriores para o dia e usuário (caso já existam)
            await Meal.destroy({
                where: {
                    user_id: user_id,
                    dia: dia
                }
            });

            // Adicionar as novas seleções no banco de dados
            for (let tipo of tipo_refeicao) {
                await Meal.create({
                    user_id: user_id,
                    dia: dia,
                    tipo_refeicao: tipo
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar seleções:', error);
        res.status(500).json({ error: 'Erro ao salvar seleções no banco de dados' });
    }
});




app.listen(port, () => {
	console.log(`Servidor na porta ${port}`)
});
