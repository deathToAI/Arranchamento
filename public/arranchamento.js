fetch('/dashboard-data')
        .then(response => response.json())
        .then(data => {
            const welcomeMessage = document.getElementById('welcome-message');
            welcomeMessage.textContent = `Bem-vindo, ${data.username}!`;
            // Armazenar o ID do usuário para usá-lo no arranchamento
            const usuarioId = data.user_id;
            console.log(`usuarioId:${usuarioId}`);
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
                const dataDia = cells[0].textContent;

                if (data.refeicoesFormatadas[dataDia]) {
                    let refeicoes = data.refeicoesFormatadas[dataDia];

                    // Se `tipo_refeicao` estiver como string separada por vírgulas, converter para array
                    if (Array.isArray(refeicoes)) {
                        refeicoes = refeicoes.flatMap(item => 
                            item.includes(',') ? item.split(',') : item
                        );
                    }
                    
                    console.log(`Refeições para ${dataDia}:`, refeicoes);

                    cells[1].getElementsByTagName("input")[0].checked = refeicoes.includes('cafe');
                    cells[2].getElementsByTagName("input")[0].checked = refeicoes.includes('almoco');
                    cells[3].getElementsByTagName("input")[0].checked = refeicoes.includes('janta');
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
        const dataDia = cells[0].textContent;

        const cafe = cells[1].getElementsByTagName("input")[0].checked;
        const almoco = cells[2].getElementsByTagName("input")[0].checked;
        const janta = cells[3].getElementsByTagName("input")[0].checked;

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

