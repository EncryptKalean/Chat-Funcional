let cores = JSON.parse(localStorage.getItem('cores')) ?? {
    corTema: '#8A2BE2',
    corFundo: 'black',
    corTexto: 'white',
    corNomes: 'white',
    imagemFundo: `sem_imagem`,
};

const body = document.body,
    seuNome = localStorage.getItem('nickname'),
    menu_container = document.getElementById('menu'),
    senha = localStorage.getItem('senha'),
    supabase = window.supabase,
    btn_atualizacao = document.getElementById('procurar_atualizacao'),
    nickOriginal = localStorage.getItem('nickOriginal') ?? '',
    imagens_menu = document.querySelectorAll('#imagens_pred img');

document.getElementById('lista').addEventListener('click', (click) => {
    let apertou = click.target.closest('a');

    // abre o aviso
    if (click.target.closest('#voce > svg')) {
        let nome_novo = document.getElementById('voce_nome').value;
        let aviso = document.getElementById('aviso_troca_nome');
        aviso.classList.add('aberto');
        aviso.querySelector('h3').textContent = nome_novo;
    }

    // Começa o processo
    else if (apertou.name === 'trocar_sim') {
        let input_senha = document.getElementById('senha_input');
        if (input_senha.value === senha && nickOriginal != '') {
            atualizandoNome(document.querySelector('#aviso_troca_nome h3').textContent.trim().toLowerCase());
        }
        else {
            input_senha.style.borderColor = 'red';
        }
    };

});

// VOCE
document.getElementById('voce_nome').setAttribute('value', seuNome);
async function atualizandoNome(novoNome) {
    const { data, error } = await supabase.from('chat')
        .update({ nome_usuario: `${novoNome}` })
        .eq('nome_usuario', `${seuNome}`);

    if (error != null || error != '') {
        localStorage.setItem('nickname', novoNome)
        location.reload()
    }
};

// Menu / Cores
let coresVariaveis = document.documentElement.style;
coresVariaveis.setProperty('--cor_sua', cores.corTema);
coresVariaveis.setProperty('--cor_textos', cores.corTexto);
coresVariaveis.setProperty('--cor_nomes', cores.corNomes);

if (cores.imagemFundo != 'sem_imagem') {
    body.style.background = cores.imagemFundo
}
else {
    coresVariaveis.setProperty('--cor_fundo', cores.corFundo);
    body.style.background = 'var(--cor_fundo)'
}

let orientacao = 'center';

menu_container.addEventListener('click', (click) => {
    let btn = click.target.closest('a');
    // console.log('btn')

    coresVariaveis = document.documentElement.style;

    let cor = window.getComputedStyle(btn).getPropertyValue("background-color");

    if (btn.id === 'fechar_menu') {
        menu_container.classList.remove('aberto')
        btn_atualizacao.textContent = 'procurar atualização'
    }
    else if (btn.classList.contains('cor_tema')) {
        cores.corTema = cor
        coresVariaveis.setProperty('--cor_sua', cor)
    }
    else if (btn.id === 'testar_cor_tema_btn') {
        let cor_input = document.getElementById('cor_tema_input').value.trim()
        cores.corTema = cor_input
        coresVariaveis.setProperty('--cor_sua', cor_input)
    }
    else if (btn.classList.contains('cor_fundo')) {
        body.style.background = 'var(--cor_fundo)'
        coresVariaveis.setProperty('--cor_fundo', cor)
        cores.corFundo = cor
        cores.imagemFundo = 'sem_imagem';
    }
    else if (btn.id === 'testar_cor_fundo_btn') {
        let cor_input = document.getElementById('cor_fundo_input').value.trim();
        coresVariaveis.setProperty('--cor_fundo', cor_input);
        cores.imagemFundo = 'sem_imagem';
        cores.corFundo = cor_input;
        body.style.background = 'var(--cor_fundo)'
    }
    else if (btn.id === 'testar_imagem_fundo_btn') {
        let imagem_input = document.getElementById('imagem_fundo_input').value.trim();

        body.style.background = `linear-gradient(rgba(0, 255, 85, 0), rgba(0, 0, 0, 0.6)), url(${imagem_input}) center ${orientacao} / cover no-repeat`;

        cores.imagemFundo = `linear-gradient(rgba(0, 255, 85, 0), rgba(0, 0, 0, 0.6)), url(${imagem_input}) center ${orientacao} / cover no-repeat`;
    }
    else if(btn.parentElement === document.getElementById('orientacao_imagens')){
        orientacao = btn.name;
        imagens_menu.forEach((el)=>{
            el.style.setProperty('object-position', orientacao);
        })
    }
    else if(btn.parentElement === document.getElementById('imagens_pred')){
        let img = btn.querySelector('img').src;

        body.style.background = `linear-gradient(rgba(0, 255, 85, 0), rgba(0, 0, 0, 0.6)), url(${img}) center ${orientacao} / cover no-repeat`;

        cores.imagemFundo = `linear-gradient(rgba(0, 255, 85, 0), rgba(0, 0, 0, 0.6)), url(${img}) center ${orientacao} / cover no-repeat`;
    }
    else if (btn.classList.contains('cor_texto')) {
        coresVariaveis.setProperty('--cor_textos', cor)
        cores.corTexto = cor
    }
    else if (btn.classList.contains('cor_nomes')) {
        coresVariaveis.setProperty('--cor_nomes', cor)
        cores.corNomes = cor
    }
    else if (btn.id === btn_atualizacao.id) {
        if (btn.name === 'atualizar') {
            location.reload()
        }
        else {
            btn_atualizacao.textContent = 'procurando...'
            setTimeout(() => {
                procurandoATT().then(att => btn_atualizacao.textContent = att)
            }, 100)
        }
    }
    else if (btn.id === 'salvar_cores' && menu_container.classList.contains('aberto')) {
        btn.style.backgroundColor = 'green'
        btn.textContent = 'salvando...'
        setTimeout(() => {
            localStorage.setItem('cores', JSON.stringify(cores))
            btn.style.backgroundColor = 'var(--cor_sua)';
            btn.textContent = 'salvar'
            menu_container.classList.remove('aberto')
        }, 1000)
    }
});
