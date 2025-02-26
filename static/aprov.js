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

    const dataDropdown = document.getElementById("data-dropdown");
    dias.forEach(data => {
        let option = document.createElement("option");
        option.value = data;
        option.textContent = data;
        dataDropdown.appendChild(option);
    });
    // Define o valor default como o primeiro disponível (ou outro, conforme sua lógica)
    if (dataDropdown.options.length > 0) {
        dataDropdown.value = dataDropdown.options[1].value;
    }

    // Se existir o dropdown de refeição, preenche-o
    const refeicaoDropdown = document.getElementById("refeicao-dropdown");
    if (refeicaoDropdown) {
        const refeicoes = ['Cafe', 'Almoco', 'Janta'];
        refeicoes.forEach(refeicao => {
            let option = document.createElement("option");
            option.value = refeicao.toLowerCase(); // Em minúsculas para corresponder ao banco
            option.textContent = refeicao;
            refeicaoDropdown.appendChild(option);
        });
        if (refeicaoDropdown.options.length > 0) {
            refeicaoDropdown.value = refeicaoDropdown.options[1].value;
        }
    }
}

function buscarDadosAprov() {
    const dataSelecionada = document.getElementById("data-dropdown").value;
    const grupoSelecionado = document.getElementById("grupo-dropdown").value; // Valor como string ou convertido para int, se necessário
    
    fetch(`/aprov_dashboard_data?data=${encodeURIComponent(dataSelecionada)}&grupo=${encodeURIComponent(grupoSelecionado)}`)
      .then(response => response.json())
      .then(data => {
        console.log("Dados retornados (aprov):", data);
        atualizarTabelaUsuarios(data.usuarios, data.arranchados);
      })
      .catch(error => console.error("Erro ao carregar dados da dashboard de aprovação:", error));
  }
  
  function atualizarTabelaUsuarios(usuarios, arranchados) {
    const tbody = document.getElementById("tabela-aprov");
    tbody.innerHTML = ""; // Limpa a tabela
  
    // Função auxiliar que escreve um bloco: cabeçalho mesclado e linhas com os nomes
    function escreverBloco(titulo, lista) {
      // Cria a linha de cabeçalho para o bloco e mescla as células (aqui, usando colSpan 1; ajuste se houver mais colunas)
      const headerRow = document.createElement("tr");
      const headerCell = document.createElement("td");
      headerCell.colSpan = 1;
      headerCell.textContent = titulo;
      headerCell.style.fontWeight = "bold";
      headerCell.style.textAlign = "center";
      headerRow.appendChild(headerCell);
      tbody.appendChild(headerRow);
  
      // Se a lista estiver vazia, exibe uma mensagem
      if (lista.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.textContent = "Nenhum arranchado";
        cell.style.fontStyle = "italic";
        row.appendChild(cell);
        tbody.appendChild(row);
      } else {
        // Para cada nome na lista, cria uma nova linha
        lista.forEach(nome => {
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.textContent = nome;
          row.appendChild(cell);
          tbody.appendChild(row);
        });
      }
    }
  
    // Cria os blocos para cada refeição
    escreverBloco("Arranchados para o Café", arranchados.cafe);
    escreverBloco("Arranchados para o Almoço", arranchados.almoco);
    escreverBloco("Arranchados para a Janta", arranchados.janta);
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
  
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("gerarRelatorio");
    if (btn) {
      btn.addEventListener("click", gerarRelatorio);
    }
  });
  
  


 
  

document.addEventListener("DOMContentLoaded", () => {
    preencherDropdowns();
    buscarDadosAprov();
    document.getElementById("data-dropdown").addEventListener("change", buscarDadosAprov);
    document.getElementById("grupo-dropdown").addEventListener("change", buscarDadosAprov);
});