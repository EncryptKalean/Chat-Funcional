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
- Ativar o Realtime na table chat
- Criar um bucket com o nome de 'imagens'
*/

// Limpa alguns itens do localStorage para resolver bugs.
document.getElementById('cache_menu').addEventListener('click', () => {
    localStorage.removeItem('nickname')
    localStorage.removeItem('senha')
    localStorage.removeItem('cores')
    location.reload()
});

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
    fechar_lista = document.getElementById('fechar_lista'),
    background_zoom = document.getElementById('background_zoom');

//--------------------------------------------- AVISO DE ERRO
const aviso_container = document.getElementById('aviso_erro');
const aviso_local = document.getElementById('aviso_local');

// Abre o painel de erro, se necessario
function aviso(erro, local) {
    aviso_container.classList.add('aberto');
    aviso_container.querySelector('p').textContent = `${erro.code} | ${erro.message}`;
    aviso_local.textContent = `Em: ${local}`;
    setTimeout(() => { aviso_container.classList.remove('aberto') }, 10000);
};

// Adapta o tamanho da visualização de responder de acordo com o tamanho do campo escrita
document.getElementById('responder').style.width = window.getComputedStyle(escrita).width;

// Salva o id da ultima mensagem baixada, para o sistema só procurar as mensagens que vieram depois dela.
let ultima_id = 0;

// Salva as mensagens já baixadas
let chat = JSON.parse(localStorage.getItem('chat')) ?? '';
if (chat === '') criandoChat();
if (chat.length > 60) chat.splice(0, 11);

// Pega as ultimas 50 mensagens, se não tiver nada no database
async function criandoChat() {
    const { data, error } = await supabase.from('chat')
        .select('id, nome_usuario, msg, cor, id_mensagem, horas, minutos, cor_texto, cor_nome, resposta_quem, resposta_texto, resposta_cor, resposta_cor_texto, resposta_cor_nome, id_respondendo')
        .gt('id', ultima_id)
        .order('id', { ascending: false })
        .limit(50);

    if (error) {
        console.log(error)
        aviso(error, 'funct_sincronizando')
    };

    localStorage.setItem('chat', JSON.stringify(data.reverse()))
    data.forEach(render)
};

// Pega o id da sua ultima mensagem
let suaUltimaMsgId = 0;

// Como termina as ids das midias
let limitador = '/|';

if (seuNome != '') {
    // As mensagens enviadas usam o nickOriginal para criar uma id propria
    if (nickOriginal === '') {
        localStorage.setItem('nickOriginal', seuNome)
    }

    // Usei varios requestAnimationFrame para não empilhar processos
    requestAnimationFrame(() => {
        // Serve pra limpar o banco de dados
        localStorage.setItem('ultimaID', chat[0].id);

        let contas = [];
        for (let i = 0; i < chat.length; i++) {
            if (chat[i].id > ultima_id) ultima_id = chat[i].id;
            if (!contas.some(c => c === chat[i].nome_usuario)) {
                contas.push(chat[i].nome_usuario)

                lista_container.innerHTML += `<span><svg><use href="#icon_perfil"/></svg>${chat[i].nome_usuario}</span><div class="cores_usadas" name="${chat[i].nome_usuario}"><span>tema: <div class="cor_box"></div></span><span>textos: <div class="cor_box"></div></span><span>nomes: <div class="cor_box"></div></span></div>`
            };
        };

        setTimeout(() => {
            suaUltimaMsgId = +chat[0].id_mensagem.split(nickOriginal)[1] ?? 0;
            procurandoMsg();
            chat.forEach(render);
            baixandoMsgs()
        }, 10);
    });
};

//------------------------- renderizando as msgs
function render(msg) {
    if (msg.id > ultima_id) ultima_id = msg.id;
    // Verifica se a msg é uma notificação ou uma msg normal
    if (msg.cor === 'usuarioConectado' && msg.msg === null) {
        const novoUsuario = document.createElement('div');
        novoUsuario.classList.add('novoUsuario');
        novoUsuario.textContent = `${msg.nome_usuario} entrou no chat`;
        vitrine.insertAdjacentHTML("beforeend", novoUsuario);
    }

    // Se for normal...
    else {
        let conteudo = msg.msg;

        // Constroi os itens basicos.
        const container_msg = document.createElement('div');
        const nome = document.createElement('h4');
        const texto = document.createElement('p');
        const hora = document.createElement('p');

        texto.style.color = msg.cor_texto;
        nome.style.color = msg.cor_nome;
        nome.textContent = msg.nome_usuario;

        hora.classList.add('hora');
        hora.textContent = `${msg.horas}:${msg.minutos}`;
        hora.style.color = msg.cor_texto;

        container_msg.appendChild(nome);

        // Verifica se a msg é uma resposta
        if (msg.resposta_quem != null) {
            const msg_antiga = document.createElement('div');
            msg_antiga.classList.add('msg_antiga');
            msg_antiga.setAttribute('name', msg.id_respondendo);
            msg_antiga.style.backgroundColor = msg.resposta_cor;
            msg_antiga.style.border = `2px solid ${msg.resposta_cor_nome}`;

            const nome_antiga = document.createElement('h4');
            nome_antiga.textContent = msg.resposta_quem;
            nome_antiga.style.color = msg.resposta_cor_nome;
            msg_antiga.appendChild(nome_antiga);

            if (msg.resposta_texto.includes('imagemRSPDD')) {
                const msg_midia = msg.resposta_texto.split('RSPDD')[1].trim() + '-miniatura';
                msg_antiga.style.height = '100px';
                nome.style.marginTop = '100px';

                const { data } = supabase.storage
                    .from('imagens')
                    .getPublicUrl(msg_midia);

                const img_container = document.createElement('img');
                img_container.loading = 'lazy';
                img_container.src = data.publicUrl;
                msg_antiga.appendChild(img_container);
            }
            else {
                const texto_antiga = document.createElement('p');
                texto_antiga.textContent = msg.resposta_texto;
                texto_antiga.style.color = msg.resposta_cor_texto
                msg_antiga.appendChild(texto_antiga)
            }

            container_msg.appendChild(msg_antiga);
            container_msg.classList.add('respondendo');
        };

        // Verifica se é um audio
        if (conteudo.includes('audio/')) {
            let msg_midia = conteudo.split(limitador)[0].trim();
            conteudo = '';

            const { data } = supabase.storage
                .from('imagens')
                .getPublicUrl(msg_midia);

            const audio_container = document.createElement('audio');
            audio_container.controls = 'true';
            audio_container.volume = 0.7;
            audio_container.loading = 'lazy';
            container_msg.appendChild(audio_container);

            setTimeout(() => {
                audio_container.src = data.publicUrl;
            }, 1000)
        };

        // Verifica se é uma imgem
        if (conteudo.includes('imagem/')) {
            const minutoAtual = new Date().getMinutes();
            const horaAtual = new Date().getHours();
            const msg_midia = conteudo.split(limitador)[0].trim();
            conteudo = conteudo.split(limitador)[1].trim();

            const { data } = supabase.storage
                .from('imagens')
                .getPublicUrl(msg_midia);

            const img_container = document.createElement('img');
            img_container.loading = 'lazy';
            container_msg.appendChild(img_container);
            img_container.src = data.publicUrl;
            img_container.setAttribute('name', msg_midia)

            if (minutoAtual <= +msg.minutos + 1 && minutoAtual > +msg.minutos - 1 && horaAtual === +msg.horas) setTimeout(() => { console.log('ativou'); img_container.src = data.publicUrl; setTimeout(() => { vitrine.scrollTop = vitrine.scrollHeight }, 500) }, 1000);
        };

        // Verifica se a msg é um link do youtube ou uma msg normal
        if (conteudo.includes('//youtu.be/')) {
            let msg_sem_link = conteudo.replace(/https:\/\/youtu\.be\/\S+/, '').trim();
            conteudo = msg_sem_link;

            let id_video = conteudo.split('youtu.be/')[1].split('?')[0];
            container_msg.innerHTML += `
                <iframe 
                    src="https://www.youtube.com/embed/${id_video}" 
                    title="YouTube video player"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture;" 
                    allowfullscreen
                    loading="lazy">
                </iframe>
                `;
        };

        if (conteudo.trim() != '') {
            texto.innerHTML = conteudo.trim();
        };

        container_msg.appendChild(texto);

        // Verifica se foi você quem mandou
        if (msg.id_mensagem.includes(nickOriginal)) {
            container_msg.classList.add('suaMsg');
        }
        else {
            container_msg.classList.add('outraMsg');
        };

        // Constroi a msg
        container_msg.style.backgroundColor = msg.cor;
        container_msg.id = msg.id_mensagem;
        container_msg.appendChild(hora);
        vitrine.appendChild(container_msg);

        // registra as ultimas cores
        requestAnimationFrame(() => {
            vitrine.scrollTop = vitrine.scrollHeight;
            const container_cores_atuais = document.querySelector(`.cores_usadas[name="${msg.nome_usuario}"]`);
            let cores_boxes = container_cores_atuais.querySelectorAll('.cor_box');
            cores_boxes[0].style.backgroundColor = msg.cor;
            cores_boxes[1].style.backgroundColor = msg.cor_texto;
            cores_boxes[2].style.backgroundColor = msg.cor_nome;
        });
    };
};

// Envia as msgs no teclado (esse não é o foco)
let teclas = [];
document.addEventListener('keydown', (tecla) => {
    teclas[tecla.key] = true;

    if (teclas['Shift'] && teclas['Enter']) {
        enviarAcao();
    };

});
document.addEventListener('keyup', () => { teclas = [] });

//------------------------ campo de escrita do chat
// Salva as informações da mensagem que será respondida
let resp_quem = null,
    resp_text = null,
    resp_cor = null,
    resp_cor_texto = null,
    resp_cor_nome = null,
    resp_id = null,
    arquivo = '',
    img;

// Coloquei um EventListener no body inteiro para não ficar criando varios eventListeners
body.addEventListener('click', (click) => {
    let apertou = click.target.closest('a');

    // BTN_ENVIAR
    if (apertou === enviar_btn) { enviarAcao() }

    // Leva o usuario até a mensagem respondida ao apertar nela
    else if (click.target.closest('.msg_antiga')) {
        const msg = document.getElementById(`${click.target.closest('.msg_antiga').getAttribute('name')}`);
        msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        msg.classList.add('anim1');
        setTimeout(() => { msg.classList.remove('anim1'); }, 3000)
    }

    // Fullscreen ao clicar na imagem
    else if (click.target.closest('#vitrine img')) {
        img = click.target.closest('img');
        img.classList.add('imagem_zoom');
        background_zoom.classList.add('aberto')
        document.getElementById('fechar_zoom').classList.add('aberto')
    }

    // Fechar o fullscreen da imagem
    else if (click.target.closest('#vitrine > svg')) {
        img.classList.remove('imagem_zoom');
        background_zoom.classList.remove('aberto')
        document.getElementById('fechar_zoom').classList.remove('aberto')
        img = '';
    }

    // Botão menu
    else if (apertou === abrir_menu) {
        menu_container.classList.add('aberto')
    }

    // Botão lista
    else if (apertou === abrir_lista) {
        lista_container.classList.add('aberto')
    }

    // Botão para trocar de nome
    else if (click.target.closest('#lista > span')) {
        let nome = click.target.textContent.split('chat')[0].trim();
        const exibicao_cores = document.querySelector(`.cores_usadas[name="${nome}"]`);
        if (exibicao_cores.classList.contains('aberto')) {
            exibicao_cores.classList.remove('aberto');
        }
        else {
            exibicao_cores.classList.add('aberto');
        };
    }

    // Botão fechar lista
    else if (lista_container.classList.contains('aberto') && apertou.id === fechar_lista.id) {
        lista_container.classList.remove('aberto');
        document.querySelector('#aviso_troca_nome').classList.remove('aberto');
    };
});

// Desativa o envio pelo enter (mobile)
document.addEventListener('submit', (e) => { e.preventDefault() });

//--------------------------------- Respostas
const campo_container = document.getElementById('campo_container');
const responder_container = document.getElementById('responder');
let lastTap = 0;
let contagem;

// Dois clicks para escolher uma mensagem para responder
body.addEventListener('dblclick', (click) => {
    if (click.target.closest(`#vitrine > div`)) {
        doubleTap(click.target.closest('div:not(#respondendo)'));
    };
    if (click.target.closest('div#responder')) {
        campo_container.classList.remove('aberto');
    };
});

body.addEventListener('touchend', (tap) => {
    clearInterval(contagem);
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;

    if (tapLength < 300 && tapLength > 0) {
        tap.preventDefault();
        if (tap.target.closest(`#vitrine > div`)) {
            doubleTap(tap.target.closest('div:not(#respondendo)'));
        };
        if (tap.target.closest('div#responder')) {
            campo_container.classList.remove('aberto');
        };
    };

    lastTap = currentTime;
});


// Editar mensagem
body.addEventListener('touchstart', (tap) => {
    if (tap.target.closest('.suaMsg')) {
        tap.preventDefault();
        const horaAtual = new Date().getHours(),
            minutoAtual = new Date().getMinutes(),
            msgHoraContainer = tap.target.closest('.suaMsg').querySelector('.hora').textContent,
            horaDaMsg = +msgHoraContainer.split(':')[0],
            minutoDaMsg = +msgHoraContainer.split(':')[1];

        if (minutoAtual < minutoDaMsg + 15 && horaDaMsg === horaAtual && !tap.target.closest('.suaMsg').id.includes('att_')) {
            contagem = setTimeout(() => {
                const msgContainer = tap.target.closest('.suaMsg'),
                    parag = msgContainer.querySelector(':scope > p');

                parag.contentEditable = 'true';
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

    // Coloca uma identificação na mensagem pro render saber que é uma midia
    if (msg.querySelector(':scope > audio') && parag_alvo.textContent === '') resp_text = 'audioRSPDD' + msg.querySelector('audio').getAttribute('name');
    if (msg.querySelector(':scope > img')) resp_text = 'imagemRSPDD' + msg.querySelector('img').getAttribute('name');

    // Parte de baixo
    campo_container.classList.add('aberto')
    nome.textContent = resp_quem;
    nome.style.color = resp_cor_nome;
    parag.textContent = resp_text.split('RSPDD')[0];
    parag.style.color = resp_cor_texto;
    responder_container.style.backgroundColor = resp_cor;
    responder_container.style.border = `2px solid ${resp_cor_nome}`;
    escrita.focus();
};


//------------------- Prepara a sua mensagem
// Salva o nome do arquivo (é assim que ele vai ficar salvo no sistema)
let nomeArquivo;

function enviarAcao() {
    let campo = document.getElementById('campoEscrita').value;
    teclas = [];

    if (campo != '') {
        if (arquivo != '') {
            if (nomeArquivo.includes('imagem/')) {
                convertendoParaWebp(arquivo[0], 0.5, 0.5, enviarMidia);      // imagem principal
                convertendoParaWebp(arquivo[0], 0.1, 0.1, enviarMiniatura);  // miniatura
            }
            else if (nomeArquivo.includes('audio/')) { enviarMidia(arquivo[0]); };
        };
        enviando(campo.replace(/\n/g, "<br>"), resp_quem, resp_text, resp_cor, resp_cor_texto, resp_id, resp_cor_nome);
        arquivo = '';
        campo_container.classList.remove('aberto');
        resp_quem = null;
        resp_text = null;
        resp_cor = null;
        resp_cor_texto = null;
        resp_id = null;
        resp_cor_nome = null;
        escrita.value = '';
    };
};

async function enviando(mensagem, resposta_quem, resposta_texto, resposta_cor, resposta_cor_texto, resposta_id, resposta_cor_nome) {
    // Pega sua cores atuais
    let cores = JSON.parse(localStorage.getItem('cores')) ?? {
        corTema: '#8A2BE2',
        corFundo: 'black',
        corTexto: 'white',
        corNomes: 'white',
        imagemFundo: `sem_imagem`,
    };

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

    suaUltimaMsgId++;
    // Talvez isso bugue (em fase de testes)
    ultima_id++;
    
    // Manda essa mensagem para renderizar
    render(msg);
};

// Atualiza uma mensagem já enviada
async function atualizandoMsg(msgAtualizada, id, minutos) {
    const { data, error } = await supabase.from('chat')
        .update({ msg: `${msgAtualizada}`, id_mensagem: `att_${id}` })
        .eq('id_mensagem', `${id}`)
        .eq('minutos', `${minutos}`);

    if (error) {
        aviso(error, 'funct_attMSG');
    };
};

// Enviando imagem
const midia = document.getElementById('upload');

// Prepara a midia
midia.addEventListener('change', (event) => {
    const minuto = String(new Date().getMinutes()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10);
    arquivo = '';
    nomeArquivo = '';
    arquivo = event.target.files;
    const nomeArq = seuNome + suaUltimaMsgId + minuto + random + limitador;

    if (!arquivo || arquivo[0].size < 1000) return;

    if (arquivo[0].type.includes('image')) nomeArquivo = "imagem/" + nomeArq;
    else if (arquivo[0].type.includes('audio')) nomeArquivo = "audio/" + nomeArq;

    escrita.value = nomeArquivo;
});

// Converte para webp
function convertendoParaWebp(arquivo, escala, qualidade, callback) {
    const img = new Image();
    img.src = URL.createObjectURL(arquivo);

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;

        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(callback, 'image/webp', qualidade);
    };
}

// Envia a midia
async function enviarMidia(arquivo) {

    const { data, error } = await supabase.storage
        .from(`imagens`)
        .upload(`${nomeArquivo.split(limitador)[0].trim()}`, arquivo, { contentType: arquivo.type });

    if (error) {
        console.log(error)
        aviso(error, 'funct_envMID')
    };
};

// Envia a miniatura da imagem. Isso será usado quando a imagem for respondida
async function enviarMiniatura(arquivo) {

    const { data, error } = await supabase.storage
        .from(`imagens`)
        .upload(`${nomeArquivo.split(limitador)[0].trim()}-miniatura`, arquivo, { contentType: arquivo.type });

    if (error) {
        console.log(error)
        aviso(error, 'funct_envMINI')
    };
};

// Procura por mensagens que não foram baixadas
async function baixandoMsgs() {
    console.log('tamanho do chat: ' + chat.length)
    console.log('ultima id: ' + ultima_id)

    const { data, error } = await supabase.from('chat')
        .select('id, nome_usuario, msg, cor, id_mensagem, horas, minutos, cor_texto, cor_nome, resposta_quem, resposta_texto, resposta_cor, resposta_cor_texto, resposta_cor_nome, id_respondendo')
        .gt('id', ultima_id)
        .order('id', { ascending: false })
        .limit(20);

    if (error) {
        console.log(error)
        aviso(error, 'funct_sincronizando')
    };

    if (data.length > 0) {
        const novasMsgs_container = document.createElement('div');
        novasMsgs_container.id = 'novasMsgs';
        novasMsgs_container.textContent = 'novas mensagens';
        vitrine.appendChild(novasMsgs_container);

        data.reverse().forEach(render);
        chat.push(...data);
        localStorage.setItem('chat', JSON.stringify(chat))
    }
};

// Automaticamente pega as mensagens novas
let channel;
function procurandoMsg() {
    channel = supabase
        .channel('chat-realtime')
        .on('postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat'
            },
            (payload) => {
                const msg = payload.new;
                if (msg.nome_usuario != seuNome && msg.aba === 'grupo') {
                    render(msg)
                    console.log('Mensagem Nova');
                };
            }
        )
        .on('postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat'
            },
            (payload) => {
                const msg = payload.new;
                const container = document.querySelector(`#${msg.id_mensagem.split('att_')[1]} > p`) ?? '';
                if (container != '' && msg.aba === 'grupo') {
                    container.innerHTML = msg.msg;
                };
            }
        )
        .subscribe();
};
