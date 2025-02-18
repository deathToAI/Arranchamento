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

function gerarTabela(){
     
   
    const tabela = document.getElementById("tabela");

    const headers = ["Data", "Cafe", "Almoço", "Janta"];
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
    
    dias.forEach(dia =>{ //Iteravel "dia" ira passar no array 'dias' e fazer as seguintes tarefas
        //Adicionar datas na tabela
        const tr = document.createElement("tr");
        const tdData = document.createElement("td");
        tdData.textContent = dia;
        tr.appendChild(tdData);
        
        for (let i = 0; i < 3; i++ ){
            const td = document.createElement("td"); //Cria um table data e armazena na variavel td
            const checkbox = document.createElement("input"); // cria um input chamado checkbox
            checkbox.type = "checkbox"; // muda o tipo de input para checkbox
            checkbox.style.margin = "0 auto";
            td.appendChild(checkbox); // coloca a checkbox na tabela
            tr.appendChild(td);
        }
        tabela.appendChild(tr);
    });

    for (let i = 0; i < dias.length; i++){

        //console.log(`Dias : ${dias[i]}`);
    }

}

gerarTabela();