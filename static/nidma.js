document.addEventListener("DOMContentLoaded", () => {
    carregarUsuarios();
});

// Função para carregar a lista de usuários no painel admin
async function carregarUsuarios() {
    try {
        const response = await fetch('/admin/usuarios');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        const tabela = document.getElementById('tabela-usuarios');
        tabela.innerHTML = ""; // Limpa a tabela antes de inserir os novos usuários

        // Criando o cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Usuário (username)</th>
                <th>Nome de Guerra (nome_pg)</th>
                <th>Grupo Militar (grupo)</th>
                <th>Ações</th>
            </tr>
        `;
        tabela.appendChild(thead);
        //Corpo da tabela
        const tbody = document.createElement('tbody');
        data.usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.nome_pg}</td>
                <td>${user.grupo}</td>
                <td>
                    <button class="botao-logout" onclick="resetarSenha('${user.username}')">Resetar Senha</button>
                    <button class="botao-logout" onclick="removerUsuario(${user.id})">Remover</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tabela.appendChild(tbody);
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        alert("Erro ao carregar usuários.");
    }
}

// Função para criar um novo usuário
async function criarUsuario() {
    const username = document.getElementById("novo-username").value.trim();
    const nome_pg = document.getElementById("novo-nome_pg").value.trim();
    const grupo = parseInt(document.getElementById('grupo').value, 10);
    const senha = document.getElementById('senha').value.trim();

    if (!username || !nome_pg || !grupo || !senha) {
        alert("Todos os campos devem ser preenchidos.");
        return;
    }

    try {
        const response = await fetch('/admin/criar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, nome_pg, grupo, senha })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert(data.message);
        carregarUsuarios(); // Atualiza a lista de usuários

    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        alert("Erro ao criar usuário.");
    }
}

// Função para resetar a senha de um usuário
async function resetarSenha(username) {
    if (!confirm(`Tem certeza que deseja resetar a senha de ${username}?`)) return;

    try {
        const response = await fetch(`/admin/resetar-senha?username=${encodeURIComponent(username)}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert(data.message);

    } catch (error) {
        console.error("Erro ao resetar senha:", error);
        alert("Erro ao resetar senha.");
    }
}

// Função para remover um usuário
async function removerUsuario(userId) {
    if (!confirm(`Tem certeza que deseja remover este usuário?`)) return;

    try {
        const response = await fetch(`/admin/remover-usuario?id=${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        alert(data.message);
        carregarUsuarios(); // Atualiza a lista de usuários

    } catch (error) {
        console.error("Erro ao remover usuário:", error);
        alert("Erro ao remover usuário.");
    }
}
