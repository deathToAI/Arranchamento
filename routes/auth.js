const express = require('express');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const db = require('../database/database');

const router = express.Router();
const SECRET_KEY = 'sua_chave_secreta_super_segura'; // Substitua por uma chave segura em produção

// Geração do Token JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '2h' });
};

// Rota de login com JWT
router.post('/login', async (req, res) => {
    try {
        const user = await authController.login(req, res); // Verifica as credenciais do usuário

        if (user) {
            const token = generateToken(user); // Gera o token JWT
            res.json({ success: true, token });
        } else {
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user; // Adiciona as informações do usuário ao request
        next();
    });
};



module.exports = router;
