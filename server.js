require('dotenv').config({path:__dirname+'/sec.env'});
const express = require('express')
const sequelize = require('./database/database')
const User = require('./database/models/Users')
const Meals = require ('./database/models/meals')
const Admin = require ('./database/models/admin')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');
const moment = require('moment');
const { where, Op, and } = require('sequelize');
const cron = require('node-cron');
const path = require('path');
const app = express();
app.use(express.json()); // Middleware para parsear JSON
app.use(cookieParser()); // Habilita o uso de cookies
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
port = 3000 ; 

sequelize.sync().then(() => {
    console.log('Banco de Dados atualizado com sucesso!');
}).catch((error) => {
    console.error('Erro ao atualizar o banco de dados:', error);
});

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
	const token = req.cookies.token; // O token é enviado no cabeçalho da requisição

  
	if (!token) {
    return res.redirect('/'); // Se não houver token, redireciona para a página inicial	}
  }
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
	  if (err) {
        console.error('Erro na verificação do token:', err.message);
		return res.redirect('/'); // Redireciona se o token for inválido
	  }
  
	  // Adiciona os dados do usuário decodificados à requisição
	  req.user = decoded;
	  next(); // Passa para a próxima função (rota)
	});
  };

  app.use((req, res, next) => {
    if (req.path.endsWith('.html')) { // Se for um arquivo HTML
      if (!req.cookies.token) { // Se não estiver autenticado, redireciona
        return res.redirect('/');
      }
  
      jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.redirect('/'); // Se o token for inválido, bloqueia o acesso
        }
  
        req.user = decoded; // Adiciona os dados do usuário à requisição
  
        // Bloqueia furriel de acessar aprov.html
        if (req.path === '/aprov.html' && req.user.username.toLowerCase() !== 'aprov') {
          return res.redirect('/');
        }
  
        // Bloqueia aprov de acessar furriel_dashboard.html
        if (req.path === '/furriel_dashboard.html' && req.user.username.toLowerCase() !== 'furriel') {
          return res.redirect('/');
        }
  
        next(); // Se passar na validação, permite o acesso ao arquivo
      });
    } else {
      next(); // Se não for um arquivo HTML, continua normalmente
    }
  });
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static('static'));

// Rota de login
app.post('/login', async (req, res) => {
	try {
	  const { username, password } = req.body;

		let user = null;

		// Se o usuário for "admin", busca na tabela Admin
		if (username.toLowerCase() === 'admin') {
			user = await Admin.findOne({ where: { username } });
		} else {
			// Caso contrário, busca na tabela Users
			user = await User.findOne({ where: { username } });
		}

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
        //secure: process.env.NODE_ENV === 'production', // quando em produção
		sameSite: 'Lax', // Permite o envio em navegação normal
	  });

    // Define a URL de redirecionamento com base no username
    let redirectUrl = '/dashboard';
    if (user.username.toLowerCase() === 'furriel') {
      redirectUrl = '/furriel_dashboard';
    }
    else if (user.username.toLowerCase() === 'aprov'){
      redirectUrl = '/aprov';
    }else if (user.username.toLowerCase() === 'admin') {
			redirectUrl = '/nidma';
		}

	//   console.log('Token gerado:', token); // Log para verificar o token
	return res.json({ message: 'Login bem-sucedido', redirect: redirectUrl });
	
	} catch (error) {
	  return res.status(500).json({ error: error.message });
	}
  });

app.post('/logout', (req, res) => {
    res.clearCookie('token'); // Limpa o cookie de autenticação
    return res.json({ message: 'Saindo...', redirect: '/' });
 });

// Rotas para fornecer dados do usuário para o dashboard
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

app.post('/pass_change', verifyToken, async(req, res) => {
  try {
    const { oldpass, newpass } = req.body;
    const token = req.cookies.token;
          if (!token) {
              return res.status(401).json({ error: 'Token não encontrado' });
          }
      // Decodifica o token para obter o usuário autenticado    
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);  
      username = user.username;
      ///DEPURAÇÃO
      console.log(`Mudando senha para ${username}`)
      

      if (!oldpass || !newpass) {
        return res.status(400).json({ error: 'Todos os campos (username, oldpass, newpass) são obrigatórios' });
      }
      const db_user = await User.findOne({where: { username }});
      // Verifica se a senha antiga está correta
      const isMatch = await bcrypt.compare(oldpass, db_user.password);

      if (!isMatch ){
        console.log(`Senha antiga incorreta para o usuário: ${user.username}`);
        return res.status(400).json({ error: 'Senha antiga incorreta' });
      }
      newhash = await bcrypt.hash(newpass,10);
      await user.update({password : newhash});
      res.json({ message: `Senha do usuário ${username} foi alterada com sucesso.` });

    }catch(error){
      console.error('Erro ao alterar a senha');
      res.status(500).json({ error: 'Erro ao alterar a senha', details: error.message });
    }
});

app.get('/dashboard-data', verifyToken, async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Token não encontrado' });
        }

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
		
		const refeicoes = await Meals.findAll({
			where: {
				user_id: user.id
			},
			attributes : [ 'dia', 'tipo_refeicao'],
			//order : [['dia', 'ASC']]
		});
		//Depuração
    //console.log(refeicoes);
		
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            username: user.nome_pg,
			user_id: user.id,
        });
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/salvar-selecoes', async (req, res) => {
    const { user_id, refeicoes } = req.body;

    if (!user_id || !Array.isArray(refeicoes)) {
        return res.status(400).json({ error: "Dados inválidos. Envie `user_id` e `refeicoes` corretamente." });
    }

    try {
        //DEPURAÇÃO
        //console.log("Refeições recebidas para salvar:", refeicoes);

        // Obtém todas as refeições já existentes do usuário no banco de dados
        const refeicoesExistentes = await Meals.findAll({
            where: { user_id },
            attributes: ['dia', 'tipo_refeicao']
        });

        // Converte as refeições existentes em um formato de fácil comparação
        const refeicoesNoBanco = refeicoesExistentes.map(r => ({
            dia: moment(r.dia, "YYYY-MM-DD").format("DD/MM/YYYY"),
            tipo_refeicao: r.tipo_refeicao
        }));
        //DEPURAÇÃO
        //console.log("Refeições já cadastradas no banco:", refeicoesNoBanco);

        // Refeições que o usuário selecionou no frontend
        const refeicoesSelecionadas = refeicoes.flatMap(refeicao =>
            refeicao.tipo_refeicao.map(tipo => ({
                user_id: user_id,
                dia: moment(refeicao.dia, "DD/MM/YYYY").format("YYYY-MM-DD"),
                tipo_refeicao: tipo
            }))
        );
        //DEPURAÇÃO
        //console.log("Refeições processadas a serem mantidas:", refeicoesSelecionadas);

        // Identifica quais refeições foram desmarcadas (estavam no banco, mas não estão no frontend)
        const refeicoesParaRemover = refeicoesNoBanco.filter(refNoBanco =>
            !refeicoesSelecionadas.some(refNova =>
                refNoBanco.dia === refNova.dia && refNoBanco.tipo_refeicao === refNova.tipo_refeicao
            )
        );
        //DEPURAÇAO
        //console.log("Refeições a serem removidas:", refeicoesParaRemover);

        // Remove as refeições desmarcadas do banco de dados
        for (const refeicao of refeicoesParaRemover) {
            await Meals.destroy({
                where: {
                    user_id: user_id,
                    dia: moment(refeicao.dia, "DD/MM/YYYY").format("YYYY-MM-DD"),
                    tipo_refeicao: refeicao.tipo_refeicao
                }
            });
        }

        // Insere ou atualiza as refeições selecionadas pelo usuário
        for (const refeicao of refeicoesSelecionadas) {
            await Meals.findOrCreate({
                where: {
                    user_id: refeicao.user_id,
                    dia: refeicao.dia,
                    tipo_refeicao: refeicao.tipo_refeicao
                },
                defaults: refeicao
            });
        }

        console.log("Refeições atualizadas com sucesso.");
        res.json({ message: "Refeições registradas com sucesso!" });

    } catch (error) {
        console.error("Erro ao salvar refeições:", error);
        res.status(500).json({ error: "Erro ao salvar refeições", details: error.message });
    }
});

app.get('/refeicoes-usuario', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ error: "O parâmetro `user_id` é obrigatório." });
    }

    try {

		const usuario = await User.findByPk(user_id, { attributes: ['username'] });
        // Busca todas as refeições do usuário
        const refeicoes = await Meals.findAll({
            where: { user_id },
            attributes: ['dia', 'tipo_refeicao']
        });

        const refeicoesFormatadas = refeicoes.reduce((acc, refeicao) => {
            const diaFormatado = moment(refeicao.dia, "YYYY-MM-DD").format("DD/MM/YYYY"); // Converte para o formato correto

            if (!acc[diaFormatado]) {
                acc[diaFormatado] = [];
            }
            acc[diaFormatado].push(refeicao.tipo_refeicao);
            return acc;
        }, {});

        res.json({
            refeicoesFormatadas: refeicoesFormatadas,
            usuario: usuario ? usuario.username : null
        });
    } catch (error) {
        console.error("Erro ao buscar refeições do usuário:", error);
        res.status(500).json({ error: "Erro ao buscar refeições", details: error.message });
    }
});

//ROTAS FURRIEL
app.get ('/furriel_dashboard',verifyToken, async (req,res) =>{

    try{


       // Verifica se o usuário autenticado possui o username "furriel"
      if (req.user.username.toLowerCase() !== 'furriel') {
        return res.redirect('/');
      }


        const usuarios = await User.findAll({
            attributes: ['nome_pg']
        });
        // Busca todos os registros da tabela Meals
        const meals = await Meals.findAll();
        
        // Debug: imprime os dados no console
        //usuarios.forEach(usuario => console.log(usuario.nome_pg));
        //console.log("Usuários:", usuarios); //Depuração
        //console.log("Refeições:", meals);  //Depuração

        res.sendFile(__dirname+'/public/furriel_dashboard.html');
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).send("Erro interno ao carregar usuários");
    }
});

app.get('/furriel_dashboard_data', async (req, res) => {
    const { data, refeicao } = req.query;
    try {
        const dataFormatada = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
        //Depuração
        //console.log(`A data  a ser buscada é ${dataFormatada}`);
        //console.log(`A refeição a ser buscada é ${refeicao}`);
        const usuarios = await User.findAll({
        attributes: ['id','nome_pg', 'grupo']
      });
      const meals = await Meals.findAll();
      // Filtra os usuários que possuem pelo menos uma meal que:
      // - tem user_id igual ao id do usuário,
      // - tem dia igual a dataFormatada,
      // - tem tipo_refeicao igual ao valor do parâmetro (em minúsculas)
      const arranchados = usuarios.filter(usuario =>
          meals.some(meal =>
          meal.user_id === usuario.id &&
          moment(meal.dia).format("YYYY-MM-DD") === dataFormatada &&
          meal.tipo_refeicao.toLowerCase() === refeicao.toLowerCase()
          )
      ).map(usuario => usuario.nome_pg);

      //DEPURAÇÃO
      //console.log(`Os usuários arranchados para o ${refeicao} em ${dataFormatada} são : ${arranchados}`);
      res.json({ usuarios, meals, arranchados });
    } catch (error) {
      console.error("Erro ao buscar dados da dashboard:", error);
      res.status(500).json({ error: "Erro ao buscar dados", details: error.message });
    }
  });
  
  app.post('/salvar-selecoes-multiplos', async (req, res) => {
    const { selecoes, dia, tipo_refeicao, grupo } = req.body;
  
    console.log(`Dia selecionado: ${dia}`);
    console.log(`Refeição selecionada: ${tipo_refeicao}`);
  
    const diaFormatado = moment(dia, "DD/MM/YYYY").format("YYYY-MM-DD");
  
    // 🧠 Converte grupo (string ou número) para array de inteiros
    let grupoArray;
    if (typeof grupo === 'string' && grupo.includes(",")) {
      grupoArray = grupo.split(",").map(g => parseInt(g.trim(), 10));
    } else {
      grupoArray = [parseInt(grupo, 10)];
    }
  
    try {
      // 🗑️ Se nenhuma seleção for feita, apenas deletar do banco
      if (!Array.isArray(selecoes) || selecoes.length === 0) {
        const usuariosDoGrupo = await User.findAll({
          where: { grupo: grupoArray },
          attributes: ['id']
        });
  
        const idsDoGrupo = usuariosDoGrupo.map(u => u.id);
  
        const deletados = await Meals.destroy({
          where: {
            dia: diaFormatado,
            tipo_refeicao: tipo_refeicao.toLowerCase(),
            user_id: idsDoGrupo
          }
        });
  
        console.log(`Registros deletados para ${diaFormatado} e ${tipo_refeicao.toLowerCase()}:`, deletados);
        return res.json({ message: "Registros apagados para o dia e refeição especificados." });
      }
  
      // 🔁 Atualizar seleções
      const usuariosDoGrupo = await User.findAll({
        where: { grupo: grupoArray },
        attributes: ['id']
      });
  
      const idsDoGrupo = usuariosDoGrupo.map(u => u.id);
  
      await Meals.destroy({
        where: {
          dia: diaFormatado,
          tipo_refeicao: tipo_refeicao.toLowerCase(),
          user_id: idsDoGrupo
        }
      });
  
      console.log(`Registros removidos para o dia ${diaFormatado} e refeição ${tipo_refeicao.toLowerCase()}`);
  
      for (const sel of selecoes) {
        const selDiaFormatado = moment(sel.dia, "DD/MM/YYYY").format("YYYY-MM-DD");
        await Meals.create({
          user_id: sel.user_id,
          dia: selDiaFormatado,
          tipo_refeicao: sel.tipo_refeicao.toLowerCase()
        });
      }
  
      console.log("Seleções atualizadas com sucesso.");
      res.json({ message: "Seleções registradas com sucesso!" });
  
    } catch (error) {
      console.error("Erro ao salvar seleções múltiplas:", error);
      res.status(500).json({ error: "Erro ao salvar seleções", details: error.message });
    }
  });
  
// Rota para obter seleções de refeições de um usuário
app.get('/get-selecoes', async (req, res) => {
    const userId = req.query.user_id; // Obter o ID do usuário da query string

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Buscar as seleções do usuário no banco de dados
        const selecoes = await Meals.findAll({
            where: { user_id: userId },
        });

        // Retornar as seleções em formato JSON
        const selecoesFormatted = selecoes.map(selecao => ({
            dia: selecao.dia,
            tipo_refeicao: selecao.tipo_refeicao.split(','), // Caso seja uma string separada por vírgulas
        }));

        return res.json(selecoesFormatted);
    } catch (error) {
        console.error('Erro ao obter seleções:', error);
        //return res.status(500).json([]); // Retorna array vazio no erro
    }
});


//ROTAS APROV
app.get('/aprov', verifyToken, async (req, res) => {

  try {
    if (req.user.username.toLowerCase() !== 'aprov') {
      return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'aprov.html'));
  } catch (error) {
    res.status(500).send("Erro ao acessar a página de aprovisionamento");
  }
});

app.get('/aprov/dados', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.username.toLowerCase() !== 'aprov') {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Busca o usuário autenticado no banco
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nome_pg', 'username', 'grupo']
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

app.get('/aprov_dashboard_data', async (req, res) => {
  const { data, grupo } = req.query;
  try {
      const dataFormatada = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");

      let grupoArray;
      if (grupo.includes(",")) {
          grupoArray = grupo.split(",").map(num => parseInt(num, 10));
      } else {
          grupoArray = [parseInt(grupo, 10)];
      }

      // Busca todos os usuários que pertencem aos grupos informados
      const usuarios = await User.findAll({
          where: { grupo: grupoArray }, 
          attributes: ['id', 'nome_pg', 'grupo']
      });

      // Busca todas as refeições para o dia informado
      const meals = await Meals.findAll({
          where: { dia: dataFormatada }
      });

      // Agrupa os aprovados (arranchados) por tipo de refeição
      const arranchados = {
          cafe: usuarios.filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'cafe')).map(u => u.nome_pg),
          almoco: usuarios.filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'almoco')).map(u => u.nome_pg),
          janta: usuarios.filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'janta')).map(u => u.nome_pg)
      };

      res.json({ usuarios, arranchados });

  } catch (error) {
      console.error("Erro ao buscar dados da dashboard de aprovação:", error);
      res.status(500).json({ error: "Erro ao buscar dados", details: error.message });
  }
});
//ROTAS RELATÓRIOS
app.get('/download-arranchados', async (req, res) => {
    try {
      const { data, grupo } = req.query;
      if (!data || !grupo) {
        return res.status(400).send("Parâmetros 'data' e 'grupo' são obrigatórios.");
      }
      
      // Converte a data do parâmetro para o formato ISO (para busca) e mantém o formato para exibição.
      const dataFormatadaIso = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
      const dataFormatadaDisplay = data; // "DD/MM/YYYY"

      let grupoArray;
      if (grupo === "Todos") {
          grupoArray = [1, 3]; // Se "Todos" for selecionado, busca os grupos 1 e 3
      } else if (grupo.includes(",")) {
          grupoArray = grupo.split(",").map(num => parseInt(num, 10));
      } else {
          grupoArray = [parseInt(grupo, 10)];
      }
      // Busca os usuários que pertencem ao grupo informado
      // Atualiza a busca de usuários para incluir os grupos corretos
      const usuarios = await User.findAll({
        where: { grupo: [1, 2, 3] }, // força sempre todos os grupos operacionais
        attributes: ['id', 'nome_pg', 'grupo']
      });
      const gruposMapeados = {
        1: 'Oficiais',
        2: 'ST/Sgt',
        3: 'Cb/Sd'
      };
      
      const usuariosPorGrupo = {
        1: usuarios.filter(u => u.grupo === 1),
        2: usuarios.filter(u => u.grupo === 2),
        3: usuarios.filter(u => u.grupo === 3)
      };
      
      
  
      // Busca todas as refeições registradas para o dia informado
      const meals = await Meals.findAll({
        where: { dia: dataFormatadaIso }
      });
  
      // Cria conjuntos para cada tipo de refeição, armazenando os IDs dos usuários aprovados
      const arranchadosMap = {
        cafe: new Set(),
        almoco: new Set(),
        janta: new Set()
      };
  
      meals.forEach(meal => {
        const tipo = meal.tipo_refeicao.toLowerCase();
        if (arranchadosMap[tipo]) {
          arranchadosMap[tipo].add(meal.user_id);
        }
      });
  
      // Para cada refeição, filtra os usuários do grupo que estão aprovados
      const arranchadosCafe = usuarios.filter(u => arranchadosMap.cafe.has(u.id)).map(u => u.nome_pg);
      const arranchadosAlmoco = usuarios.filter(u => arranchadosMap.almoco.has(u.id)).map(u => u.nome_pg);
      const arranchadosJanta = usuarios.filter(u => arranchadosMap.janta.has(u.id)).map(u => u.nome_pg);
  
      // Cria um novo workbook e adiciona uma worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Arranchados');

      // Adiciona a imagem ao workbook
    const imageId = workbook.addImage({
      filename: path.join(__dirname, 'public', 'img', 'Simbolo_3a_Cia_Com_Bld2.png'),
      extension: 'png'
    });

      // Insere a imagem no lado esquerdo do título (posição: col 0.1, row 0.1; ajuste conforme necessário)
      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 50, height: 50 }
      });
      // Insere a imagem no lado direito do título (supondo que o título esteja mesclado de A1 até F1, a posição de F1 é col 5)
      worksheet.addImage(imageId, {
        tl: { col: 8.1, row: 0.1 },
        ext: { width: 50, height: 50 }
      });
  
      // Linha 1: Título - mescla de A1 até F1
      worksheet.mergeCells('B1:H1');
      const titleCell = worksheet.getCell('B1');
      titleCell.value = `Arranchamento para ${dataFormatadaDisplay}`;
      titleCell.font = { bold: true, size: 18 };
      titleCell.alignment = { horizontal: 'center' };
  
      let currentRow = 2;
      let totalArranchados = 0; // Contador geral

      const arranchadosPorGrupo = {
        1: { cafe: [], almoco: [], janta: [] },
        2: { cafe: [], almoco: [], janta: [] },
        3: { cafe: [], almoco: [], janta: [] }
      };
      
      Object.entries(usuariosPorGrupo).forEach(([grupo, usuarios]) => {
        usuarios.forEach(u => {
          if (arranchadosMap.cafe.has(u.id)) arranchadosPorGrupo[grupo].cafe.push(u.nome_pg);
          if (arranchadosMap.almoco.has(u.id)) arranchadosPorGrupo[grupo].almoco.push(u.nome_pg);
          if (arranchadosMap.janta.has(u.id)) arranchadosPorGrupo[grupo].janta.push(u.nome_pg);
        });
      });
      
      // Função auxiliar para escrever um bloco: cabeçalho e lista de nomes
      function writeBlock(header, nomes) {
        // Cabeçalho do bloco: mescla de B(currentRow) até H(currentRow)
        const headerRange = `B${currentRow}:H${currentRow}`;
        worksheet.mergeCells(headerRange);
        worksheet.getCell(`B${currentRow}`).value = header;
        worksheet.getCell(`B${currentRow}`).font = { bold: true, size: 16 };
        worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center' };
        worksheet.getCell(`I${currentRow}`).value = nomes.length; // Total de arranchados para essa refeição
        currentRow++;
      
        // Verifica se a lista está vazia
        if (nomes.length === 0) {
          worksheet.getCell(`B${currentRow}`).value = "Nenhum arranchado";
          worksheet.getCell(`B${currentRow}`).font = { italic: true, color: { argb: "FF0000" } }; // Texto em itálico e vermelho
          worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };
          worksheet.getCell(`I${currentRow}`).value = 0; // Nenhum arranchado = 0
          currentRow++;
        } else {
          // Preenche as linhas com os nomes, um nome por linha na coluna B
          nomes.forEach(nome => {
            worksheet.getCell(`B${currentRow}`).value = nome;
            currentRow++;
          });
        }
      }
  
      Object.entries(arranchadosPorGrupo).forEach(([grupo, refeicoes]) => {
        const grupoNome = gruposMapeados[grupo];
      
        writeBlock(`${grupoNome} - Café`, refeicoes.cafe);
        writeBlock(`${grupoNome} - Almoço`, refeicoes.almoco);
        writeBlock(`${grupoNome} - Janta`, refeicoes.janta);
      });

      currentRow++;
      worksheet.getCell(`B${currentRow}`).value = "Resumo Final";
      worksheet.getCell(`B${currentRow}`).font = { bold: true, size: 14 };
      currentRow++;
      
      worksheet.getCell(`B${currentRow}`).value = "Grupo";
      worksheet.getCell(`C${currentRow}`).value = "Café";
      worksheet.getCell(`D${currentRow}`).value = "Almoço";
      worksheet.getCell(`E${currentRow}`).value = "Janta";
      worksheet.getRow(currentRow).font = { bold: true };
      currentRow++;
      let totalCafe = 0;
      let totalAlmoco = 0;
      let totalJanta = 0;
      
      [1, 2, 3].forEach(grupo => {
        const cafe = arranchadosPorGrupo[grupo].cafe.length;
        const almoco = arranchadosPorGrupo[grupo].almoco.length;
        const janta = arranchadosPorGrupo[grupo].janta.length;

        totalCafe += cafe;
        totalAlmoco += almoco;
        totalJanta += janta;

        worksheet.getCell(`B${currentRow}`).value = gruposMapeados[grupo];
        worksheet.getCell(`C${currentRow}`).value = cafe;
        worksheet.getCell(`D${currentRow}`).value = almoco;
        worksheet.getCell(`E${currentRow}`).value = janta;
        currentRow++;
        
        // Linha final com totais por refeição
        worksheet.getCell(`B${currentRow}`).value = "Total";
        worksheet.getCell(`C${currentRow}`).value = totalCafe;
        worksheet.getCell(`D${currentRow}`).value = totalAlmoco;
        worksheet.getCell(`E${currentRow}`).value = totalJanta;
        worksheet.getRow(currentRow).font = { bold: true };
        
        

      });
      // Criação da segunda planilha: "Etapas"
      let sheetEtapas = workbook.getWorksheet('Etapas');
      if (!sheetEtapas) {
        sheetEtapas = workbook.addWorksheet('Etapas');
      }

      const dataHojeFormatada = moment().format("DD/MM/YYYY");

      // Cabeçalho superior
      sheetEtapas.mergeCells('A1:C1');
      sheetEtapas.getCell('A1').value = "visto";
      sheetEtapas.getCell('A1').font = { italic: true };

      sheetEtapas.mergeCells('E1:H1');
      sheetEtapas.getCell('E1').value = "3ª Cia Com Bld";
      sheetEtapas.getCell('E1').alignment = { horizontal: 'right' };

      sheetEtapas.mergeCells('A3:D3');
      sheetEtapas.getCell('A3').value = "NOME COMPLETO – PG";
      sheetEtapas.mergeCells('E3:H3');
      sheetEtapas.getCell('E3').value = "Vale Diário para o dia";
      sheetEtapas.getCell('I3').value = moment(dataFormatadaIso).format("DD/MM/YY");

      sheetEtapas.getCell('A4').value = "Fisc Adm";
      sheetEtapas.getCell('H4').value = "Quantitativos";
      sheetEtapas.getCell('I4').value = "quantidade";

      // Linha de títulos
      sheetEtapas.getRow(6).values = [
        "Etapas reduzidas", "Café", "Almoço", "Jantar",
        "etapas completas", "A alimentar", "A Alimentar OM", "soma", "Tipo", "quantidade"
      ];

      // Ajustar o total de arranchados por grupo e refeição
      const cafePorGrupo = {};
      const almocoPorGrupo = {};
      const jantaPorGrupo = {};

      [1, 2, 3].forEach(grupo => {
        cafePorGrupo[grupo] = arranchadosPorGrupo[grupo].cafe.length;
        almocoPorGrupo[grupo] = arranchadosPorGrupo[grupo].almoco.length;
        jantaPorGrupo[grupo] = arranchadosPorGrupo[grupo].janta.length;
      });

      // Grupos: Oficiais, ST/Sgt, Cb/Sd
      const gruposEtapas = [1, 2, 3];
      const linhaInicio = 7;

      gruposEtapas.forEach((grupo, idx) => {
        const row = sheetEtapas.getRow(linhaInicio + idx);
        const nomeGrupo = gruposMapeados[grupo];

        row.getCell(1).value = nomeGrupo; // Etapas reduzidas
        row.getCell(2).value = cafePorGrupo[grupo];
        row.getCell(3).value = almocoPorGrupo[grupo];
        row.getCell(4).value = jantaPorGrupo[grupo];
        
        row.getCell(5).value = nomeGrupo; // Etapas completas
        const totalGrupo = cafePorGrupo[grupo] + almocoPorGrupo[grupo] + jantaPorGrupo[grupo];
        row.getCell(6).value = totalGrupo;
        row.getCell(7).value = 0; // A Alimentar OM fixo como zero
        row.getCell(8).value = totalGrupo;
        row.getCell(9).value = "QR";
      });

      const linhaSoma = linhaInicio + gruposEtapas.length;
      const etapatotalCafe = [1, 2, 3].reduce((sum, g) => sum + cafePorGrupo[g], 0);
      const etapatotalAlmoco = [1, 2, 3].reduce((sum, g) => sum + almocoPorGrupo[g], 0);
      const etapatotalJanta = [1, 2, 3].reduce((sum, g) => sum + jantaPorGrupo[g], 0);
      const totalAAlimentar = totalCafe + totalAlmoco + totalJanta;

      sheetEtapas.getCell(`A${linhaSoma}`).value = "SOMA";
      sheetEtapas.getCell(`B${linhaSoma}`).value = etapatotalCafe;
      sheetEtapas.getCell(`C${linhaSoma}`).value = etapatotalAlmoco;
      sheetEtapas.getCell(`D${linhaSoma}`).value = etapatotalJanta;

      sheetEtapas.getCell(`F${linhaSoma}`).value = totalAAlimentar;
      sheetEtapas.getCell(`G${linhaSoma}`).value = 0; // A Alimentar OM sempre 0
      sheetEtapas.getCell(`H${linhaSoma}`).value = totalAAlimentar;

      sheetEtapas.getCell(`I${linhaSoma}`).value = "CF";
      sheetEtapas.getCell(`J${linhaSoma}`).value = totalAAlimentar;



      sheetEtapas.getCell(`A${linhaSoma}`).value = "SOMA";
      sheetEtapas.getCell(`I${linhaSoma}`).value = "CF";

      // Rodapé
      const linhaRodape = linhaSoma + 2;
      sheetEtapas.mergeCells(`A${linhaRodape}:H${linhaRodape}`);
      sheetEtapas.getCell(`A${linhaRodape}`).value = `Quartel em Santa Maria – RS , ${dataHojeFormatada}`;

      sheetEtapas.getCell(`H${linhaRodape + 2}`).value = "_______";
      sheetEtapas.getCell(`I${linhaRodape + 2}`).value = "Furriel";

      // Estilo de títulos
      sheetEtapas.getRow(6).font = { bold: true };

  
      // Configura os cabeçalhos da resposta para download do arquivo Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=arranchados.xlsx');
  
      // Escreve o workbook na resposta e finaliza
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Erro ao gerar arquivo Excel:", error);
      res.status(500).send("Erro ao gerar arquivo Excel");
    }
  });

  
app.get('/download-pdf', async (req, res) => {
  try {
    const { data, grupo } = req.query;
    if (!data || !grupo) {
      return res.status(400).send("Parâmetros 'data' e 'grupo' são obrigatórios.");
    }
    
    const dataFormatadaIso = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
    const dataFormatadaDisplay = data;
    //DEPURAÇÃO
    //console.log(`Data a ser buscada: ${dataFormatadaIso}`);
    //console.log(`Grupo a ser buscado: ${grupo}`);

    const grupoNum = parseInt(grupo, 10);
    let grupoArray;
if (grupo === "Todos") {
    grupoArray = [1, 3]; // Se "Todos" for selecionado, busca os grupos 1 e 3
} else if (grupo.includes(",")) {
    grupoArray = grupo.split(",").map(num => parseInt(num, 10));
} else {
    grupoArray = [parseInt(grupo, 10)];
}

// Atualiza a busca de usuários para incluir os grupos corretos
const usuarios = await User.findAll({
    where: { grupo: grupoArray },
    attributes: ['id', 'nome_pg']
});

    //DEPURAÇÃO
    //console.log("Usuários retornados:", usuarios.map(u => ({ nome: u.nome_pg, grupo: u.grupo })));
    
    // Busca todas as refeições para o dia informado
    const meals = await Meals.findAll({
      where: { dia: dataFormatadaIso }
    });
    //DEPURAÇÃO
    //console.log("Meals retornados:", meals);

    // Como a consulta já filtra os usuários por grupo, podemos usar diretamente:
    const usuariosFiltrados = usuarios;
    //DEPURAÇÃO
    //console.log("Usuários filtrados:", usuariosFiltrados.map(u => u.nome_pg));

    const arranchados = {
      cafe: usuariosFiltrados.filter(u =>
        meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase().trim() === 'cafe')
      ).map(u => u.nome_pg),
      almoco: usuariosFiltrados.filter(u =>
        meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase().trim() === 'almoco')
      ).map(u => u.nome_pg),
      janta: usuariosFiltrados.filter(u =>
        meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase().trim() === 'janta')
      ).map(u => u.nome_pg)
    };

    //console.log(`Os arranchados para o dia ${dataFormatadaIso} e grupo ${grupoNum} são:`, arranchados);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res); // res deve ser o objeto de resposta da rota
    // Caminho da imagem (ajuste conforme necessário)
    const imagePath = path.join(__dirname, 'public', 'img', 'Simbolo_3a_Cia_Com_Bld2.png');
    const imageWidth = 50, imageHeight = 50;
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left; // normalmente 50
    
    // Insere a imagem no lado esquerdo
    doc.image(imagePath, margin, 20, { width: imageWidth, height: imageHeight });
    // Insere a imagem no lado direito
    doc.image(imagePath, pageWidth - margin - imageWidth, 20, { width: imageWidth, height: imageHeight });
    

    // Insere o título centralizado com formatação
    doc.fontSize(18)
      .font('Helvetica-Bold')
      .text(`Arranchamento para ${dataFormatadaDisplay}`, { align: 'center' });
    doc.moveDown();

    let totalArranchados = 0; // Contador total de arranchados

    // Função auxiliar para escrever um bloco de informações
     // Função para escrever blocos de refeição
     function escreverBloco(titulo, lista) {
      const numArranchados = lista.length;
      totalArranchados += numArranchados; // Adiciona ao total geral

      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(`${titulo} (${numArranchados} arranchados)`, { underline: true });

      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica');

      if (numArranchados === 0) {
        doc.text("Nenhum arranchado", { color: "red" });
      } else {
        lista.forEach(nome => {
          doc.text(nome);
        });
      }
      doc.moveDown();
    }

    // Escreve os blocos para cada refeição
    escreverBloco("Café", arranchados.cafe);
    escreverBloco("Almoço", arranchados.almoco);
    escreverBloco("Janta", arranchados.janta);
    
    // Linha final com TOTAL GERAL
    doc.fontSize(18)
    .font('Helvetica-Bold')
    .text(`Total Geral: ${totalArranchados} arranchados`, { align: 'center' });

// Finaliza o documento
    doc.end();
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).send("Erro ao gerar PDF");
  }
});


//Parte do admin

app.get('/nidma', verifyToken, async (req, res) => {
  try {
      if (req.user.username.toLowerCase() !== 'admin') {
          return res.redirect('/');
      }
      res.sendFile(path.join(__dirname, 'public', 'nidma.html'));
  } catch (error) {
      res.status(500).send("Erro ao acessar a página do administrador");
  }
});


// Rota para obter todos os usuários
app.get('/admin/usuarios', verifyToken, async (req, res) => {
  try {
      if (req.user.username.toLowerCase() !== 'admin') {
          return res.status(403).json({ error: "Acesso negado" });
      }

      const usuarios = await User.findAll({ attributes: ['id', 'username', 'nome_pg', 'grupo'] });
      res.json({ usuarios });

  } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro ao buscar usuários", details: error.message });
  }
});

// Rota para criar um novo usuário
app.post('/admin/criar-usuario', verifyToken, async (req, res) => {
  try {
      if (req.user.username.toLowerCase() !== 'admin') {
          return res.status(403).json({ error: "Acesso negado" });
      }

      const { username, nome_pg, grupo,senha } = req.body;

       if (!username || !nome_pg || !grupo || !senha) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }
      // Define o intervalo de IDs com base no grupo
      let minId, maxId;
      if (grupo === 1) { 
          minId = 1; maxId = 1000;
      } else if (grupo === 2) { 
          minId = 1001; maxId = 1999;
      } else if (grupo === 3) { 
          minId = 2000; maxId = 9999;
      } else {
          return res.status(400).json({ error: "Grupo inválido." });
      }

      // Encontra o maior ID existente dentro do grupo
      const maxUser = await User.findOne({
        where: { id: { [Op.between]: [minId, maxId] } },
        order: [['id', 'DESC']],
    });

      const usuarioExistente = await User.findOne({ where: { username } });

      if (usuarioExistente) {
          return res.status(400).json({ error: "Usuário já existe" });
      }

      // Define o próximo ID disponível
      const novoId = maxUser ? maxUser.id + 1 : minId;

      // Criptografa a senha antes de salvar
      const senhaHash = await bcrypt.hash(senha, 10);

      // Cria o novo usuário
      const novoUsuario = await User.create({
          id: novoId,
          username,
          nome_pg,
          grupo,
          password: senhaHash
      });

      res.json({ message: `Usuário ${username} criado com sucesso.`, id: novoId });
  } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ error: "Erro ao criar usuário", details: error.message });
  }
});

// Rota para resetar senha de um usuário
app.post('/admin/resetar-senha', verifyToken, async (req, res) => {
  try {
      if (req.user.username.toLowerCase() !== 'admin') {
          return res.status(403).json({ error: "Acesso negado" });
      }

      const { username } = req.query;

      if (!username) {
          return res.status(400).json({ error: "O username é obrigatório" });
      }

      const user = await User.findOne({ where: { username } });

      if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const hash = await bcrypt.hash(username, 10);
      await user.update({ password: hash });

      res.json({ message: `Senha do usuário ${username} foi resetada com sucesso!` });

  } catch (error) {
      console.error("Erro ao resetar senha:", error);
      res.status(500).json({ error: "Erro ao resetar senha", details: error.message });
  }
});

// Rota para remover um usuário
app.delete('/admin/remover-usuario', verifyToken, async (req, res) => {
  try {
      if (req.user.username.toLowerCase() !== 'admin') {
          return res.status(403).json({ error: "Acesso negado" });
      }

      const { id } = req.query;

      if (!id) {
          return res.status(400).json({ error: "O ID do usuário é obrigatório" });
      }

      const user = await User.findByPk(id);

      if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
      }

      await user.destroy();

      res.json({ message: `Usuário ${user.username} foi removido com sucesso!` });

  } catch (error) {
      console.error("Erro ao remover usuário:", error);
      res.status(500).json({ error: "Erro ao remover usuário", details: error.message });
  }
});

// Agendar uma tarefa para rodar todos os dias à meia-noite
//No caso apaga todas entradas anteriores a 'n' dias para fins de preservação do BD
cron.schedule('0 0 * * *', async () => {
  const n = 3;
  try {
    // Calcula a data limite: 'n' dias atrás (inclusive)
    const cutoffDate = moment().subtract(n, 'days').format("YYYY-MM-DD");
    console.log(`Executando limpeza: apagando registros com dia <= ${cutoffDate}`);

    // Apaga todas as entradas cuja data seja menor ou igual à data limite
    const deletedCount = await Meals.destroy({
      where: {
        dia: {
          [Op.lte]: cutoffDate
        }
      }
    });

    console.log(`Limpeza concluída: ${deletedCount} registros apagados.`);
  } catch (error) {
    console.error("Erro ao executar limpeza de registros antigos:", error);
  }
});

app.listen(port, () => {
	console.log(`Servidor na porta ${port}`)
});
