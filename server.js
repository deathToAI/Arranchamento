require('dotenv').config({path:__dirname+'/sec.env'});
const express = require('express')
const sequelize = require('./database/database')
const User = require('./database/Users')
const Meals = require ('./database/meals')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const cookieParser = require('cookie-parser');
const moment = require('moment');
const { where, Op } = require('sequelize');
const cron = require('node-cron');
const path = require('path');
const app = express();
app.use(express.static('public'));
app.use('/static', express.static('static'));
app.use(express.json()); // Middleware para parsear JSON
app.use(cookieParser()); // Habilita o uso de cookies
const ExcelJS = require('exceljs');
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
		return res.redirect('/'); // Redireciona se o token for inválido
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

    // Define a URL de redirecionamento com base no username
    let redirectUrl = '/dashboard';
    if (user.username.toLowerCase() === 'furriel') {
      redirectUrl = '/furriel_dashboard';
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
        console.log("Refeições recebidas para salvar:", refeicoes);

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

        console.log("Refeições já cadastradas no banco:", refeicoesNoBanco);

        // Refeições que o usuário selecionou no frontend
        const refeicoesSelecionadas = refeicoes.flatMap(refeicao =>
            refeicao.tipo_refeicao.map(tipo => ({
                user_id: user_id,
                dia: moment(refeicao.dia, "DD/MM/YYYY").format("YYYY-MM-DD"),
                tipo_refeicao: tipo
            }))
        );

        console.log("Refeições processadas a serem mantidas:", refeicoesSelecionadas);

        // Identifica quais refeições foram desmarcadas (estavam no banco, mas não estão no frontend)
        const refeicoesParaRemover = refeicoesNoBanco.filter(refNoBanco =>
            !refeicoesSelecionadas.some(refNova =>
                refNoBanco.dia === refNova.dia && refNoBanco.tipo_refeicao === refNova.tipo_refeicao
            )
        );

        console.log("Refeições a serem removidas:", refeicoesParaRemover);

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
        usuarios.forEach(usuario => console.log(usuario.nome_pg));
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


      console.log(`Os usuários arranchados para o ${refeicao} em ${dataFormatada} são : ${arranchados}`);
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

    // Converte a data para o formato esperado pelo banco de dados
    const diaFormatado = moment(dia, "DD/MM/YYYY").format("YYYY-MM-DD");

    // Se o array de seleções estiver vazio, apaga todos os registros para esse dia e refeição(Desarrancha todos)
    if (!Array.isArray(selecoes) || selecoes.length === 0) {
      const deletados = await Meals.destroy({
        where: {
          dia: diaFormatado,
          tipo_refeicao: tipo_refeicao.toLowerCase()
        }
      });
      console.log(`Registros deletados para ${diaFormatado} e ${tipo_refeicao.toLowerCase()}:`, deletados);
      return res.json({ message: "Registros apagados para o dia e refeição especificados." });
    }


    try {
      console.log("Seleções recebidas:", selecoes);
    
      // Converte as datas no formato correto e apaga os registros antes de inserir os novos
      const diaFormatado = moment(dia, "DD/MM/YYYY").format("YYYY-MM-DD");
      await Meals.destroy({
        where: {
          dia: diaFormatado,
          tipo_refeicao: tipo_refeicao.toLowerCase()
        }
      });
      console.log(`Registros removidos para o dia ${diaFormatado} e refeição ${tipo_refeicao.toLowerCase()}`);
    
      // Insere as novas seleções enviadas
      for (const sel of selecoes) {
        const diaFormatado = moment(sel.dia, "DD/MM/YYYY").format("YYYY-MM-DD");
        await Meals.create({
          user_id: sel.user_id,
          dia: diaFormatado,
          tipo_refeicao: sel.tipo_refeicao.toLowerCase()
        });
      }
    
      console.log("Seleções atualizadas com sucesso.");
      res.json({ message: "Seleções registradas com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar seleções múltiplas:", error);
      res.status(500).json({ error: "Erro ao salvar seleções", details: error.message });
    }});
    
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

app.get('/aprov',async(req,res)=>{
  try{
  res.sendFile(path.join(__dirname, 'public', 'aprov.html'));
  }catch(error){
    res.status(500).send("Erro ao acessar a página de aprovisionamento");
  }});

  app.get('/download-arranchados', async (req, res) => {
    try {
      const { data, grupo } = req.query;
      if (!data || !grupo) {
        return res.status(400).send("Parâmetros 'data' e 'grupo' são obrigatórios.");
      }
  
      // Converte a data do parâmetro para o formato ISO (para busca) e mantém o formato para exibição.
      const dataFormatadaIso = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
      const dataFormatadaDisplay = data; // "DD/MM/YYYY"
  
      // Busca os usuários que pertencem ao grupo informado
      const usuarios = await User.findAll({
        where: { grupo: parseInt(grupo, 10) },
        attributes: ['id', 'nome_pg']
      });
  
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
  
      // Linha 1: Título - mescla de A1 até E1
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Arranchamento para ${dataFormatadaDisplay}`;
      titleCell.font = { bold: true, size: 18 };
      titleCell.alignment = { horizontal: 'center' };
  
      let currentRow = 2;
  
      // Função auxiliar para escrever um bloco: cabeçalho e lista de nomes
      function writeBlock(header, nomes) {
        // Cabeçalho do bloco: mescla de A(currentRow) até D(currentRow)
        const headerRange = `A${currentRow}:D${currentRow}`;
        worksheet.mergeCells(headerRange);
        worksheet.getCell(`A${currentRow}`).value = header;
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow++;
        // Preenche as linhas com os nomes, um nome por linha na coluna A
        nomes.forEach(nome => {
          worksheet.getCell(`A${currentRow}`).value = nome;
          currentRow++;
        });
      }
  
      // Escreve o bloco para "Café"
      writeBlock("Café", arranchadosCafe);
      // Escreve o bloco para "Almoço"
      writeBlock("Almoço", arranchadosAlmoco);
      // Escreve o bloco para "Janta"
      writeBlock("Janta", arranchadosJanta);
  
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

  app.get('/aprov_dashboard_data', async (req, res) => {
    const { data, grupo } = req.query;
    try {
      // //Depuração
      // console.log("Query params recebidos:", req.query);
      // console.log(data);
      // console.log(grupo);
      // Converte a data para o formato usado no banco de dados
      const dataFormatada = moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
      //console.log(`A data a ser buscada é: ${dataFormatada}`);
      //console.log(`Grupo a ser buscado é: ${grupo}`);
  
      // Busca todos os usuários, incluindo o campo "grupo"
      const usuarios = await User.findAll({
        attributes: ['id', 'nome_pg', 'grupo']
      });
      // Busca todas as refeições para o dia informado
      const meals = await Meals.findAll({
        where: { dia: dataFormatada }
      });
      // Converte o parâmetro grupo para número
      const grupoNum = parseInt(grupo, 10);
            // Filtra os usuários que pertencem ao grupo informado (convertendo o grupo de cada usuário para número)

      const usuariosFiltrados = usuarios.filter(u => parseInt(u.grupo, 10) === grupoNum);
      // DEPURAÇÃO
      //console.log("Usuários filtrados:", usuariosFiltrados.map(u => u.nome_pg));
      // usuarios.forEach(u => {
      //   console.log(u.nome_pg, u.grupo, typeof u.grupo);
      // });

      // Agrupa os aprovados (arranchados) por tipo de refeição para os usuários filtrados
      const arranchados = {
        cafe: usuariosFiltrados
          .filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'cafe'))
          .map(u => u.nome_pg),
        almoco: usuariosFiltrados
          .filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'almoco'))
          .map(u => u.nome_pg),
        janta: usuariosFiltrados
          .filter(u => meals.some(m => m.user_id === u.id && m.tipo_refeicao.toLowerCase() === 'janta'))
          .map(u => u.nome_pg)
      };

      console.log(`Os arranchados para o dia ${dataFormatada} e grupo ${grupoNum} são:`, arranchados);
      res.json({ usuarios: usuariosFiltrados, meals, arranchados });
      } catch (error) {
      console.error("Erro ao buscar dados da dashboard de aprovação:", error);
      res.status(500).json({ error: "Erro ao buscar dados", details: error.message });
      }
      });
  
app.listen(port, () => {
	console.log(`Servidor na porta ${port}`)
});
