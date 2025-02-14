// Função para enviar as seleções para o servidor
function enviarSelecoes(user_id) {
    // Aqui você pode incluir o código que obtém os dados das refeições selecionadas
    console.log('Enviando seleções para o usuário ID:', user_id);

    // Código para processar e salvar as seleções no banco de dados
}




// Função para carregar as seleções do usuário
function obterSelecoes(user_id) {
    // Buscar as refeições selecionadas para o usuário no banco de dados
    fetch(`/api/get-selecoes?user_id=${user_id}`)
        .then(response => response.json())
        .then(data => {
            const tabela = document.getElementById("tabela");
            const rows = tabela.getElementsByTagName("tr");

            // Iterar sobre as linhas da tabela (exceto o cabeçalho) e atualizar os checkboxes
            for (let i = 1; i < rows.length; i++) {
                const cells = rows[i].getElementsByTagName("td");
                const dataDia = cells[0].textContent;

                // Verificar as seleções para o dia atual
                const selecao = data.find(item => item.dia === dataDia);

                if (selecao) {
                    // Se a refeição foi selecionada para o dia, marcar os checkboxes correspondentes
                    cells[1].getElementsByTagName("input")[0].checked = selecao.tipo_refeicao.includes('cafe');
                    cells[2].getElementsByTagName("input")[0].checked = selecao.tipo_refeicao.includes('almoco');
                    cells[3].getElementsByTagName("input")[0].checked = selecao.tipo_refeicao.includes('janta');
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

    // Iterar sobre as linhas da tabela, ignorando a primeira (cabeçalho)
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        const dataDia = cells[0].textContent;

        // Verificar quais checkboxes estão marcadas para cada refeição
        const cafe = cells[1].getElementsByTagName("input")[0].checked;
        const almoco = cells[2].getElementsByTagName("input")[0].checked;
        const janta = cells[3].getElementsByTagName("input")[0].checked;

        const tipo_refeicao = [];
        if (cafe) tipo_refeicao.push('cafe');
        if (almoco) tipo_refeicao.push('almoco');
        if (janta) tipo_refeicao.push('janta');

        // Adicionar a seleção para o banco de dados
        if (tipo_refeicao.length > 0) {
            selecoes.push({
                dia: dataDia,
                tipo_refeicao: tipo_refeicao
            });
        }
    }

    // Enviar as seleções para o servidor para serem salvas no banco de dados
    fetch('/api/salvar-selecoes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: user_id, selecoes: selecoes })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Seleções salvas com sucesso!");
        } else {
            alert("Erro ao salvar seleções.");
        }
    })
    .catch(error => {
        console.error("Erro ao salvar seleções:", error);
        alert("Erro na comunicação com o servidor.");
    });
}
