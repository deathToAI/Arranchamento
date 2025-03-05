async function entrar() {
    // Captura o formulário de login e o elemento de mensagem
    const loginForm = document.getElementById('loginForm');
    const message = document.getElementById('message');
    
    // Adiciona um listener para o submit do formulário
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // Impede o recarregamento da página
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        // Envia uma requisição POST para a rota /login
        const response = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          message.textContent = data.message;
          message.style.color = 'green';
          window.location.href = data.redirect;
        } else {
          message.textContent = data.error;
          message.style.color = 'red';
        }
      } catch (error) {
        message.textContent = 'Erro ao conectar ao servidor';
        message.style.color = 'red';
        console.error(error);
      }
    });
  }
  
function logout() {
    fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro no logout: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        //console.log("Logout realizado:", data);
        window.location.href = '/';
      })
      .catch(error => console.error("Erro ao realizar logout:", error));
  }
  
document.addEventListener('DOMContentLoaded', () => {
   entrar(); // Adiciona o listener ao formulário de login
    
    // Se existir um botão de logout, vincula o evento
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  });
  