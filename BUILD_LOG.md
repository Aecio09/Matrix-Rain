# BUILD LOG — Matrix Rain (Expo + React Native + TypeScript)

Registro do processo de desenvolvimento do efeito **Matrix Rain**, conforme descrito em
`context.md`. Cada entrada documenta o pedido, as decisões, as ações, o resultado e os
problemas encontrados.

---

## Entrada 1 — Primeira versão: Matrix Rain em CPU

### Prompt / Request

> "Leia o `context.md`, não utilize comandos de build apenas comandos para teste, utilizaremos
> expo com typescript, o objetivo é fazer primeiro uma versão que utiliza apenas CPU sem
> utilizar GPU, vamos utilizar uma fonte bold, e vamos utilizar cores coloridas, faça o código
> de forma simples sem nada muito complexo."

Requisitos derivados do pedido + `context.md`:

1. Implementar o efeito Matrix Rain.
2. Primeira versão **somente CPU** (sem GPU).
3. Usar **Expo + TypeScript** (projeto já existente).
4. Usar uma **fonte bold**.
5. Usar **cores coloridas**.
6. Código **simples**, sem complexidade desnecessária.
7. Personagens, cores e velocidades devem ser **gerados aleatoriamente** (restrição 3 do `context.md`).
8. Não rodar comandos de build — apenas de teste (`tsc`, `expo lint`).

### Decision Summary

| Decisão | Escolha | Motivo |
|---|---|---|
| Renderização | Componentes nativos `View` + `Text` re-renderizados por estado React | É a forma mais direta de "CPU only": todo o trabalho é feito no JS/React, sem Skia, WebGL ou Reanimated (GPU). |
| Loop de animação | `setInterval` + `useState` | Simples e explícito. O "tick" da CPU atualiza a simulação e força o React a repintar a árvore. |
| Tipografia | `fontWeight: '900'` (bold) em uma única fonte | Atende "fonte bold" mantendo o código simples. |
| Cores | `hsl()` com matiz aleatório por coluna + deslocamento de matiz por linha (arco-íris) | Gera cores coloridas/variadas sem paleta fixa. |
| Personagens | Geração aleatória (Katakana + dígitos/letras) em tempo de execução | Restrição 3: não usar conjunto fixo de caracteres. |
| Velocidade | Aleatória por coluna (0.25–1.1 linhas/tick) | Restrição 3: velocidade aleatória. |
| Rastro | Cada caractere tem um "nível" que decai 10% por tick | Produz o efeito de fade clássico do Matrix. |
| Coluna em destaque | Caractere da "cabeça" (nível > 0.92) pintado de branco | Contraste do caractere líder. |

Arquivo alterado: **`src/app/index.tsx`** (a tela inicial do app passa a ser o Matrix Rain).

### Actions Performed

1. Li `context.md` e confirmei as restrições (CPU-only, aleatoriedade, documentar decisões).
2. Inspecionei a estrutura do projeto Expo Router (`src/app/`), o `package.json`
   (Expo `~57.0.30`, React Native `0.86.3`, React `19.2.3`) e o `app.json`.
3. Reescrevi `src/app/index.tsx` com o efeito, contendo:
   - `randomChar()` — 75% Katakana (`U+30A0–U+30FF`), 25% dígitos/letras, tudo via `String.fromCharCode` + `Math.random`.
   - `cellColor(hue, row, level)` — cor `hsl` colorida, com branco na cabeça.
   - `createColumns(cols, rows)` — cria colunas com fase, velocidade e matiz aleatórias.
   - `advanceColumn(col, rows)` — avança uma coluna em um tick (decai brilho, escreve novo caractere na cabeça e recicla ao sair da tela).
   - `MatrixScreen` — componente que agenda o loop com `setInterval` e renderiza uma coluna por `Text`, com `Text` aninhados (uma cor por caractere).
4. Rodei apenas comandos de **teste** (sem build): `npx tsc --noEmit` e `npx expo lint`.

### Result

- O app agora abre diretamente no Matrix Rain: fundo preto, colunas de caracteres caindo com
  rastro que desvanece, fonte bold e cores coloridas (arco-íris por coluna/linha).
- Personagens, cores e velocidades são gerados aleatoriamente a cada execução e a cada
  "reciclagem" de coluna — não há conjunto fixo de caracteres, cores ou velocidades.
- `npx tsc --noEmit`: **nenhum erro em `src/app/index.tsx`**.
- `npx expo lint`: **nenhum problema em `src/app/index.tsx`**.

### Problems / Errors

1. **`react-hooks/refs` — "Cannot access refs during render".**
   A primeira versão guardava a simulação em um `useRef` e lia `columnsRef.current` durante o
   render. O React Compiler (habilitado em `app.json`) e a regra de lint proíbem isso.

2. **Erros de typecheck pré-existentes no template** (não relacionados a esta tarefa):
   - `src/components/animated-icon.web.tsx(5,21): Cannot find module './animated-icon.module.css'`
   - `src/constants/theme.ts(6,8): Cannot find module '@/global.css'`
   Esses erros existem no template original e não foram introduzidos por esta mudança.

3. **Erro de lint pré-existente no template**:
   - `src/hooks/use-color-scheme.web.ts:11` — `react-hooks/set-state-in-effect`.

4. **`expo lint` não encontrou config de ESLint** e instalou automaticamente
   `eslint` + `eslint-config-expo`, quebrando na primeira execução ("ESLint not installed").
   Foi necessário rodar o comando uma segunda vez.

### Fixes Attempted

1. Troquei o `useRef` que era lido no render por **estado** (`useState<Column[]>`):
   - `advanceColumn` passou a retornar uma **cópia nova** da coluna (imutável), evitando mutação
     escondida e respeitando as regras de hooks/React Compiler.
   - O `setInterval` usa `setColumns((prev) => ...)` com atualização funcional, inclusive
     recriando a grade quando o tamanho da tela muda (`cols`/`rows`).
   - Resultado: a regra `react-hooks/refs` deixou de acusar erro.

2. Corrigi o aviso `@typescript-eslint/array-type` trocando `Array<[number, number]>` por
   `[number, number][]`.

3. Os erros pré-existentes (itens 2 e 3) **não foram alterados** por serem do template e
   estarem fora do escopo desta tarefa.

4. Repeti `npx expo lint` após a instalação automática do ESLint, e o lint passou a rodar
   normalmente.

### Notes / Próximos passos (não implementados ainda)

- Esta versão é **somente CPU** (restrição 1). Uma comparação futura com uma versão **GPU**
  (ex.: `react-native-skia`) está prevista pelo `context.md` e ficará em uma entrada separada.
- Parâmetros de tuning fáceis de ajustar no topo do arquivo: `FONT_SIZE`, `CELL_H`, `CELL_W`,
  `TICK_MS`, `TRAIL` e `DECAY`.

---

## Entrada 2 — Versão GPU (Skia) + botão de alternância CPU/GPU

### Prompt / Request

> "agora implemente a versão com gpu, deixe um botão para mudar de cpu para gpu, e não se
> esqueça do `context.md`."

Requisitos derivados do pedido + `context.md`:

1. Implementar a versão **GPU-based rendering** (restrição 1 do `context.md`).
2. Manter a versão **CPU** e permitir **alternar entre elas** por um botão.
3. Permitir **comparar** as duas abordagens (identificar gargalos e vantagens) — restrição 1.
4. Continuar **documentando** decisões no `BUILD_LOG.md`.
5. Rodar apenas comandos de teste (`tsc`, `expo lint`) — sem builds.

### Decision Summary

| Decisão | Escolha | Motivo |
|---|---|---|
| Biblioteca GPU | `@shopify/react-native-skia` (v2.6.2) | É a forma padrão de renderização **GPU** no Expo. A doc do Expo confirma que ela vem **inclusa no Expo Go** no SDK 57 (`inExpoGo: true`), então **não precisa de development build**. Alternativas (WebGL via `expo-gl`, CanvasKit no web) exigiriam atlas de glifos ou carregamento extra — mais complexas. |
| Fonte bold na GPU | `matchFont({ fontFamily: 'System', fontWeight: '900' })` | Skia resolve uma fonte **bold do sistema** pelo font manager do SO, **sem precisar empacotar um arquivo `.ttf`**. Mantém a exigência de "fonte bold" sem adicionar assets. |
| Compartilhar a simulação | Módulo `simulation.ts` + hook `useMatrix` usados por CPU e GPU | Isola a diferença no **rendering**. Assim a comparação CPU vs GPU é justa: mesma lógica de JS, só muda o desenho. |
| Desenho na GPU | Um único `<Canvas>` do Skia com nós `<Text>` apenas para células visíveis | Skia pinta os glifos **na GPU**; ao contrário da CPU, não criamos uma grade inteira de views nativas (pulamos células vazias). |
| Toggle | `Pressable` sobreposto (HUD) alternando `mode: 'cpu' \| 'gpu'` | Simples e visível em cima do efeito. |
| Medição | FPS medido no próprio loop (`1000 / dt`) | Permite comparar numericamente: se o render bloqueia o JS thread, os ticks atrasam e o FPS cai. |
| Web | GPU desabilitada no web (`Platform.OS !== 'web'`) | Skia no web exige carregar o CanvasKit (`LoadSkiaWeb`), o que foge do escopo "simples". No web o botão fica desabilitado e cai para CPU. |

Estrutura nova (fora de `src/app/`, conforme o `AGENTS.md`):

```
src/components/matrix/
├── simulation.ts     # lógica compartilhada (aleatoriedade, decay, cores)
├── use-matrix.ts     # loop de ticks (setInterval) + medição de FPS
├── matrix-cpu.tsx    # renderizador CPU (Views/Text nativos)
├── matrix-gpu.tsx    # renderizador GPU (Canvas Skia)
└── matrix-rain.tsx   # HUD + botão de alternância
```

### Actions Performed

1. Reli o `context.md` (restrições 1 e 3) e confirmei a exigência de documentar a comparação.
2. Consultei a documentação (regra do `AGENTS.md`):
   - `https://docs.expo.dev/versions/v57.0.0/sdk/skia/` → confirma Skia **incluso no Expo Go** no SDK 57.
   - Inspecionei os **tipos TypeScript** do pacote instalado (`lib/typescript/.../skia/core/Font.d.ts`)
     para confirmar a API correta: `matchFont(inputStyle, fontMgr)`, `Skia.FontMgr.System()`,
     `<Canvas>`, `<Text font x y text color>` e `<Glyphs>`.
3. Instalei a dependência com o comando recomendado: `npx expo install @shopify/react-native-skia`
   (resolveu a versão compatível **2.6.2**).
4. Refatorei o `src/app/index.tsx` (que antes tinha toda a lógica) extraindo a simulação e o
   renderizador CPU para `src/components/matrix/`.
5. Implementei `matrix-gpu.tsx` com um `<Canvas>` do Skia.
6. Implementei `matrix-rain.tsx` com o **botão** que alterna CPU ↔ GPU e o medidor de **fps**.
7. Rodei apenas comandos de teste: `npx tsc --noEmit` e `npx expo lint`.

### Result

- O app continua abrindo no Matrix Rain, agora com um **botão no canto superior direito**
  mostrando o modo atual e o FPS (`CPU · N fps` / `GPU · N fps`); ao tocar, alterna entre
  **CPU (Views/Text nativos)** e **GPU (Canvas Skia)**.
- A lógica de animação é **idêntica** nas duas versões; só muda o renderizador, o que torna a
  comparação de performance significativa.
- Personagens, cores, velocidades continuam **aleatórios** (restrição 3).
- `npx tsc --noEmit`: **exit 0** (sem erros).
- `npx expo lint`: **nenhum problema nos arquivos novos**.

### Problems / Errors

1. **Documentação do Skia desatualizada/404.**
   URLs como `https://shopify.github.io/react-native-skia/docs/text/fonts` retornaram **404**.
   Não deu para confiar na memória nem nos links antigos.

2. **Dúvida sobre a fonte (arquivo `.ttf`).**
   O `useFont` do Skia exige um arquivo de fonte (`require('./arial.ttf')`), e o projeto **não tem
   nenhum `.ttf`** em `assets/`. Usar `useFont` exigiria baixar/empacotar um asset.

3. **Skia no web.**
   No web o `FontMgr.System()` usa um `TypefaceFontProvider` vazio (precisa do CanvasKit via
   `LoadSkiaWeb`). Chamar `matchFont` no web poderia falhar/renderizar nada.

4. **Regra de lint pré-existente do template.**
   `src/hooks/use-color-scheme.web.ts:11` → `react-hooks/set-state-in-effect` (não é do meu código).

### Fixes Attempted

1. Em vez de confiar nas URLs quebradas, inspecionei os **arquivos de tipos do próprio pacote
   instalado** (`node_modules/@shopify/react-native-skia/lib/typescript/...`), que são a fonte
   autoritativa da versão 2.6.2. Confirmei a assinatura de `matchFont` e dos componentes.

2. Descartei o `useFont` (que exigiria asset) e usei **`matchFont({ fontFamily: 'System',
   fontWeight: '900' })`**, que resolve uma fonte **bold do sistema** sem precisar de `.ttf`.
   Isso também mantém o bundle sem assets novos.

3. Desabilitei o modo GPU no web (`GPU_AVAILABLE = Platform.OS !== 'web'`): no web o botão fica
   inativo e a tela continua em CPU. Registrado aqui como limitação conhecida.

4. O erro de lint do item 4 é do template e **não foi alterado** (fora do escopo).

### Notes / Comparação CPU vs GPU (o que observar)

- **CPU**: cada caractere é um `<Text>` nativo e a **grade inteira** (inclusive células vazias) é
  re-layoutada e repintada pela view system a cada tick. O gargalo é o **JS thread + reconciliação
  de centenas de views nativas** por frame.
- **GPU**: existe **um único canvas**; o Skia desenha os glifos **na GPU** e o código só cria nós
  para as células **visíveis** (pula as vazias). Tende a manter o FPS mais estável, principalmente
  conforme a tela/quantidade de colunas aumenta.
- O botão mostra o **FPS medido** em cada modo: como o loop mede o atraso real dos ticks, um FPS
  mais baixo no modo CPU evidencia o custo de layout/paint da view system.
- Fatores comuns aos dois modos (e que limitam o teto de FPS): a simulação JS roda no mesmo
  `setInterval`, então o `TICK_MS` (90 ms ≈ 11 fps) é o teto de projeto; o objetivo aqui é medir
  **quanto cada renderizador consegue acompanhar**.
- Tuning no topo de `simulation.ts`: `FONT_SIZE`, `CELL_H`, `CELL_W`, `TICK_MS`, `TRAIL`, `DECAY`.
- Como o Skia vem incluso no Expo Go no SDK 57, dá para testar visualmente com `npx expo start`
  (sem development build). Nesta sessão rodei apenas `tsc` e `expo lint`.

---

## Entrada 3 — Correção: modo GPU ficava com a tela preta

### Prompt / Request

> "a versao por gpu fica preto a tela"

### Decision Summary

A tela preta no modo GPU foi causada pela **fonte**: o código usava
`matchFont({ fontFamily: 'System', ... })`. `"System"` **não é uma família de fonte válida** —
a documentação (v2) do Skia recomenda `Platform.select({ ios: "Helvetica", default: "serif" })`,
e a lista de famílias do Android é `["sans-serif", "arial", "helvetica", "serif", ...]`
(não existe `"System"`). No Android, `matchFamilyStyle("System")` retorna um **typeface nulo**;
com isso o Skia cria um `SkFont` sem typeface e **nenhum glifo é desenhado** → canvas vazio sobre
fundo preto. (No iOS o `"System"` é traduzido para `.AppleSystemUIFont`, por isso lá funcionaria.)

Decisão da correção:

| Item | Antes | Depois |
|---|---|---|
| Família da fonte | `'System'` | `Platform.select({ ios: 'Helvetica', default: 'sans-serif' })` |
| Garantia de fonte | nenhuma | fallback para uma fonte **bold empacotada** (`DejaVuSansMono-Bold.ttf`) se o sistema não casar |
| Verificação | nenhuma | checagem `font.getGlyphIDs('アA1')[0] !== 0` (se não tem glifos, usa o fallback) |
| Falhas do canvas | tela preta | `GpuBoundary` (error boundary) cai para **CPU** e mostra "GPU failed, using CPU" |

### Actions Performed

1. Investiguei as causas possíveis:
   - Parser de cor: o Skia **suporta `hsl()`** (confirmei em `cpp/api/third_party/CSSColorParser.cpp`
     e no `JsiSkColor.js` do web) → **não** era a cor.
   - Componentes `<Canvas>`/`<Text>`: confirmei a API nos tipos do pacote 2.6.2.
   - Fonte: inspecionei `cpp/api/JsiSkFontMgr.h` (`matchFamilyStyle`) e
     `apple/RNSkApplePlatformContext.mm` (`resolveFontFamily`), que só traduz `"System"` no iOS.
2. Consultei a documentação oficial (v2) do Skia: `.../v2/docs/text/text` → recomenda
   `Platform.select({ ios: "Helvetica", default: "serif" })` e mostra as famílias do Android.
3. Copiei uma fonte **bold** do sistema (`/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf`)
   para `assets/fonts/` como rede de segurança.
4. Reescrevi `matrix-gpu.tsx` para: preferir a fonte de sistema (bold, com katakana) e cair para a
   fonte empacotada se `getGlyphIDs('アA1')[0] === 0` ou se `matchFont` lançar erro.
5. Aplainei os filhos do `<Canvas>` num único array de `<Text>` (sem arrays aninhados/`null`).
6. Adicionei `GpuBoundary` em `matrix-rain.tsx`: se o Skia lançar, volta para CPU em vez de tela preta.
7. Rodei apenas comandos de **teste**: `npx tsc --noEmit`, `npx expo lint` e a **validação do bundle**
   pelo dev server (`curl .../.expo/.virtual-metro-entry.bundle` → HTTP 200, sem erros de resolução).

### Result

- A causa raiz foi identificada: **família de fonte inválida (`"System"`) no Android**.
- Agora o modo GPU resolve uma fonte de sistema válida e bold, com fallback garantido.
- Se algo ainda falhar no Skia, o app **não fica preto**: cai para CPU e informa o motivo no botão.
- `npx tsc --noEmit`: **exit 0**.
- `npx expo lint`: **nenhum problema nos meus arquivos**.
- Bundle Android via Metro: **HTTP 200**, sem erros de resolução (a fonte é resolvida: 3 referências).

### Problems / Errors

1. **Tela preta no modo GPU** (o bug reportado).
2. **DejaVu Sans Mono não tem katakana** (charset vai até `3f0-45f`), então a fonte empacotada
   sozinha não desenharia os caracteres katakana usados pela chuva — motivo pelo qual ela é apenas
   **fallback** e a fonte de sistema (que tem katakana) é preferida.
3. **Download de fonte externa falhou** (o `curl` do Google Fonts retornou 404/14 bytes).
4. Documentação do Skia mudou de host: `shopify.github.io/...` → **404**; o host atual é
   `wcandillon.github.io/react-native-skia` (e existe a árvore `/v2/`).

### Fixes Attempted

1. Troquei `'System'` pela família de sistema correta e adicionei verificação de glifos.
2. Empacotei uma fonte bold local (DejaVu) como fallback, já que não há fonte de sistema garantida.
3. Aplainei os filhos do Canvas (evita qualquer problema com arrays aninhados/`null`).
4. Adicionei o `GpuBoundary` para nunca deixar a tela preta silenciosamente.
5. Validei o bundle pelo dev server em vez de confiar só no `tsc`.

### Notes

- Se ainda aparecer preto em algum dispositivo, o botão deve mostrar "GPU failed, using CPU"
  (o que indicaria erro no Skia) ou continuar preto **sem** a chuva (indicaria canvas sem desenho).
- Possível causa conhecida upstream: em **simulador iOS com a New Architecture**, o Skia pode não
  desenhar (issue #2636). Em dispositivo físico/Expo Go normalmente funciona.
- A fonte empacotada fica em `assets/fonts/DejaVuSansMono-Bold.ttf` (licença permissiva).
