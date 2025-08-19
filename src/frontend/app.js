// This file contains the JavaScript code for the web application.
// It handles interactivity and dynamic behavior of the webpage.

const API_URL = 'http://localhost:8000/api'; // ajuste conforme backend

// Estado global
let alunos = [];
let turmas = [];
let filtros = { turma: '', status: '', busca: '' };
let ordenacao = JSON.parse(localStorage.getItem('ordenacao')) || { campo: 'nome', ordem: 'asc' };

// Utilidades
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Fetch helpers
async function fetchAlunos() {
    const res = await fetch(`${API_URL}/alunos`);
    alunos = await res.json();
    renderAlunos();
    renderIndicadores();
}
async function fetchTurmas() {
    const res = await fetch(`${API_URL}/turmas`);
    turmas = await res.json();
    renderTurmaOptions();
}
async function createAluno(data) {
    const res = await fetch(`${API_URL}/alunos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) fetchAlunos();
}
async function updateAluno(id, data) {
    const res = await fetch(`${API_URL}/alunos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) fetchAlunos();
}
async function deleteAluno(id) {
    const res = await fetch(`${API_URL}/alunos/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAlunos();
}

// Filtros e ordenação
function filtrarAlunos() {
    let lista = alunos
        .filter(a => (!filtros.turma || a.turma_id == filtros.turma))
        .filter(a => (!filtros.status || a.status === filtros.status))
        .filter(a => (!filtros.busca || a.nome.toLowerCase().includes(filtros.busca.toLowerCase())));
    lista = ordenarAlunos(lista);
    return lista;
}
function ordenarAlunos(lista) {
    return lista.sort((a, b) => {
        let valA = ordenacao.campo === 'idade' ? calcularIdade(a.data_nascimento) : a.nome.toLowerCase();
        let valB = ordenacao.campo === 'idade' ? calcularIdade(b.data_nascimento) : b.nome.toLowerCase();
        if (valA < valB) return ordenacao.ordem === 'asc' ? -1 : 1;
        if (valA > valB) return ordenacao.ordem === 'asc' ? 1 : -1;
        return 0;
    });
}
function salvarOrdenacao() {
    localStorage.setItem('ordenacao', JSON.stringify(ordenacao));
}

// Indicadores
function renderIndicadores() {
    $('#totalAlunos').textContent = alunos.length;
    $('#alunosAtivos').textContent = alunos.filter(a => a.status === 'ativo').length;
    const porTurma = {};
    turmas.forEach(t => porTurma[t.id] = 0);
    alunos.forEach(a => porTurma[a.turma_id] = (porTurma[a.turma_id] || 0) + 1);
    $('#statsPorTurma').innerHTML = turmas.map(t =>
        `<li>${t.nome}: <span>${porTurma[t.id] || 0}</span></li>`
    ).join('');
}

// Renderização
function renderAlunos() {
    const lista = filtrarAlunos();
    const container = $('#alunosContainer');
    container.innerHTML = lista.length
        ? lista.map(a => alunoCard(a)).join('')
        : '<div aria-live="polite">Nenhum aluno encontrado.</div>';
}
function alunoCard(a) {
    return `
    <div class="aluno-card" tabindex="0" aria-label="Aluno ${a.nome}">
        <strong>${a.nome}</strong>
        <span>Idade: ${calcularIdade(a.data_nascimento)}</span>
        <span>Email: ${a.email}</span>
        <span>Status: ${a.status}</span>
        <span>Turma: ${turmas.find(t => t.id === a.turma_id)?.nome || '-'}</span>
        <button class="button" style="background:var(--secondary);" onclick="editarAluno(${a.id})" aria-label="Editar ${a.nome}">Editar</button>
        <button class="button" style="background:var(--accent);" onclick="excluirAluno(${a.id})" aria-label="Excluir ${a.nome}">Excluir</button>
    </div>`;
}
window.editarAluno = (id) => abrirModalNovoAluno(alunos.find(a => a.id === id));
window.excluirAluno = (id) => {
    if (confirm('Confirma exclusão?')) deleteAluno(id);
};

// Turmas
function renderTurmaOptions() {
    const turmaSelects = $$('#turmaAluno, #turmaFiltro, #matriculaTurma');
    turmaSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Todas</option>` +
            turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
    });
}

// Filtros
$('#turmaFiltro').addEventListener('change', e => {
    filtros.turma = e.target.value;
    renderAlunos();
});
$('#statusFiltro').addEventListener('change', e => {
    filtros.status = e.target.value;
    renderAlunos();
});
$('#searchAluno').addEventListener('input', e => {
    filtros.busca = e.target.value;
    renderAlunos();
});

// Ordenação
function setupOrdenacao() {
    // Exemplo: botões ou selects para ordenação
    // Adapte conforme seu HTML
    $('#ordenarNome').addEventListener('click', () => {
        ordenacao = { campo: 'nome', ordem: ordenacao.ordem === 'asc' ? 'desc' : 'asc' };
        salvarOrdenacao();
        renderAlunos();
    });
    $('#ordenarIdade').addEventListener('click', () => {
        ordenacao = { campo: 'idade', ordem: ordenacao.ordem === 'asc' ? 'desc' : 'asc' };
        salvarOrdenacao();
        renderAlunos();
    });
}

// Formulário Novo Aluno
$('#btnNovoAluno').addEventListener('click', () => abrirModalNovoAluno());
function abrirModalNovoAluno(aluno = null) {
    const modal = $('#modalNovoAluno');
    modal.hidden = false;
    $('#nomeAluno').focus();
    if (aluno) {
        $('#nomeAluno').value = aluno.nome;
        $('#dataNascimento').value = aluno.data_nascimento;
        $('#emailAluno').value = aluno.email;
        $('#statusAluno').value = aluno.status;
        $('#turmaAluno').value = aluno.turma_id;
        modal.dataset.editId = aluno.id;
    } else {
        $('#formNovoAluno').reset();
        modal.dataset.editId = '';
    }
}
$('#fecharModalNovoAluno').addEventListener('click', () => $('#modalNovoAluno').hidden = true);
$('#formNovoAluno').addEventListener('submit', e => {
    e.preventDefault();
    const nome = $('#nomeAluno').value.trim();
    const data_nascimento = $('#dataNascimento').value;
    const email = $('#emailAluno').value.trim();
    const status = $('#statusAluno').value;
    const turma_id = $('#turmaAluno').value;
    // Validações
    if (nome.length < 3 || nome.length > 80) return feedback('Nome deve ter entre 3 e 80 caracteres.');
    if (!validarDataNascimento(data_nascimento)) return feedback('Data de nascimento inválida.');
    if (!validarEmail(email)) return feedback('Email inválido.');
    if (!['ativo', 'inativo'].includes(status)) return feedback('Status obrigatório.');
    if (!turma_id) return feedback('Turma obrigatória.');
    const alunoData = { nome, data_nascimento, email, status, turma_id };
    const editId = $('#modalNovoAluno').dataset.editId;
    if (editId) updateAluno(editId, alunoData);
    else createAluno(alunoData);
    $('#modalNovoAluno').hidden = true;
});

// Modal Nova Matrícula
$('#btnNovaMatricula').addEventListener('click', () => abrirModalNovaMatricula());
function abrirModalNovaMatricula() {
    $('#modalNovaMatricula').hidden = false;
    $('#matriculaAluno').focus();
}
$('#fecharModalNovaMatricula').addEventListener('click', () => $('#modalNovaMatricula').hidden = true);
$('#formNovaMatricula').addEventListener('submit', async e => {
    e.preventDefault();
    const aluno_id = $('#matriculaAluno').value;
    const turma_id = $('#matriculaTurma').value;
    // Validar capacidade da turma
    const turma = turmas.find(t => t.id == turma_id);
    const alunosNaTurma = alunos.filter(a => a.turma_id == turma_id).length;
    if (turma.capacidade && alunosNaTurma >= turma.capacidade) {
        return feedback('Turma está lotada.');
    }
    // Chame API para matrícula (implemente no backend)
    await fetch(`${API_URL}/matriculas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id, turma_id })
    });
    $('#modalNovaMatricula').hidden = true;
    fetchAlunos();
});

// Validações
function validarDataNascimento(data) {
    if (!data) return false;
    const dt = new Date(data);
    const hoje = new Date();
    const minAno = hoje.getFullYear() - 5;
    return dt.getFullYear() <= minAno;
}
function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function calcularIdade(data) {
    const dt = new Date(data);
    const hoje = new Date();
    let idade = hoje.getFullYear() - dt.getFullYear();
    if (hoje.getMonth() < dt.getMonth() || (hoje.getMonth() === dt.getMonth() && hoje.getDate() < dt.getDate())) {
        idade--;
    }
    return idade;
}

// Feedback acessível
function feedback(msg) {
    let live = $('#feedbackLive');
    if (!live) {
        live = document.createElement('div');
        live.id = 'feedbackLive';
        live.setAttribute('aria-live', 'assertive');
        live.style.position = 'absolute';
        live.style.left = '-9999px';
        document.body.appendChild(live);
    }
    live.textContent = msg;
    alert(msg); // opcional, para garantir visibilidade
}

// Atalhos de teclado
document.addEventListener('keydown', e => {
    if (e.altKey && e.key.toLowerCase() === 'n') {
        abrirModalNovoAluno();
    }
});

// Exportação CSV/JSON
$('#exportCSV').addEventListener('click', () => exportarCSV());
$('#exportJSON').addEventListener('click', () => exportarJSON());

function exportarCSV() {
    const lista = filtrarAlunos();
    const header = ['Nome', 'Idade', 'Email', 'Status', 'Turma'];
    const rows = lista.map(a => [
        `"${a.nome}"`,
        calcularIdade(a.data_nascimento),
        `"${a.email}"`,
        a.status,
        turmas.find(t => t.id === a.turma_id)?.nome || '-'
    ]);
    let csv = header.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    baixarArquivo('alunos.csv', csv);
}
function exportarJSON() {
    const lista = filtrarAlunos();
    baixarArquivo('alunos.json', JSON.stringify(lista, null, 2));
}
function baixarArquivo(nome, conteudo) {
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
    await fetchTurmas();
    await fetchAlunos();
    setupOrdenacao();
    console.log('Web application is ready!');

    // Example of adding an event listener to a button
    const button = document.getElementById('myButton');
    if (button) {
        button.addEventListener('click', () => {
            alert('Button clicked!');
        });
    }

    // Additional JavaScript code can be added here
});