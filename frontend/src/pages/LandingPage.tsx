import { useEffect } from 'react';

export function LandingPage() {
  useEffect(() => {
    // Ajusta o título da página
    document.title = 'MerendaChef — Concurso Culinário FAETEC 2026';
  }, []);

  return (
    <div style={{ margin: 0, padding: 0 }} dangerouslySetInnerHTML={{ __html: landingHtml }} />
  );
}

// Lista de documentos do edital exibidos no dropdown "Baixar Edital".
//
// COMO PUBLICAR UMA NOVA RETIFICAÇÃO (repita este processo em App.tsx também):
// 1. Suba o PDF em frontend/public/, com o nome edital-merendachef-retificacao-N.pdf
// 2. Adicione uma linha nova no array abaixo, seguindo o padrão das existentes
// 3. git add / commit / push, depois "Pull and redeploy" no Portainer (não precisa mexer no banco)
const EDITAL_DOCUMENTOS = [
  { label: 'Edital Original', arquivo: '/edital-merendachef.pdf' },
  { label: 'Retificação nº 1', arquivo: '/edital-merendachef-retificacao-1.pdf' },
];

const editalMenuHtml = EDITAL_DOCUMENTOS.map(doc =>
  `<a href="${doc.arquivo}" target="_blank" rel="noopener noreferrer">📄 ${doc.label}</a>`
).join('');

const landingHtml = `
<style>
  :root{
    --blue:#1199d7;
    --orange:#ff6b25;
    --dark:#120e15;
    --light-blue:#dfeaf1;
    --text:#31343a;
    --footer-blue:#2f79ad;
    --container:1540px;
    --font: Arial, Helvetica, sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;background:#fff;}
  body{font-family:var(--font);background:#fff;color:var(--text);font-size:18px;line-height:1.35;overflow-x:hidden;}
  a{text-decoration:none;color:inherit;}
  img{display:block;max-width:100%;}
  .site{width:100%;background:#fff;overflow:hidden;}
  .container{width:min(var(--container),calc(100% - 44px));margin-inline:auto;}
  .header{height:58px;background:#fff;display:flex;align-items:center;position:relative;z-index:20;box-shadow:0 1px 3px rgba(0,0,0,.18);}
  .header-inner{width:min(1560px,calc(100% - 44px));margin-inline:auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;height:100%;}
  .header-left{display:flex;align-items:center;justify-content:flex-start;}
  .header-center{display:flex;align-items:center;justify-content:center;gap:24px;min-width:0;}
  .header-right{display:flex;align-items:center;justify-content:flex-end;}
  .logo-merenda-img{display:block;width:auto;height:46px;max-width:290px;object-fit:contain;}
  .logo-faperj{height:35px;width:auto;object-fit:contain;}
  .logo-faetec-governo{height:39px;width:auto;object-fit:contain;}
  .candidate-btn{background:#d75e36;color:#fff;border-radius:8px;padding:10px 22px;font-size:15px;font-weight:700;box-shadow:inset 0 -1px 0 rgba(0,0,0,.12);white-space:nowrap;}
  .hero{height:690px;position:relative;background:#2b1a14;overflow:hidden;}
  .hero::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.60) 0%,rgba(0,0,0,.43) 35%,rgba(0,0,0,.07) 62%,rgba(0,0,0,.18) 100%),url('/imgs/ImagemChefs.png') center bottom/cover no-repeat;filter:saturate(.98);}
  .hero-inner{position:relative;z-index:2;height:100%;display:flex;align-items:center;}
  .hero-copy{width:760px;margin-top:62px;margin-left:36px;color:#fff;}
  .hero-copy h1{color:var(--blue);font-size:54px;line-height:1.02;font-weight:900;letter-spacing:-2px;margin-bottom:24px;text-shadow:0 1px 2px rgba(0,0,0,.18);}
  .hero-copy p{font-size:20px;max-width:760px;margin-bottom:34px;color:#fff;font-weight:700;}
  .btn-row{display:flex;gap:62px;align-items:center;}
  .btn{display:inline-flex;align-items:center;justify-content:center;min-width:205px;height:48px;border-radius:8px;background:#eef2f4;color:#8a4e45;font-size:18px;letter-spacing:.08em;font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,.24);}
  .btn:hover{filter:brightness(.96);}
  .benefits{position:relative;background:radial-gradient(circle at 50% -10%,#211926 0%,var(--dark) 46%,#0d0b10 100%);padding:44px 0 78px;color:#fff;min-height:600px;}
  .benefits h3{text-align:center;font-size:30px;color:#fff;font-weight:400;margin-bottom:24px;}
  .benefits .lead{text-align:center;max-width:800px;margin:0 auto 52px;font-size:15px;color:#f2edf4;line-height:1.45;font-weight:700;}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;width:min(1120px,100%);margin:0 auto;}
  .card{background:#f2f0f0;color:#333;border-radius:8px;min-height:355px;padding:28px 24px 24px;box-shadow:0 1px 2px rgba(0,0,0,.35);}
  .card-icon{height:110px;display:flex;align-items:center;justify-content:center;margin-bottom:26px;}
  .emoji-icon{width:92px;height:92px;border-radius:24px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#ffffff 0%,#e8eef2 100%);border:2px solid #121212;color:#111;font-size:48px;line-height:1;box-shadow:0 4px 0 rgba(0,0,0,.08);}
  .card h4{color:#126fbb;font-size:24px;line-height:1.04;margin-bottom:14px;font-weight:900;}
  .card p{font-size:14px;line-height:1.55;color:#5f5f5f;font-weight:700;}
  .red-texture{background:repeating-linear-gradient(0deg,rgba(255,255,255,.026) 0 1px,transparent 1px 8px),linear-gradient(180deg,#b94239 0%,#a93531 100%);}
  .purpose{padding:54px 0 50px;color:#fff;border-top:1px solid rgba(0,0,0,.22);border-bottom:1px solid rgba(0,0,0,.22);}
  .purpose-grid{display:grid;grid-template-columns:520px 1fr;gap:86px;align-items:center;width:min(1180px,calc(100% - 64px));margin:0 auto;}
  .meal-photo{height:285px;border-radius:12px;background:url('/imgs/ImagemAlunos.png') center/cover no-repeat;box-shadow:0 1px 3px rgba(0,0,0,.18);}
  .purpose h2{font-size:32px;line-height:1.05;font-weight:500;margin-bottom:20px;color:#fff;}
  .purpose p{font-size:15px;line-height:1.62;max-width:560px;color:#fff;font-weight:700;}
  .responsibility{position:relative;padding:50px 0 104px;color:#fff;text-align:center;min-height:285px;}
  .responsibility .kicker{font-size:18px;text-transform:uppercase;color:#f4d8d5;margin-bottom:11px;font-weight:400;}
  .responsibility h2{font-size:26px;font-weight:400;color:#fff;margin-bottom:18px;}
  .responsibility p{font-size:14px;line-height:1.6;color:#fff;max-width:860px;margin:0 auto;font-weight:700;}
  .tray{position:absolute;left:50%;bottom:-110px;transform:translateX(-50%);width:610px;height:210px;background:url('/imgs/imagemPrato.png') center/contain no-repeat;z-index:3;pointer-events:none;}
  .steps{background:var(--light-blue);padding:165px 0 96px;text-align:center;color:#5d6064;}
  .steps h2{font-size:27px;font-weight:400;color:#666;margin-bottom:38px;}
  .step-list{width:min(880px,100%);margin:0 auto 34px;display:grid;gap:18px;text-align:left;}
  .step-item{background:#fff;border-radius:7px;min-height:80px;display:grid;grid-template-columns:64px 1fr;align-items:center;padding:16px 30px 16px 20px;box-shadow:0 1px 1px rgba(0,0,0,.05);}
  .num{width:30px;height:30px;border-radius:50%;background:#304d9a;color:#fff;font-size:14px;font-weight:700;display:grid;place-items:center;justify-self:center;}
  .step-item h3{font-size:15px;color:#333;margin-bottom:5px;font-weight:900;}
  .step-item p{font-size:13px;color:#333;line-height:1.28;font-weight:600;}
  .steps .prize{font-size:26px;line-height:1.12;color:#777;margin-top:28px;}
  .impact{background:#fff;padding:80px 0 66px;}
  .impact-grid{display:grid;grid-template-columns:1fr 520px;gap:120px;align-items:center;width:min(1220px,calc(100% - 64px));margin:0 auto;}
  .impact h2{font-size:34px;line-height:1.18;font-weight:400;color:#303744;margin-bottom:26px;}
  .impact p{font-size:16px;line-height:1.62;color:#222;font-weight:700;margin-bottom:20px;max-width:560px;}
  .diagram{height:410px;background:url('/imgs/ImagemFinal.png') center/contain no-repeat;}
  .cta{background:#fff;text-align:center;padding:14px 0 48px;}
  .cta h2{font-size:42px;color:var(--blue);font-weight:900;margin-bottom:26px;letter-spacing:-.5px;}
  .cta .btn-row{justify-content:center;gap:62px;}
  .footer{height:86px;background:var(--footer-blue);color:#fff;display:flex;align-items:center;}
  .footer-inner{width:min(1560px,calc(100% - 160px));height:100%;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .footer-logos{display:flex;align-items:center;}
  .logo-footer{height:62px;width:auto;object-fit:contain;}
  .social{display:flex;align-items:center;gap:24px;}
  .social a{color:#fff;font-size:28px;line-height:1;font-weight:800;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;opacity:.96;}
  .social a:hover{opacity:.75;}
  .social .linkedin{font-size:23px;font-weight:900;}
  .edital-dropdown-wrap{position:relative;display:inline-block;}
  .edital-dropdown-wrap summary{list-style:none;cursor:pointer;}
  .edital-dropdown-wrap summary::-webkit-details-marker{display:none;}
  .edital-menu{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);background:#fff;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);padding:8px;min-width:230px;z-index:40;text-align:left;}
  .edital-menu a{display:block;padding:10px 14px;border-radius:6px;font-size:14px;color:#333;font-weight:600;white-space:nowrap;}
  .edital-menu a:hover{background:#f3f4f6;}
  @media(max-width:1200px){.container{width:min(1050px,calc(100% - 70px));}.header-inner{width:min(1120px,calc(100% - 60px));}.logo-merenda-img{height:38px;max-width:240px;}.hero{height:520px;}.hero-copy{width:560px;margin-top:20px;margin-left:0;}.hero-copy h1{font-size:36px;}.hero-copy p{font-size:15px;max-width:560px;}.btn{min-width:116px;height:31px;font-size:12px;letter-spacing:0;}.btn-row{gap:34px;}.cards{width:min(760px,100%);}.card{min-height:280px;padding:16px;}.emoji-icon{width:74px;height:74px;font-size:38px;border-radius:18px;}.card h4{font-size:18px;}.card p{font-size:11px;}.footer{height:78px;}.footer-inner{width:min(1120px,calc(100% - 60px));}.logo-footer{height:54px;}.social{gap:22px;}.social a{font-size:26px;}}
  @media(max-width:920px){:root{--container:720px;}body{font-size:16px;}.container{width:min(var(--container),calc(100% - 32px));}.header{height:auto;padding:8px 0;}.header-inner{width:min(720px,calc(100% - 32px));grid-template-columns:1fr;gap:8px;justify-items:center;}.header-left,.header-center,.header-right{justify-content:center;}.header-center{display:flex;flex-wrap:wrap;gap:10px;}.logo-merenda-img{height:36px;max-width:230px;}.logo-faperj{height:24px;}.logo-faetec-governo{height:28px;}.candidate-btn{font-size:12px;padding:7px 14px;}.hero{height:520px;}.hero::before{background-position:60% bottom;}.hero-copy{width:min(560px,100%);margin-left:0;margin-top:120px;}.hero-copy h1{font-size:34px;}.hero-copy p{font-size:14px;}.cards{grid-template-columns:repeat(2,1fr);width:min(650px,100%);}.purpose-grid,.impact-grid{grid-template-columns:1fr;gap:28px;width:min(650px,calc(100% - 32px));}.meal-photo{width:100%;max-width:500px;margin:0 auto;}.purpose h2,.purpose p{text-align:left;max-width:none;}.diagram{max-width:410px;margin:0 auto;width:100%;}.impact p{max-width:none;}.footer{height:auto;min-height:86px;padding:18px 0;}.footer-inner{width:min(720px,calc(100% - 32px));flex-direction:column;justify-content:center;gap:18px;}.logo-footer{height:54px;}.social{gap:20px;}.social a{font-size:24px;}}
  @media(max-width:620px){body{font-size:15px;}.container{width:min(100% - 26px,var(--container));}.hero{height:auto;min-height:540px;}.hero::before{background-position:62% bottom;}.hero-inner{align-items:flex-end;padding:210px 0 48px;}.hero-copy{width:100%;margin:0;}.hero-copy h1{font-size:29px;}.hero-copy p{font-size:13px;max-width:100%;}.btn-row{gap:14px;flex-wrap:wrap;}.benefits{padding-top:36px;}.cards{grid-template-columns:1fr;width:min(370px,100%);}.card{min-height:auto;}.purpose-grid{width:min(100% - 26px,430px);}.meal-photo{height:220px;}.purpose h2{font-size:23px;}.purpose p{font-size:12px;}.tray{width:310px;height:118px;bottom:-62px;}.steps{padding-top:105px;}.step-list{width:100%;}.impact-grid{width:min(100% - 26px,430px);}.impact h2{font-size:23px;}.diagram{height:265px;}.cta h2{font-size:25px;}.logo-merenda-img{height:34px;max-width:210px;}.footer{min-height:82px;padding:16px 0;}.logo-footer{height:48px;}.social{gap:16px;}.social a{font-size:22px;}}
</style>

<div class="site">
  <header class="header">
    <div class="header-inner">
      <div class="header-left">
        <img class="logo-merenda-img" src="/imgs/LogoMerendaChef.png" alt="Logo Merenda Chef">
      </div>
      <div class="header-center">
        <img class="logo-faperj" src="/imgs/LogoFaperj.png" alt="Logo FAPERJ">
        <img class="logo-faetec-governo" src="/imgs/LogoFaetec_Governo.png" alt="Logo FAETEC e Governo do Estado do Rio de Janeiro">
      </div>
      <div class="header-right">
        <a class="candidate-btn" href="/login">Área do Candidato</a>
      </div>
    </div>
  </header>

  <main>
    <section class="hero" id="inicio">
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>Seu talento na cozinha pode ganhar<br>destaque em toda a rede FAETEC</h1>
          <p>O MerendaChef é o programa da FAETEC que valoriza profissionais da alimentação escolar e destaca os melhores talentos da rede.</p>
          <div class="btn-row">
            <a class="btn" href="/login">Inscreva-se</a>
            <a class="btn" href="#edital">Baixar Edital</a>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits" id="premios">
      <div class="container">
        <h3>Onde o seu talento vira legado.</h3>
        <p class="lead">Mais do que medalhas, oferecemos o reconhecimento que a sua trajetória merece. Os grandes vencedores garantem:</p>
        <div class="cards">
          <article class="card">
            <div class="card-icon" aria-hidden="true"><span class="emoji-icon">🍽️</span></div>
            <h4>Cardápio principal</h4>
            <p>A receita campeã será servida em unidades da FAETEC, tornando o seu prato a referência oficial de sabor para milhares de jovens.</p>
          </article>
          <article class="card">
            <div class="card-icon" aria-hidden="true"><span class="emoji-icon">💰</span></div>
            <h4>Premiação em Dinheiro</h4>
            <p>Reconhecimento financeiro para os três primeiros colocados como incentivo à sua excelência.</p>
          </article>
          <article class="card">
            <div class="card-icon" aria-hidden="true"><span class="emoji-icon">🏆</span></div>
            <h4>Orgulho para sua Escola</h4>
            <p>O campeão leva o Troféu Merenda Chef para casa e para a sua unidade de origem.</p>
          </article>
          <article class="card">
            <div class="card-icon" aria-hidden="true"><span class="emoji-icon">📘</span></div>
            <h4>Destaque no E-book</h4>
            <p>As 20 melhores receitas serão publicadas em um livro digital exclusivo, eternizando sua técnica e criatividade.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="purpose red-texture" id="proposito">
      <div class="purpose-grid">
        <div class="meal-photo" aria-label="Imagem dos alunos durante a merenda"></div>
        <div>
          <h2>Nutrir o corpo é o primeiro passo para alimentar<br>o sonho.</h2>
          <p>Na FAETEC, entendemos que a merenda é muito mais que uma refeição; é uma ferramenta pedagógica e um gesto de cuidado. Nossa missão com o Merenda Chef é elevar o padrão nutricional através do seu olhar técnico e amoroso. É o sabor do cuidado impulsionando o futuro.</p>
        </div>
      </div>
    </section>

    <section class="responsibility red-texture">
      <div class="container">
        <div class="kicker">RESPONSABILIDADE E EFICIÊNCIA</div>
        <h2>Transparência total na gestão da merenda</h2>
        <p>MerendaChef é o programa que transforma a alimentação escolar em uma ferramenta de educação nutricional baseada em ciência, tecnologia e engajamento cultural.</p>
      </div>
      <div class="tray" aria-label="Imagem de bandeja com prato"></div>
    </section>

    <section class="steps" id="etapas">
      <div class="container">
        <h2>O seu caminho até o pódio.</h2>
        <div class="step-list">
          <article class="step-item">
            <div class="num">1</div>
            <div>
              <h3>Inscrição e Criação</h3>
              <p>Escolha sua melhor receita, capriche na apresentação e envie sua inscrição pelo portal oficial.</p>
            </div>
          </article>
          <article class="step-item">
            <div class="num">2</div>
            <div>
              <h3>Curadoria Técnica</h3>
              <p>Nossa banca de especialistas avaliará cada detalhe: equilíbrio nutricional, criatividade e viabilidade técnica.</p>
            </div>
          </article>
          <article class="step-item">
            <div class="num">3</div>
            <div>
              <h3>A Grande Final</h3>
              <p>Os 20 melhores candidatos disputarão a etapa final, onde o talento será colocado à prova para definir quem é o grande mestre da culinária escolar.</p>
            </div>
          </article>
        </div>
        <div class="prize">O grande prêmio é o reconhecimento do seu<br>talento para toda a rede!</div>
      </div>
    </section>

    <section class="impact">
      <div class="impact-grid">
        <div>
          <h2>Uma alimentação saudável é o início de um<br>bom aprendizado.</h2>
          <p>A alimentação escolar influencia diretamente a concentração, a memória, a disposição e o desempenho dos estudantes. Quando a nutrição não é planejada a partir de dados reais, perde-se uma grande oportunidade de promover saúde e inclusão no ambiente educacional.</p>
          <p>O MerendaChef nasce para enfrentar esse desafio, combatendo ambientes obesogênicos e respondendo às necessidades nutricionais reais dos alunos, com base em avaliação científica contínua.</p>
        </div>
        <div class="diagram" aria-label="Diagrama sobre concentração, memória, disposição e desempenho"></div>
      </div>
    </section>

    <section class="cta" id="inscricao">
      <div class="container">
        <h2>Mostre seu talento. Torne-se um MerendaChef</h2>
        <div class="btn-row">
          <a class="btn" href="/login">Inscreva-se</a>
          <details class="edital-dropdown-wrap" id="edital">
            <summary class="btn">Baixar Edital ▾</summary>
            <div class="edital-menu">${editalMenuHtml}</div>
          </details>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-logos">
        <img class="logo-footer" src="/imgs/logoFooter.png" alt="Logo FAETEC e Governo do Estado do Rio de Janeiro">
      </div>
      <div class="social" aria-label="Redes sociais">
        <a href="#" aria-label="Instagram">◎</a>
        <a href="#" aria-label="Facebook">f</a>
        <a href="#" aria-label="YouTube">▶</a>
        <a href="#" aria-label="X">𝕏</a>
        <a href="#" class="linkedin" aria-label="LinkedIn">in</a>
      </div>
    </div>
  </footer>
</div>
`;