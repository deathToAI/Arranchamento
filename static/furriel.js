function gerarListaDeDatas() {
    const datas = [];
    const hoje = new Date();
    hoje.setDate(hoje.getDate());

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
  const grupoSelecionadoRaw = document.getElementById("grupo-dropdown").value;
  document.getElementById("header-refeicao").textContent = refeicaoSelecionada.toUpperCase();
  let grupoSelecionado = document.getElementById("grupo-dropdown").value;
  if (grupoSelecionado === "Todos") {
    grupoSelecionado = "1,2,3";
  }

  fetch(`/furriel_dashboard_data?data=${dataSelecionada}&refeicao=${refeicaoSelecionada}`)
      .then(response => response.json())
      .then(data => {
          console.log("Dados retornados:", data);

          
      let usuariosFiltrados = [];
      let arranchadosFiltrados = [];

      if (grupoSelecionadoRaw === "Todos") {
        // Apenas usuários dos grupos 1, 2 e 3
        usuariosFiltrados = data.usuarios.filter(u => [1, 2, 3].includes(u.grupo));
        arranchadosFiltrados = data.arranchados.filter(nome => {
          const user = data.usuarios.find(u => u.nome_pg === nome);
          return user && [1, 2, 3].includes(user.grupo);
        });
      } else {
        const grupoSelecionado = parseInt(grupoSelecionadoRaw, 10);
        usuariosFiltrados = data.usuarios.filter(u => u.grupo === grupoSelecionado);
        arranchadosFiltrados = data.arranchados.filter(nome => {
          const user = data.usuarios.find(u => u.nome_pg === nome);
          return user && user.grupo === grupoSelecionado;
        });
      }

          atualizarTabelaUsuarios(usuariosFiltrados, arranchadosFiltrados);
      })
      .catch(error => console.error("Erro ao carregar dados da dashboard:", error));
}


function atualizarTabelaUsuarios(usuarios, arranchados) {
    const tbody = document.getElementById("tabela-arranchados");
    tbody.innerHTML = ""; // Limpa a tabela

    usuarios.sort((a, b) => a.nome_pg.localeCompare(b.nome_pg));

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
  const dataSelecionada = document.getElementById("data-dropdown").value;
  const refeicaoSelecionada = document.getElementById("refeicao-dropdown").value;

  let grupoSelecionado = document.getElementById("grupo-dropdown").value;

  // Se for "Todos", envia como string "1,2,3"
  if (grupoSelecionado === "Todos") {
    grupoSelecionado = "1,2,3";
  }

  const tbody = document.getElementById("tabela-arranchados");
  const rows = tbody.getElementsByTagName("tr");

  const selecoes = [];

  for (let i = 0; i < rows.length; i++) {
    const userId = rows[i].getAttribute("data-user-id");
    const checkbox = rows[i].querySelector("input[type='checkbox']");
    if (checkbox && checkbox.checked) {
      selecoes.push({
        user_id: userId,
        dia: dataSelecionada,
        tipo_refeicao: refeicaoSelecionada.toLowerCase()
      });
    }
  }

  console.log("Seleções finais para envio:", selecoes);

  fetch('/salvar-selecoes-multiplos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selecoes,
      dia: dataSelecionada,
      tipo_refeicao: refeicaoSelecionada,
      grupo: grupoSelecionado // pode ser string tipo "1", ou "1,2,3"
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
    .catch(error => {
      console.error("Erro ao salvar seleções:", error);
      alert("Erro ao salvar arranchamento.");
    });
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

async function gerarRelatorio() {
    // Obtém os valores dos dropdowns
    const dataSelecionada = document.getElementById("data-dropdown").value;
    const grupoSelecionado = document.getElementById("grupo-dropdown").value;
    // Constrói a URL para a rota de download com os parâmetros
    const url = `/download-arranchados?data=${encodeURIComponent(dataSelecionada)}&grupo=${encodeURIComponent(grupoSelecionado)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
      }
      const blob = await response.blob();
      // Cria um link temporário para download e simula um clique nele
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Arranchados_${dataSelecionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    }
  }

  async function gerarPDF() {
    // Obtém os valores dos dropdowns
    const dataSelecionada = document.getElementById("data-dropdown").value;
    const grupoSelecionado = document.getElementById("grupo-dropdown").value;
  
    // Constrói a URL para a rota de download de PDF
    const url = `/download-pdf?data=${encodeURIComponent(dataSelecionada)}&grupo=${encodeURIComponent(grupoSelecionado)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }
      const blob = await response.blob();
      
      // Cria um link temporário e simula o clique para download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `arranchados_${dataSelecionada}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  }
document.addEventListener("DOMContentLoaded", () => {
    preencherDropdowns();
    buscarUsuariosPorRefeicao();
    document.getElementById("header-refeicao").textContent = document.getElementById("refeicao-dropdown").value.toUpperCase();
    document.getElementById("data-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("refeicao-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("grupo-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("toggleSelecionarTudo").addEventListener("click", toggleSelecionarTudo);
    const btn = document.getElementById("gerarRelatorio");
    if (btn) {
      btn.addEventListener("click", gerarRelatorio);
    }

    const btnPDF = document.getElementById("gerarPDF");
    if (btnPDF) {
      btnPDF.addEventListener("click", gerarPDF);
    }
});
