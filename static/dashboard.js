
function gerarListaDeDatas() {
    const datas = [];
    const agora = new Date();
  
    // Verifica a hora atual
    const horaAtual = agora.getHours();
    const primeiroDia = new Date();
  
    if (horaAtual < 12) {
      // Antes do meio-dia: pode arranchar para amanhã (D+1)
      primeiroDia.setDate(primeiroDia.getDate() + 1);
    } else {
      // Depois do meio-dia: pode arranchar apenas para D+2
      primeiroDia.setDate(primeiroDia.getDate() + 2);
    }
  
    // Gera 8 dias a partir do primeiro dia possível
    for (let i = 0; i < 10; i++) {
      const dia = String(primeiroDia.getDate()).padStart(2, '0');
      const mes = String(primeiroDia.getMonth() + 1).padStart(2, '0');
      const ano = primeiroDia.getFullYear();
      datas.push(`${dia}/${mes}/${ano}`);
      primeiroDia.setDate(primeiroDia.getDate() + 1);
    }
  
    return datas;
  }

dias = gerarListaDeDatas();
function obterDiaDaSemana(dataStr) {
    // Supondo que dataStr esteja no formato "DD/MM/YYYY"
    const [dia, mes, ano] = dataStr.split("/");
    // Cria um objeto Date usando o formato ISO "YYYY-MM-DD"
    const dataObj = new Date(`${ano}-${mes}-${dia}`);
    const diasDaSemana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado","Domingo"];
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
            const username = data.username;
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

async function mudarSenha() {
            try {
                // Obtém os valores dos campos de entrada
                const oldpass = document.getElementById('oldpass').value.trim();
                const newpass = document.getElementById('newpass').value.trim();
        
                // Verifica se os campos estão preenchidos
                if (!oldpass || !newpass) {
                    alert("Todos os campos devem ser preenchidos.");
                    return;
                }
                // Faz a requisição para a API de mudança de senha
                const response = await fetch('/pass_change', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ oldpass, newpass })
                });
        
                const data = await response.json();
        
                if (response.ok) {
                    alert(data.message); // Exibe a mensagem de sucesso
                } else {
                    alert(`Erro: ${data.error}`); // Exibe a mensagem de erro
                }
            } catch (error) {
                console.error("Erro ao mudar a senha:", error);
                alert("Erro ao mudar a senha.");
            }
        }
        


function obterSelecoes(user_id) {
    fetch(`/refeicoes-usuario?user_id=${user_id}`)
        .then(response => response.json())
        .then(data => {
            //DEPURAÇÃO
            //console.log("Refeições carregadas:", data.refeicoesFormatadas, "para o usuário", data.usuario);

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
                    //Depuração
                    //console.log(`Refeições para ${dataDia}:`, refeicoes);

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
    //DEPURAÇÃO
    //console.log("Seleções finais para envio:", selecoes);

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
        //DEPURAÇÃO
        //console.log("Resposta do servidor:", data);
        alert("Refeições atualizadas com sucesso!");

    })
    .catch(error => console.error("Erro ao salvar seleções:", error));
}

gerarTabela();