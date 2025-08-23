// ------------------------------ API CONFIGS --------------------------------
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"
const supabase = window.supabase ??= createClient('https://ljpchdnlebmzvsjcyfei.supabase.co', 'SENHA DO BANCO SUPABASE');
// ------------------------------ API CONFIGS --------------------------------
/*
Requisitos para usar:
- Crie uma table chamada "chat" e abra as policies.
- Crie as seguintes colunas:
    * nome_usuario          (Nick de quem mandou a mensagem)
    * msg                   (Conteudo da mensagem)
    * cor                   (Cor Tema usado pelo usuario)
    * id_mensagem           (id unico da mensagem)
    * senha                 (Senha daquele usuario)
    * horas                 (Hora em que a mensagem foi enviada)
    * minutos               (Minutagem em que a mensagem foi enviada)
    * cor_texto             (Cor de texto que o usuario usava quando mandou)
    * cor_nome              (Cor de nome que o usuario usava quando mandou)
    * resposta_cor          (Cor Tema usada pela mensagem que está sendo respondida)
    * resposta_cor_nome     (Cor do nick da mensagem que está sendo respondida)
    * resposta_cor_texto    (Cor do texto da mensagem que está sendo respondida)
    * resposta_quem         (Nick do usuario que mandou a mensagem que está sendo respondida)
    * resposta_texto        (Conteudo da mensagem que está sendo respondida)
    * id_respondendo        (ID da mensagem que está sendo respondida)
    (Todas do tipo text)
*/

const seuNome = localStorage.getItem('nickname') ?? '',
    nickOriginal = localStorage.getItem('nickOriginal') ?? '',
    vitrine = document.getElementById('vitrine'),
    escrita = document.getElementById('campoEscrita'),
    body = document.body,
    enviar_btn = document.getElementById('enviar_btn'),
    menu_container = document.getElementById('menu'),
    abrir_menu = document.getElementById('abrir_menu'),
    lista_container = document.getElementById('lista'),
    abrir_lista = document.getElementById('abrir_lista'),
    fechar_lista = document.getElementById('fechar_lista');

//--------------------------------------------- AVISO DE ERRO
const aviso_container = document.getElementById('aviso_erro');
const aviso_local = document.getElementById('aviso_local');

// Abre o painel de erro, se necessario
function aviso(erro, local) {
    aviso_container.classList.add('aberto')
    aviso_container.querySelector('p').textContent = `${erro.code} | ${erro.message}`
    aviso_local.textContent = `Em: ${local}`
    setTimeout(
        () => { aviso_container.classList.remove('aberto') }, 10000)
};

// Procura os nicks já usados
let contas = [];
// Salva as mensagens baixadas
let chat = [];
// Salva o id das mensagens já baixadas, para não baixar a mesma mensagem de novo
let chatIDS = [];
// Pega o id da sua ultima mensagem
let suaUltimaMsgId = 0;

if (seuNome != '') {
    // As mensagens enviadas usam o nickOriginal para criar uma id propria
    if (nickOriginal === '') {
        localStorage.setItem('nickOriginal', seuNome)
    }

    // Usei varios requestAnimationFrame para não empilhar processos
    requestAnimationFrame(() => {
        sincronizando();
    });
};

// Limpa alguns itens do localStorage para resolver alguns bugs.
document.getElementById('cache_menu').addEventListener('click', () => {
    localStorage.removeItem('nickname')
    localStorage.removeItem('senha')
    localStorage.removeItem('cores')
    location.reload()
});

//------------------------ baixando as msgs
async function sincronizando() {
    const { data, error } = await supabase.from('chat')
        .select('id, nome_usuario, msg, cor, id_mensagem, horas, minutos, cor_texto, cor_nome, resposta_quem, resposta_texto, resposta_cor, resposta_cor_texto, resposta_cor_nome, id_respondendo')
        // Só baixa as ultimas 50 mensagens, isso serve para não pesar muito
        .order('id', { ascending: false })
        .limit(50);

    if (error) {
        aviso(error, 'funct_sincronizando')
    };

    // Salva em ordem cronologica
    chat = data.reverse();
    minhaUltimaMsg();

    // Usei setTimeout para não empilhar processos
    setTimeout(() => {
        for (let i = 0; i < data.length; i++) {
            // Pega cada nick unico e coloca no painel de registrados
            if (!contas.some(c => c === data[i].nome_usuario)) {
                contas.push(data[i].nome_usuario)
                lista_container.innerHTML += `
                        <span>
                            <svg><use href="#icon_perfil"/></svg>
                            ${data[i].nome_usuario}
                        </span>
                        <div class="cores_usadas" name="${data[i].nome_usuario}">
                        </div>
                        `
            }
        }
    }, 1);
};

async function minhaUltimaMsg() {
    // Busca a id da sua ultima mensagem
    const { data, error } = await supabase.from('chat')
        .select('*')
        .ilike('nome_usuario', `%${seuNome}%`)
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        aviso(error, 'funct_minhaUMSG')
    };

    suaUltimaMsgId = +data[0].id_mensagem.split(seuNome)[1] ?? 0;

    // Não empilhar processos
    requestAnimationFrame(() => {
        chat.forEach(render)
    });
};

//------------------------- renderizando as msgs
function render(msg) {
    // Verifica se é uma notificação ou uma mensagem normal
    if (msg.cor === 'usuarioConectado') {
        vitrine.innerHTML += `
            <div class="novoUsuario">${msg.nome_usuario} entrou no chat</div>
            `;
        chatIDS.push(msg.id_mensagem);
    }

    // Se for normal...
    else {
        // Constroi os itens basicos.
        const container_msg = document.createElement('div');
        const nome = document.createElement('h4');
        const texto = document.createElement('p');
        const hora = document.createElement('p');

        texto.style.color = msg.cor_texto;
        nome.style.color = msg.cor_nome;
        nome.textContent = msg.nome_usuario;

        hora.classList.add('hora');
        hora.innerHTML = `${msg.horas}:${msg.minutos}`;

        container_msg.appendChild(nome);

        // Verifica se a mensagem é uma resposta
        if (msg.resposta_quem != null) {
            container_msg.innerHTML += `
                    <div class="msg_antiga" name="${msg.id_respondendo}" style="background-Color: ${msg.resposta_cor}; border: 2px solid ${msg.resposta_cor_nome};">
                        <h4 style="color:${msg.resposta_cor_nome};">${msg.resposta_quem}</h4>
                        <p style="color:${msg.resposta_cor_texto};">${msg.resposta_texto}</p>
                    </div>
                `
            container_msg.classList.add('respondendo');
        };

        // Verifica se é um link do youtube ou uma mensagem normal
        if (msg.msg.includes('//youtu.be/')) {
            let msg_sem_link = msg.msg.replace(/https:\/\/youtu\.be\/\S+/, '').trim()

            let id_video = msg.msg.split('youtu.be/')[1].split('?')[0]
            container_msg.innerHTML += `
                <iframe 
                    src="https://www.youtube.com/embed/${id_video}" 
                    title="YouTube video player"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;" 
                    allowfullscreen
                    loading="lazy">
                </iframe>
                `
            if (msg_sem_link != '') {
                texto.innerHTML = msg_sem_link
            }
        }
        else {
            texto.innerHTML = msg.msg
        };

        container_msg.appendChild(texto);

        // Verifica se foi você quem enviou a mensagem
        if (msg.id_mensagem.includes(nickOriginal)) {
            container_msg.classList.add('suaMsg')
        }
        else {
            container_msg.classList.add('outraMsg')
            chatIDS.push(msg.id_mensagem)
        };

        // Constroi a mensagem
        container_msg.style.backgroundColor = msg.cor;
        container_msg.id = msg.id_mensagem;
        container_msg.appendChild(hora);
        vitrine.appendChild(container_msg);

        // registra as ultimas cores usadas por esse usuario
        requestAnimationFrame(() => {
            const container_cores_atuais = document.querySelector(`.cores_usadas[name="${msg.nome_usuario}"]`)
            container_cores_atuais.innerHTML = `
                <span>tema: <div style="background-Color:${msg.cor};" class="cor_box"></div></span>
                <span>textos: <div style="background-Color:${msg.cor_texto};" class="cor_box"></div></span>
                <span>nomes: <div style="background-Color:${msg.cor_nome};" class="cor_box"></div></span>
            `
        });
    };

    // Não empilhar processos
    requestAnimationFrame(() => {
        vitrine.scrollTop = vitrine.scrollHeight
    });
};

//------------------------ campo de escrita do chat
// Salva as informações da mensagem que será respondida
let resp_quem = null,
    resp_text = null,
    resp_cor = null,
    resp_cor_texto = null,
    resp_cor_nome = null,
    resp_id = null;

// Coloquei um EventListener no body inteiro para não ficar criando varios eventListeners
body.addEventListener('click', (click) => {
    let apertou = click.target.closest('a');

    // BTN_ENVIAR
    let campo = document.getElementById('campoEscrita').value;

    // Botão de enviar
    if (campo != '' && apertou === enviar_btn) {

        if (!campo_container.classList.contains('aberto')) {
            resp_quem = null;
            resp_text = null;
            resp_cor = null;
            resp_cor_texto = null;
            resp_id = null;
            resp_cor_nome = null;
        };
        enviando(campo.replace(/\n/g, "<br>"), resp_quem, resp_text, resp_cor, resp_cor_texto, resp_id, resp_cor_nome);
        escrita.value = '';
        campo_container.classList.remove('aberto');
        resp_quem = null;
        resp_text = null;
        resp_cor = null;
        resp_cor_texto = null;
        resp_id = null;
        resp_cor_nome = null;
    }

    // Mensagem respondida
    else if (click.target.closest('.msg_antiga')) {
        // Move a tela até a mensagem que foi respondida
        console.log(click.target.closest('.msg_antiga').getAttribute('name'))
        let name_id = click.target.closest('.msg_antiga').getAttribute('name');
        document.getElementById(`${name_id}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Botão do menu
    else if (apertou === abrir_menu) {
        menu_container.classList.add('aberto')
    }

    // Botão da lista
    else if (apertou === abrir_lista) {
        lista_container.classList.add('aberto')
    }

    // Botão para trocar de nome
    else if (click.target.closest('#lista > span')) {
        let nome = click.target.textContent.trim()
        const exibicao_cores = document.querySelector(`.cores_usadas[name="${nome}"]`)
        if (exibicao_cores.classList.contains('aberto')) {
            exibicao_cores.classList.remove('aberto')
        }
        else {
            exibicao_cores.classList.add('aberto')
        }
    }

    // Botão fechar lista
    else if (lista_container.classList.contains('aberto') && apertou.id === fechar_lista.id) {
        lista_container.classList.remove('aberto')
        document.querySelector('#aviso_troca_nome').classList.remove('aberto')
    };

    // console.log(apertou)
});

// Desativa o envio pelo enter (mobile)
document.addEventListener('submit', (e) => {
    e.preventDefault()
});

//--------------------------------- Respostas
const campo_container = document.getElementById('campo_container');
const responder_container = document.getElementById('responder');
let lastTap = 0;
let contagem;

// Dois clicks para escolher uma mensagem para responder
body.addEventListener('dblclick', (click) => {
    if (click.target.closest('.outraMsg') || click.target.closest('.suaMsg')) {
        doubleTap(click.target.closest('div:not(#respondendo)'))
    }
    if (click.target.closest('div#responder')) {
        campo_container.classList.remove('aberto')
    }
});

body.addEventListener('touchend', (tap) => {
    clearInterval(contagem)
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
        tap.preventDefault();
        if (tap.target.closest('.outraMsg') || tap.target.closest('.suaMsg')) {
            doubleTap(tap.target.closest('div:not(#respondendo)'))
        }
        if (tap.target.closest('div#responder')) {
            campo_container.classList.remove('aberto')
        }
    }

    lastTap = currentTime;
});

// Editar mensagem
body.addEventListener('touchstart', (tap) => {
    tap.preventDefault();
    if (tap.target.closest('.suaMsg')) {
        const horaAtual = new Date().getHours(),
            minutoAtual = new Date().getMinutes(),
            msgHoraContainer = tap.target.closest('.suaMsg').querySelector('.hora').textContent,
            horaDaMsg = +msgHoraContainer.split(':')[0],
            minutoDaMsg = +msgHoraContainer.split(':')[1];

        if (minutoAtual < minutoDaMsg + 15 && horaDaMsg === horaAtual && !tap.target.closest('.suaMsg').id.includes('att_')) {
            contagem = setTimeout(() => {
                const msgContainer = tap.target.closest('.suaMsg'),
                    parag = msgContainer.querySelector(':scope > p');

                parag.contentEditable = 'true'
                parag.focus();
                parag.addEventListener('focusout', () => {
                    parag.contentEditable = 'false';
                    atualizandoMsg(parag.textContent.trim(), msgContainer.id, msgHoraContainer.split(':')[1]);
                });

            }, 1000);
        };
    };
});

function doubleTap(msg) {
    // Pegando a msg
    let parag_alvo = msg.querySelector(':scope > p');
    let nome_alvo = msg.querySelector(':scope > h4');

    // Container que aparece na barra de escrita
    let parag = responder_container.querySelector('p');
    let nome = responder_container.querySelector('h4');

    // Criando perfil
    resp_cor = window.getComputedStyle(msg).getPropertyValue("background-color");
    resp_cor_texto = window.getComputedStyle(parag_alvo).getPropertyValue("color");
    resp_cor_nome = window.getComputedStyle(nome_alvo).getPropertyValue("color");
    resp_quem = nome_alvo.textContent;
    resp_text = parag_alvo.textContent;
    resp_id = msg.id;

    // Parte de baixo
    campo_container.classList.add('aberto')
    nome.textContent = resp_quem;
    nome.style.color = resp_cor_nome;
    parag.textContent = resp_text;
    parag.style.color = resp_cor_texto;
    responder_container.style.backgroundColor = resp_cor;
    responder_container.style.border = `2px solid ${resp_cor_nome}`;
    escrita.focus();
};

//------------------- Prepara a sua mensagem
async function enviando(mensagem, resposta_quem, resposta_texto, resposta_cor, resposta_cor_texto, resposta_id, resposta_cor_nome) {
    // Pega sua cores atuais
    let cores = JSON.parse(localStorage.getItem('cores'));

    // Pega o horario atual
    let hora = String(new Date().getHours()).padStart(2, "0");
    let minuto = String(new Date().getMinutes()).padStart(2, "0");

    // Pega o id da sua ultima mensagem
    let idDaSuaMsg = `${seuNome + (suaUltimaMsgId + 1)}`;

    // Cria a mensagem
    let msg = {
        nome_usuario: seuNome,
        msg: mensagem,
        id_mensagem: idDaSuaMsg,
        horas: hora,
        minutos: minuto,
        cor: cores.corTema,
        cor_texto: cores.corTexto,
        cor_nome: cores.corNomes,
        resposta_quem: resposta_quem,
        resposta_texto: resposta_texto,
        resposta_cor: resposta_cor,
        resposta_cor_texto: resposta_cor_texto,
        resposta_cor_nome: resposta_cor_nome,
        id_respondendo: resposta_id,
    };

    // Envia pro banco de dados
    const { data, error } = await supabase.from('chat').insert([msg]);
    if (error) {
        aviso(error, 'funct_enviando')
    };

    // Coloca nas suas mensagem baixadas
    chat.push(msg);
    suaUltimaMsgId++;
    chatIDS.push(idDaSuaMsg);

    // Manda essa mensagem para renderizar
    render(msg);
};

// Atualiza uma mensagem já enviada
async function atualizandoMsg(msgAtualizada, id, minutos) {
    const { data, error } = await supabase.from('chat')
        .update({ msg: `${msgAtualizada}`, id_mensagem: `att_${id}` })
        .eq('id_mensagem', `${id}`)
        .eq('minutos', `${minutos}`)

    if (error) {
        console.log(error)
        aviso(error, 'funct_attMSG')
    }
}

// Procura nova mensagens cada 3 segundos
setInterval(() => {
    novasMsgs()
}, 3000);

// procurando novas mensagens
async function novasMsgs() {
    const { data, error } = await supabase.from('chat').select('*')
    // Procura as ultimas 15 mensagens, exceto as que possuem o seu nick
        .not('id_mensagem', 'ilike', `%${nickOriginal}%`)
        .order('id', { ascending: false })
        .limit(15);

    // Tira as mensagem que já estão registradas no seu aparelho 
    const filtrado = data.reverse().filter(item => !chatIDS.includes(item.id_mensagem));

    if (error) {
        aviso(error, 'funct_newsMSGS')
    }
    else if (filtrado != '') {
        filtrado.forEach((msg) => {
            const container = document.querySelector(`#${msg.id_mensagem.split('att_')[1]} > p`) ?? '';
            if (container != '') {
                container.innerHTML = msg.msg
            }
            else {
                render(msg)
            }

            chat.push(msg)
        })
    }

    console.log('procurando msg...')
};