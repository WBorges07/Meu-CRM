import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

// 1. MÁSCARA DE TELEFONE
const campoTelefone = document.getElementById('telCliente');
const mask = IMask(campoTelefone, { mask: '(00) 00000-0000' });

// 2. SALVAR NOVO CLIENTE COM DATA
const btnSalvar = document.getElementById('btnSalvar');
btnSalvar.addEventListener('click', async () => {
    const nome = document.getElementById('nomeCliente').value;
    const telefone = mask.value; 

    if (!nome || !telefone) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        await addDoc(collection(db, "customers"), {
            name: nome,
            phone: telefone,
            status: "Lead",
            createdAt: new Date().getTime()
        });
        alert("Cliente salvo com sucesso!");
        document.getElementById('nomeCliente').value = "";
        mask.value = ""; 
    } catch (e) { console.error("Erro ao salvar:", e); }
});

// 3. FUNÇÕES GLOBAIS (STATUS E EXCLUIR)
window.alterarStatus = async (id, novoStatus) => {
    try {
        await updateDoc(doc(db, "customers", id), { status: novoStatus });
    } catch (e) { console.error("Erro ao atualizar:", e); }
};

window.excluirCliente = async (id) => {
    if (confirm("Deseja realmente excluir este cliente?")) {
        try {
            await deleteDoc(doc(db, "customers", id));
        } catch (e) { console.error("Erro ao excluir:", e); }
    }
};

// 4. LISTAGEM, BUSCA E CONTADORES
const tabela = document.getElementById('tabelaClientes');
const campoBusca = document.getElementById('buscaCliente');
let todosOsClientes = [];

const renderizarTabela = (listaDocs) => {
    tabela.innerHTML = "";
    listaDocs.forEach((documento) => {
        const cliente = documento.data();
        const id = documento.id;
        
        const dataFormatada = cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : '---';
        const foneLimpo = cliente.phone ? cliente.phone.replace(/\D/g, '') : '';
        const linkWa = `https://wa.me/55${foneLimpo}`;

        tabela.innerHTML += `
            <tr>
                <td class="align-middle text-muted" style="font-size: 0.85rem;">${dataFormatada}</td>
                <td class="align-middle fw-bold">${cliente.name}</td>
                <td class="align-middle">${cliente.phone || '---'}</td>
                <td class="align-middle">
                    <select onchange="window.alterarStatus('${id}', this.value)" class="form-select form-select-sm">
                        <option value="Lead" ${cliente.status === 'Lead' ? 'selected' : ''}>Lead</option>
                        <option value="Em Negociação" ${cliente.status === 'Em Negociação' ? 'selected' : ''}>Em Negociação</option>
                        <option value="Venda Concluída" ${cliente.status === 'Venda Concluída' ? 'selected' : ''}>Venda Concluída</option>
                    </select>
                </td>
                <td class="align-middle text-end">
                    <div class="d-flex gap-2 justify-content-end">
                        <a href="${linkWa}" target="_blank" class="btn btn-success btn-sm">WhatsApp</a>
                        <button onclick="window.excluirCliente('${id}')" class="btn btn-outline-danger btn-sm">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    });
};

const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    todosOsClientes = snapshot.docs;
    
    let leads = 0, negociacao = 0, vendas = 0;
    snapshot.forEach((doc) => {
        const c = doc.data();
        if (c.status === "Lead") leads++;
        if (c.status === "Em Negociação") negociacao++;
        if (c.status === "Venda Concluída") vendas++;
    });

    document.getElementById('contLead').innerText = leads;
    document.getElementById('contNegociacao').innerText = negociacao;
    document.getElementById('contVenda').innerText = vendas;

    renderizarTabela(todosOsClientes);
});

campoBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = todosOsClientes.filter(doc => doc.data().name.toLowerCase().includes(termo));
    renderizarTabela(filtrados);
});

// 5. EXPORTAR PARA EXCEL
document.getElementById('btnExportar').addEventListener('click', () => {
    if (todosOsClientes.length === 0) return alert("Sem dados.");
    let csv = '\uFEFFData;Nome;Telefone;Status\n';
    todosOsClientes.forEach(doc => {
        const c = doc.data();
        const data = c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '---';
        csv += `${data};${c.name};${c.phone};${c.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "clientes_crm.csv";
    link.click();
});