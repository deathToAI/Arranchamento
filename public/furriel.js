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
    document.getElementById("header-refeicao").textContent = refeicaoSelecionada.toUpperCase();
    console.log("A refeição é :",refeicaoSelecionada);

    fetch(`/furriel_dashboard_data?data=${dataSelecionada}&refeicao=${refeicaoSelecionada}`)
        .then(response => response.json())
        .then(data => {
            console.log("Dados retornados:", data);
            const arranchados = data.arranchados;
            console.log(`Arranchados para o dia ${dataSelecionada} são ${arranchados}`);
            // Processar os dados conforme necessário
            atualizarTabelaArranchados(arranchados);
        })
        .catch(error => console.error("Erro ao carregar dados da dashboard:", error));
    }


function atualizarTabelaArranchados(arranchados) {
const tbody = document.getElementById("tabela-arranchados");
tbody.innerHTML = ""; // Limpa a tabela
arranchados.forEach(nome => {
    const tr = document.createElement("tr");
    const tdNome = document.createElement("td");
    tdNome.textContent = nome;
    const tdStatus = document.createElement("td");
    tdStatus.classList.add("status-presenca");
    tdStatus.setAttribute("data-usuario", nome);
    tdStatus.innerHTML = '<span class="refeicao-nome">Café</span><input type="checkbox">';
    tr.appendChild(tdNome);
    tr.appendChild(tdStatus);
    tbody.appendChild(tr);
});
}


document.addEventListener("DOMContentLoaded", () => {
    preencherDropdowns();
    buscarUsuariosPorRefeicao();
    document.getElementById("header-refeicao").textContent = document.getElementById("refeicao-dropdown").value.toUpperCase();
    document.getElementById("data-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
    document.getElementById("refeicao-dropdown").addEventListener("change", buscarUsuariosPorRefeicao);
});


