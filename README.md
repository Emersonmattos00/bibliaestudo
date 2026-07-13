# 📖 PLATAFORMA DE ESTUDOS BÍBLICOS DIGITAL

## 🌟 Visão Geral

Uma plataforma web completa para estudo da Bíblia Sagrada, oferecendo recursos interativos como Bíblia Comentada, Textos Originais, Enciclopédias e Hinários. Desenvolvida com foco em acessibilidade, performance e experiência do usuário.

---

## 🎯 Funcionalidades

### 📚 Recursos Principais

| Recurso | Descrição |
|---------|-----------|
| **Bíblia Sagrada** | Texto completo com destaque para falas de Deus em vermelho |
| **Bíblia Comentada** | Comentários versículo por versículo |
| **Textos Originais** | Hebraico, Grego e Latim |
| **Bíblia Apologética** | Defesa da fé cristã |
| **Enciclopédia Cristológica** | Estudo aprofundado sobre Cristo |
| **Enciclopédia Bíblica** | Personagens e acontecimentos |
| **Harpa Cristã** | Hinos das Assembléias de Deus |
| **Cantor Cristão** | Hinos clássicos batistas |

### ✨ Características Técnicas

- ✅ **Flipbook Interativo** - Efeito de livro com turn.js
- ✅ **Design Responsivo** - Adaptado para todos os dispositivos
- ✅ **Modo Claro/Escuro** - Tema personalizável
- ✅ **Leitura Offline** - Com Service Worker (PWA)
- ✅ **Acessibilidade** - Navegação por teclado e leitores de tela
- ✅ **Performance Otimizada** - Lazy loading e cache
- ✅ **SEO Amigável** - Meta tags e dados estruturados

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis e temas
- **JavaScript (ES6+)** - Lógica e interatividade
- **jQuery** - Manipulação do DOM
- **jQuery UI** - Componentes de interface
- **turn.js** - Flipbook interativo
- **Font Awesome** - Ícones vetoriais

### PWA (Progressive Web App)
- **Service Worker** - Cache e offline
- **Manifest.json** - Instalação no dispositivo

### SEO & Analytics
- **Schema.org** - Dados estruturados JSON-LD
- **Open Graph** - Compartilhamento em redes sociais
- **Twitter Cards** - Prévia otimizada

---

## 📁 Estrutura do Projeto

```
biblia-plataforma/
├── index.html              # Página principal
├── bibliasagrada.html      # Bíblia Sagrada
├── comentada.html          # Bíblia Comentada
├── original.html           # Textos Originais
├── apologetica.html        # Bíblia Apologética
├── cristologia.html        # Enciclopédia Cristológica
├── enciclopedia.html       # Enciclopédia Bíblica
├── harpa.html             # Harpa Cristã
├── Cantor.html            # Cantor Cristão
├── apoiar.html            # Página de apoio
│
├── style.css              # Estilos globais
├── jquery-ui.css          # Estilos jQuery UI
├── quill.snow.css         # Editor de texto
│
├── assets/
│   ├── capa/              # Capas dos livros
│   │   ├── biblesagrada.webp
│   │   ├── comentada.webp
│   │   ├── original.webp
│   │   ├── apologetica.webp
│   │   ├── enciclopedia.webp
│   │   └── harpa.webp
│   ├── icons/             # Ícones do PWA
│   │   └── bible-icon-192.png
│   └── pics/              # Imagens diversas
│       └── qrcode.jpg
│
├── apolo/                  # Dados dos textos
│   ├── genesis.js
│   ├── exodo.js
│   └── ...
│
├── livros/                 # Dados dos comentários
│   ├── genesis.js
│   ├── exodo.js
│   └── ...
│
├── sw.js                   # Service Worker
├── manifest-biblia.json    # Manifest PWA
├── sitemap.xml             # Mapa do site
├── robots.txt              # Configuração de robôs
│
├── jquery-3.7.1.min.js     # jQuery
├── turn.min.js             # Flipbook
└── README.md               # Este arquivo
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Servidor web (Apache, Nginx, etc.)
- Conexão com internet para CDN (ou arquivos locais)

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/biblia-plataforma.git
cd biblia-plataforma
```

### 2. Configurar Servidor Web

#### Apache (.htaccess)
```apache
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "DENY"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^biblia/([^/]+)/([^/]+)$ bibliasagrada.html?livro=$1&capitulo=$2 [L,QSA]
</IfModule>
```

#### Nginx
```nginx
location / {
    try_files $uri $uri/ =404;
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 3. Configurar PWA

1. Edite `manifest-biblia.json` com suas informações:
```json
{
  "name": "Plataforma de Estudos Bíblicos",
  "short_name": "Bíblia Digital",
  "start_url": "index.html",
  "display": "standalone",
  "background_color": "#4a2c1a",
  "theme_color": "#4a2c1a"
}
```

2. Atualize `sw.js` com os arquivos a serem cacheados

### 4. Configurar SEO

1. Substitua as URLs nos meta tags:
```html
<meta property="og:url" content="https://seusite.com" />
<link rel="canonical" href="https://seusite.com" />
```

2. Adicione seu código do Google Analytics:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## 📦 Estrutura de Dados

### Dados dos Livros (`apolo/livro.js`)

```javascript
window.LIVRO_DATA = {
    nome: "Gênesis",
    abrev: "Gn",
    dados: {
        "1": [
            "No princípio criou Deus os céus e a terra.",
            "E a terra era sem forma e vazia..."
        ],
        "2": [
            "Assim os céus e a terra foram acabados..."
        ]
    }
};
```

### Dados dos Comentários (`livros/livro.js`)

```javascript
window.LIVRO_DATA = {
    nome: "Gênesis",
    dados: {
        "1": [
            "<strong>VERSÍCULO: 1</strong>",
            "<strong>TEXTO:</strong> No princípio criou Deus...",
            "<strong>COMENTÁRIO:</strong> Este versículo estabelece...",
            "<strong>RESUMO:</strong> Deus é o Criador...",
            "<strong>CONEXÃO BÍBLICA:</strong> João 1:1-3..."
        ]
    }
};
```

---

## 🎨 Personalização

### Cores e Temas

Edite as variáveis CSS em `:root`:

```css
:root {
    --primary: #8B4513;
    --primary-dark: #4a2c1a;
    --gold: #ffd966;
    --cream: #fffef7;
    --shadow: 0 8px 32px rgba(0,0,0,0.2);
    --radius: 16px;
    --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Adicionar Novo Livro

1. Adicione o ID do livro em `LIVROS_INFO`:
```javascript
const LIVROS_INFO = {
    // ...
    "novolivro": { nome: "Novo Livro", abrev: "NL", testamento: "antigo" }
};
```

2. Adicione às listas de livros:
```javascript
const LIVROS_AT = [
    // ...
    "novolivro"
];
```

3. Crie os arquivos de dados:
- `apolo/novolivro.js` - Texto do livro
- `livros/novolivro.js` - Comentários (opcional)

---

## 📱 Suporte a Dispositivos

| Dispositivo | Suporte | Observações |
|-------------|---------|-------------|
| Desktop (Windows/Mac/Linux) | ✅ Completo | Melhor experiência |
| Tablet (iPad/Android) | ✅ Completo | Interface adaptada |
| Smartphone (iOS/Android) | ✅ Completo | Design responsivo |
| PWA (Instalação) | ✅ Completo | Funciona offline |

### Navegadores Suportados

- ✅ Chrome (últimas 2 versões)
- ✅ Firefox (últimas 2 versões)
- ✅ Safari (últimas 2 versões)
- ✅ Edge (últimas 2 versões)
- ✅ Opera (últimas 2 versões)

---

## 🤝 Contribuindo

### Como Contribuir

1. **Fork** o projeto
2. Crie sua **Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Padrões de Código

- **HTML**: Semântico e acessível
- **CSS**: BEM ou classes descritivas
- **JavaScript**: ES6+ com comentários

### Reportar Bugs

Use as issues do GitHub com o template:

```markdown
## Descrição do Bug
[Descreva o problema]

## Como Reproduzir
1. Passo 1
2. Passo 2

## Comportamento Esperado
[Descreva o esperado]

## Screenshots
[Adicione se necessário]

## Ambiente
- Navegador: [ex: Chrome 120]
- Dispositivo: [ex: Windows 11]
```

---

## 📊 SEO e Performance

### Otimizações Implementadas

| Aspecto | Técnica |
|---------|---------|
| **SEO** | Meta tags, JSON-LD, breadcrumbs, sitemap.xml |
| **Performance** | Preload, prefetch, lazy loading, cache |
| **Acessibilidade** | ARIA labels, skip links, focus indicators |
| **PWA** | Service Worker, manifest.json, offline |

### Métricas Alvo

| Métrica | Alvo | Status |
|---------|------|--------|
| First Contentful Paint | < 1.8s | ✅ |
| Largest Contentful Paint | < 2.5s | ✅ |
| Total Blocking Time | < 200ms | ✅ |
| Cumulative Layout Shift | < 0.1 | ✅ |
| Lighthouse Score | > 90 | ✅ |

---

## 📝 Licença

Este projeto é distribuído sob a licença **MIT**.

```
MIT License

Copyright (c) 2024 Emerson José de Mello Mattos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Agradecimentos

- **King James Version 1769** - Tradução base
- **turn.js** - Biblioteca de flipbook
- **Font Awesome** - Ícones
- **jQuery** - Manipulação DOM
- **Todos os apoiadores** que contribuem para manter o projeto

---

## 📞 Contato

### Autor
**Pastor Emerson José de Mello Mattos**

- 📧 emerson.mattos00@gmail.com
- 📧 emerson.mattos01@gmail.com
- 📱 (21) 97507-9806
- 📱 (21) 96661-4971

### Redes Sociais
- 🔗 [Facebook](https://facebook.com/seu-perfil)
- 🔗 [Instagram](https://instagram.com/seu-perfil)
- 🔗 [YouTube](https://youtube.com/seu-canal)

### Suporte
Para dúvidas ou sugestões, entre em contato pelos canais acima ou abra uma issue no GitHub.

---

## 📜 Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2024-01 | Lançamento inicial |
| 1.1.0 | 2024-03 | Adicionado PWA e offline |
| 1.2.0 | 2024-06 | Melhorias de acessibilidade |
| 1.3.0 | 2024-09 | Tema claro/escuro e otimizações |

---

## 🎯 Roadmap

### Próximas Features

- [ ] Sistema de notas e marcadores
- [ ] Compartilhamento de versículos
- [ ] Busca avançada com filtros
- [ ] Planos de leitura diários
- [ ] Sistema de usuários e progresso
- [ ] Podcast com áudio da Bíblia
- [ ] Traduções em múltiplos idiomas
- [ ] Modo de estudo com destaques

### Melhorias Planejadas

- [ ] CI/CD para deploy automático
- [ ] Testes automatizados
- [ ] Documentação da API
- [ ] Suporte a mais versões da Bíblia
- [ ] Integração com redes sociais

---

## ⭐ Como Apoiar

### Doação Via PIX

**Chave PIX:** `emerson.mattos00@gmail.com`

### QR Code
![QR Code PIX](assets/pics/qrcode.jpg)

### Outras Formas
- Compartilhe o projeto nas redes sociais
- Contribua com sugestões e correções
- Divulgue para sua igreja e comunidade

---

**"Lâmpada para os meus pés é tua palavra, e luz para o meu caminho"** — Salmos 119:105

---

*Plataforma de Estudos Bíblicos Digital - © 2026 Todos os direitos reservados*
