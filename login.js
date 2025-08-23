// ------------------------------ API CONFIGS --------------------------------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"
const supabase = window.supabase ??= createClient('https://ljpchdnlebmzvsjcyfei.supabase.co', 'SENHA DO BANCO SUPABASE');
// ------------------------------ API CONFIGS --------------------------------

let registrar_container = document.getElementById('registrar_container'),
    seuNome = localStorage.getItem('nickname') ?? '',
    nick_input = document.getElementById('nick'),
    nick_enviar = document.getElementById('nick_enviar'),
    senha_input = document.getElementById('senha'),
    contas = [];

// Mostra a tela de login se não tiver nick registrado
if (seuNome === '') { document.getElementById('registrar_container').style.display = 'flex' }

// Procura os nick já usados
procurandoNomes()
async function procurandoNomes() {
    const { data, error } = await supabase.from('chat').select('nome_usuario, senha')
        .order('id', { ascending: true });

        // Registra cada nick
    for (let i = 0; i < data.length; i++) {
        if (!contas.some(nome => nome.nome_usuario === data[i].nome_usuario)) {
            contas.push(data[i])
        }
    }
}

//------------------------------------ LOGIN / REGISTRO
document.getElementById('nick_enviar').addEventListener('click', () => {
    let campo = nick_input.value.trim().toLocaleLowerCase()
    let campoSenha = senha_input.value.trim()
    let senhaDaConta = contas.find(contas => contas.nome_usuario === campo) ?? 'cadeASenha?'
    let jaUsado = contas.some(conta => conta.nome_usuario === campo)

    if (campo != '') {
        if (campoSenha === '' || campo === '') {
            nick_enviar.style.backgroundColor = 'red'
            registrar_container.querySelector('div').style.border = '2px solid red'
        }

        else if (jaUsado && campoSenha != senhaDaConta.senha) {
            registrar_container.querySelector('div').style.border = '2px solid red'
            nick_enviar.textContent = 'tem algo errado...'
            nick_enviar.style.backgroundColor = 'red'
        }

        else if (jaUsado && campoSenha === senhaDaConta.senha || campo != "" && campoSenha != "" & !jaUsado) {
            localStorage.setItem('senha', campoSenha)
            localStorage.setItem('nickname', campo)

            notificaçaoNovoUsuario(campo, campoSenha)
        }
    }
});

document.getElementById('senha').addEventListener('keyup', () => {
    let campo = nick_input.value.trim().toLocaleLowerCase()
    let campoSenha = senha_input.value.trim()
    let jaUsado = contas.some(conta => conta.nome_usuario === campo)

    if (campo != "" && campoSenha != "" & !jaUsado) {
        registrar_container.querySelector('div').style.border = '2px solid'
        registrar_container.querySelector('div').style.borderColor = 'green'
        nick_enviar.style.backgroundColor = 'green'
        nick_enviar.style.color = 'white'
        nick_enviar.textContent = 'criar conta'
    }
})

// Enviar uma mensagem de notificação, para os outros usuarios saberem quem entrou no chat
async function notificaçaoNovoUsuario(nome, senha) {
    let idDaSuaMsg = nome.toLowerCase()
    const { data, error } = await supabase.from('chat').insert({
        id_mensagem: idDaSuaMsg,
        nome_usuario: nome,
        senha: senha,
        cor: 'usuarioConectado',
    });

    if (error) {
        aviso(error, 'funct_notificação')
    }

    setTimeout(location.reload(), 500)
};

document.querySelector('.resetar_cache').addEventListener('click', () => {
    localStorage.removeItem('nickname')
    localStorage.removeItem('senha')
    localStorage.removeItem('cores')
    location.reload()
})