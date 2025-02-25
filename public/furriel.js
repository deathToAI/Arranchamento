function gerarListaDeDatas() {
    const datas = [];
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 2);

    for (let i = 0; i < 8; i++) {
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        datas.push(`${dia}/${mes}/${ano}`);
        hoje.setDate(hoje.getDate() + 1);
    }
    return datas;
}

function preencherDropdowns() {
    const dias = gerarListaDeDatas();
    const refeicoes = ['Cafe', 'Almoco', 'Janta'];

    const dataDropdown = document.getElementById("data-dropdown");
    dias.forEach(data => {
        let option = document.createElement("option");
        option.value = data;
        option.textContent = data;
        dataDropdown.appendChild(option);
    });
    // Define o valor default como o primeiro disponível
    if (dataDropdown.options.length > 0) {
        dataDropdown.value = dataDropdown.options[1].value;
    }

    const refeicaoDropdown = document.getElementById("refeicao-dropdown");
    refeicoes.forEach(refeicao => {
        let option = document.createElement("option");
        option.value = refeicao.toLowerCase(); // Em minúsculas para corresponder ao banco
        option.textContent = refeicao;
        refeicaoDropdown.appendChild(option);
    });
    // Define o valor default como o primeiro disponível
    if (refeicaoDropdown.options.length > 0) {
        refeicaoDropdown.value = refeicaoDropdown.options[1].value;
    }
}

function buscarUsuariosPorRefeicao() {
    const dataSelecionada = document.getElementById("data-dropdown").value;
    const refeicaoSelecionada = document.getElementById("refeicao-dropdown").value;
    const grupoSelecionado = parseInt(document.getElementById("grupo-dropdown").value, 10);
    document.getElementById("header-refeicao").textContent = refeicaoSelecionada.toUpperCase();
    console.log("A refeição é:", refeicaoSelecionada);

    fetch(`/furriel_dashboard_data?data=${dataSelecionada}&refeicao=${refeicaoSelecionada}`)
        .then(response => response.json())
        .then(data => {
            console.log("Dados retornados:", data);
            // Filtra os usuários que pertencem ao grupo selecionado
            const usuariosFiltrados = data.usuarios.filter(u => u.grupo === grupoSelecionado);
            
            // Filtra os arranchados para que sejam apenas os que pertencem ao grupo selecionado
            const arranchadosFiltrados = data.arranchados.filter(nome => {
              const user = data.usuarios.find(u => u.nome_pg === nome);
              return user && user.grupo === grupoSelecionado;
            });
            
            console.log(`Usuários filtrados para o grupo ${grupoSelecionado}:`, usuariosFiltrados);
            console.log(`Arranchados filtrados para o grupo ${grupoSelecionado}:`, arranchadosFiltrados);
            
            atualizarTabelaUsuarios(usuariosFiltrados, arranchadosFiltrados);
          })
        .catch(error => console.error("Erro ao carregar dados da dashboard:", error));
}

function atualizarTabelaUsuarios(usuarios, arranchados) {
    const tbody = document.getElementById("tabela-arranchados");
    tbody.innerHTML = ""; // Limpa a tabela

    usuarios.forEach(usuario => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-user-id", usuario.id);

        const tdNome = document.createElement("td");
        tdNome.textContent = usuario.nome_pg;

        const tdStatus = document.createElement("td");
        tdStatus.classList.add("status-presenca");
        tdStatus.setAttribute("data-usuario", usuario.nome_pg);

        // Cria o span que exibirá o nome da refeição (baseado no dropdown)
        const spanRefeicao = document.createElement("span");
        spanRefeicao.classList.add("refeicao-nome");
        // Usa o valor atual do dropdown (em maiúsculas)
        spanRefeicao.textContent = document.getElementById("refeicao-dropdown").value.toUpperCase();

        // Cria o checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        // Se o array arranchados (de IDs) incluir o id do usuário, marca o checkbox
        if (arranchados.some(nome => nome.trim().toLowerCase() === usuario.nome_pg.trim().toLowerCase())) {
            checkbox.checked = true;
          }

        // Constrói a célula de status
        tdStatus.appendChild(spanRefeicao);
        tdStatus.appendChild(checkbox);

        // Adiciona as células à linha e a linha ao corpo da tabela
        tr.appendChild(tdNome);
        tr.appendChild(tdStatus);
        tbody.appendChild(tr);
    });
}


function salvarSelecoesMultiplos() {
    // Obtém os valores selecionados nos dropdowns
    const dataSelecionada = document.getElementById("data-dropdown").value;
    const refeicaoSelecionada = document.getElementById("refeicao-dropdown").value;
    
    //Depuração
    //console.log("Data selecionada:", dataSelecionada);
    
    //Define o grupo a ser arranchado

 
    // Obtem a tabela de usuários arranchados
    const tbody = document.getElementById("tabela-arranchados");
    const rows = tbody.getElementsByTagName("tr");
  
    // Array para armazenar as seleções de cada usuário
    const selecoes = [];
    
    // Itera sobre cada linha da tabela
    for (let i = 0; i < rows.length; i++) {
      // Cada linha deve ter o atributo data-user-id definido
      const userId = rows[i].getAttribute("data-user-id");
      
      // Busca o checkbox dentro da linha (supondo que há apenas um por linha)
      const checkbox = rows[i].querySelector("input[type='checkbox']");
      
      // Se o checkbox estiver marcado, adiciona essa seleção ao array
      if (checkbox && checkbox.checked) {
        selecoes.push({
          user_id: userId,
          dia: dataSelecionada,
          tipo_refeicao: refeicaoSelecionada.toLowerCase()
        });
      }
    }
    //Depuração
    console.log("Seleções finais para envio:", selecoes);
    
    // Envia os dados para o backend através de uma nova rota, por exemplo, /salvar-selecoes-multiplos
    fetch('/salvar-selecoes-multiplos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selecoes,
        dia: dataSelecionada,
        tipo_refeicao: refeicaoSelecionada
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao salvar seleções: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Resposta do servidor:", data);
        alert("Arranchamento atualizado com sucesso!");
      })
      .catch(error => console.error("Erro ao salvar seleções:", error));
  }
  
function toggleSelecionarTudo() {
    const checkboxes = document.querySelectorAll('#tabela-arranchados input[type="checkbox"]');
    
    // Verifica se todos estão marcados
    let allChecked = true;
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        allChecked = false;
      }
    });
    
    // Se todos estiverem marcados, desmarca todos; caso contrário, marca todos.
    checkboxes.forEach(checkbox => {
      checkbox.checked = !allChecked;
    });
  }

document.addEventListener("DOMContentLoaded", () => {
    preencherDropdowns();
    buscarUsuariosPorRefeicao();
    document.getElementById("header-refeicao").textContent = document.getElementById("refeicao-dropdown").value.toUpperCase();
    document.getElementById("data-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("refeicao-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("grupo-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("toggleSelecionarTudo").addEventListener("click", toggleSelecionarTudo);
});
