import { db, auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Proteção: Redireciona se não estiver logado
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
});

window.logout = () => signOut(auth);

// Máscara e Salvar
const mask = IMask(document.getElementById('telCliente'), { mask: '(00) 00000-0000' });
document.getElementById('btnSalvar').addEventListener('click', async () => {
    const nome = document.getElementById('nomeCliente').value;
    if (!nome) return alert("Digite o nome");
    await addDoc(collection(db, "customers"), {
        name: nome, phone: mask.value, status: "Lead", createdAt: new Date().getTime()
    });
    mask.value = ""; document.getElementById('nomeCliente').value = "";
});

// Listagem e Filtro
let todosClientes = [];
onSnapshot(query(collection(db, "customers"), orderBy("createdAt", "desc")), (snap) => {
    todosClientes = snap.docs;
    render(todosClientes);
    // Atualiza contadores aqui...
});

function render(docs) {
    const lista = document.getElementById('tabelaClientes');
    lista.innerHTML = "";
    docs.forEach(d => {
        const c = d.data();
        lista.innerHTML += `<tr>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td>${c.name}</td>
            <td>${c.status}</td>
            <td><button class="btn btn-sm btn-danger" onclick="excluir('${d.id}')">X</button></td>
        </tr>`;
    });
}

// Exportar
document.getElementById('btnExportar').addEventListener('click', () => {
    let csv = "Data;Nome;Telefone;Status\n";
    todosClientes.forEach(d => {
        const c = d.data();
        csv += `${new Date(c.createdAt).toLocaleDateString()};${c.name};${c.phone};${c.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'crm.csv';
    a.click();
});