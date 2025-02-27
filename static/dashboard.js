function gerarListaDeDatas() {
    const datas = [];
    const hoje = new Date();

    // Começa do dia depois de amanhã
    hoje.setDate(hoje.getDate() + 2); 
    

    for (let i = 0; i < 8; i++) {
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        
    

        datas.push(`${dia}/${mes}/${ano}`);

        // Avança para o próximo dia
        hoje.setDate(hoje.getDate() + 1);
    }

    return datas;
}

dias = gerarListaDeDatas();
function obterDiaDaSemana(dataStr) {
    // Supondo que dataStr esteja no formato "DD/MM/YYYY"
    const [dia, mes, ano] = dataStr.split("/");
    // Cria um objeto Date usando o formato ISO "YYYY-MM-DD"
    const dataObj = new Date(`${ano}-${mes}-${dia}`);
    const diasDaSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return diasDaSemana[dataObj.getDay()];
  }
  
function gerarTabela(){
     
   
    const tabela = document.getElementById("tabela");

    const headers = ["Dia da Semana","Data", "Cafe", "Almoço", "Janta"];
    const thead = document.createElement("thead");
    const headrow = document.createElement("tr");

    headers.forEach(titulo =>{
        const th = document.createElement("th");
        th.textContent = titulo;
        headrow.appendChild(th);
    });

    //Cria os cabeçalhos da tabela
    thead.appendChild(headrow);
    tabela.append(thead);
    tabela.style.width = '100%';
    tabela.style.border = '1px solid black';
    tabela.style.borderCollapse = 'collapse'; // Para bordas mais limpas
    
   // Para cada data no array 'dias'
  dias.forEach(dataStr => {
    const tr = document.createElement("tr");

    // Coluna 1: Dia da Semana
    const tdSemana = document.createElement("td");
    tdSemana.textContent = obterDiaDaSemana(dataStr);
    tdSemana.style.border = "1px solid black";
    tdSemana.style.padding = "5px";
    tr.appendChild(tdSemana);

    // Coluna 2: Data
    const tdData = document.createElement("td");
    tdData.textContent = dataStr;
    tdData.style.border = "1px solid black";
    tdData.style.padding = "5px";
    tr.appendChild(tdData);

    // Colunas 3 a 5: Checkboxes para "Café", "Almoço" e "Janta"
    for (let i = 0; i < 3; i++) {
      const td = document.createElement("td");
      td.style.border = "1px solid black";
      td.style.padding = "5px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.style.display = "block";
      checkbox.style.margin = "0 auto";
      td.appendChild(checkbox);
      tr.appendChild(td);
    }
    tabela.appendChild(tr);
  });
}


fetch('/dashboard-data')
        .then(response => response.json())
        .then(data => {
            const welcomeMessage = document.getElementById('welcome-message');
            welcomeMessage.textContent = `Bem-vindo, ${data.username}!`;
            const title = document.getElementById('title');
            title.textContent = `Arranchamento - ${data.username}`
            // Armazenar o ID do usuário para usá-lo no arranchamento
            const usuarioId = data.user_id;
            //console.log(`usuarioId:${usuarioId}`);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do dashboard:', error);
        });

function obterSelecoes(user_id) {
    fetch(`/refeicoes-usuario?user_id=${user_id}`)
        .then(response => response.json())
        .then(data => {
            console.log("Refeições carregadas:", data.refeicoesFormatadas, "para o usuário", data.usuario);

            const tabela = document.getElementById("tabela");
            const rows = tabela.getElementsByTagName("tr");

            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName("td");
                const dataDia = cells[1].textContent;

                if (data.refeicoesFormatadas[dataDia]) {
                    let refeicoes = data.refeicoesFormatadas[dataDia];

                    // Se `tipo_refeicao` estiver como string separada por vírgulas, converter para array
                    if (Array.isArray(refeicoes)) {
                        refeicoes = refeicoes.flatMap(item => 
                            item.includes(',') ? item.split(',') : item
                        );
                    }
                    
                    console.log(`Refeições para ${dataDia}:`, refeicoes);

                    cells[2].getElementsByTagName("input")[0].checked = refeicoes.includes('cafe');
                    cells[3].getElementsByTagName("input")[0].checked = refeicoes.includes('almoco');
                    cells[4].getElementsByTagName("input")[0].checked = refeicoes.includes('janta');
                }
            }
        })
        .catch(error => console.error("Erro ao carregar seleções:", error));
}

// Função para salvar as seleções no banco de dados quando o botão é clicado
function salvarSelecoes(user_id) {
    const tabela = document.getElementById("tabela");
    const rows = tabela.getElementsByTagName("tr");
    const selecoes = [];

    // Iterar sobre as linhas da tabela, ignorando o cabeçalho
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        const dataDia = cells[1].textContent;

        const cafe = cells[2].getElementsByTagName("input")[0].checked;
        const almoco = cells[3].getElementsByTagName("input")[0].checked;
        const janta = cells[4].getElementsByTagName("input")[0].checked;

        const tipo_refeicao = [];
        if (cafe) tipo_refeicao.push('cafe');
        if (almoco) tipo_refeicao.push('almoco');
        if (janta) tipo_refeicao.push('janta');

        // Apenas adiciona ao array se houver alguma refeição marcada
        selecoes.push({ dia: dataDia, tipo_refeicao });
    }

    console.log("Seleções finais para envio:", selecoes);

    // Enviar os dados para o backend
    fetch('/salvar-selecoes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id, refeicoes: selecoes })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao salvar seleções: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Resposta do servidor:", data);
        alert("Refeições atualizadas com sucesso!");
    })
    .catch(error => console.error("Erro ao salvar seleções:", error));
}


gerarTabela();