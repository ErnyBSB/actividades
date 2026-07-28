/* =========================================================
   REDE — acesso à pasta compartilhada \\COBIB\AmbienteTrabalho\unidadeCentral
   via File System Access API (Chrome e Edge).

   Estrutura esperada dentro de unidadeCentral:
     <UNIDADE>/lancamentos/<servidor>.json   (cada servidor grava só o seu)
     <UNIDADE>/aprovacoes.json               (só a chefia da unidade grava)

   Padrão "um arquivo, um único escritor": não há escrita concorrente
   no mesmo arquivo, portanto não há conflito entre máquinas.
   ========================================================= */
"use strict";

/* ---------- IndexedDB: guarda o handle da pasta entre sessões ---------- */
function _idb() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open("ra-rede", 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore("handles");
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function salvarHandleRaiz(handle) {
  const db = await _idb();
  await new Promise((res, rej) => {
    const tx = db.transaction("handles", "readwrite");
    tx.objectStore("handles").put(handle, "raiz");
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function obterHandleRaiz() {
  const db = await _idb();
  return new Promise((res) => {
    const rq = db.transaction("handles").objectStore("handles").get("raiz");
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => res(null);
  });
}

/* ---------- Permissões ---------- */
async function garantirPermissao(handle, modo /* "read" | "readwrite" */, pedir = true) {
  const opts = { mode: modo };
  if (await handle.queryPermission(opts) === "granted") return true;
  if (!pedir) return false;
  return (await handle.requestPermission(opts)) === "granted";
}

/* ---------- Utilitários de arquivo ---------- */
function slug(nome) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
             .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
async function lerJSONDe(dir, nomeArquivo) {
  try {
    const fh = await dir.getFileHandle(nomeArquivo);
    const texto = await (await fh.getFile()).text();
    return texto.trim() ? JSON.parse(texto) : null;
  } catch { return null; }
}
async function gravarJSONEm(dir, nomeArquivo, obj) {
  const fh = await dir.getFileHandle(nomeArquivo, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(obj, null, 2));
  await w.close();
}
async function pastaUnidade(raiz, unidade, criar = false) {
  return raiz.getDirectoryHandle(unidade, { create: criar });
}
async function pastaLancamentos(raiz, unidade, criar = false) {
  const u = await pastaUnidade(raiz, unidade, criar);
  return u.getDirectoryHandle("lancamentos", { create: criar });
}

/* ---------- Leituras de alto nível ---------- */
/* Lançamentos de um servidor: {registros:[...]} ou vazio */
async function lerMeuArquivo(raiz, unidade, servidor) {
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    return await lerJSONDe(dir, slug(servidor) + ".json");
  } catch { return null; }
}
async function gravarMeuArquivo(raiz, unidade, servidor, registros) {
  const dir = await pastaLancamentos(raiz, unidade, true);
  await gravarJSONEm(dir, slug(servidor) + ".json", {
    versao: 1, unidade, servidor,
    atualizadoEm: new Date().toISOString(),
    registros
  });
}
/* Todos os lançamentos de uma unidade (lista concatenada) */
async function lerLancamentosDaUnidade(raiz, unidade) {
  const registros = [];
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    for await (const [nome, handle] of dir.entries()) {
      if (handle.kind !== "file" || !nome.endsWith(".json")) continue;
      try {
        const dado = JSON.parse(await (await handle.getFile()).text());
        if (dado && Array.isArray(dado.registros)) registros.push(...dado.registros);
      } catch { /* arquivo malformado: ignora e segue */ }
    }
  } catch { /* unidade ainda sem pasta */ }
  return registros;
}
/* Aprovações da unidade: mapa {idLancamento: {por, em}} */
async function lerAprovacoes(raiz, unidade) {
  try {
    const dir = await pastaUnidade(raiz, unidade);
    const dado = await lerJSONDe(dir, "aprovacoes.json");
    return (dado && dado.aprovacoes) || {};
  } catch { return {}; }
}
async function gravarAprovacoes(raiz, unidade, aprovacoes, chefe) {
  const dir = await pastaUnidade(raiz, unidade, true);
  await gravarJSONEm(dir, "aprovacoes.json", {
    versao: 1, unidade, chefe,
    atualizadoEm: new Date().toISOString(),
    aprovacoes
  });
}
