const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Clientes
  clientes: {
    listar:  ()      => ipcRenderer.invoke('clientes:listar'),
    buscar:  (id)    => ipcRenderer.invoke('clientes:buscar', id),
    salvar:  (dados) => ipcRenderer.invoke('clientes:salvar', dados),
    excluir: (id)    => ipcRenderer.invoke('clientes:excluir', id),
  },
  // Procedimentos
  procedimentos: {
    listar:  ()      => ipcRenderer.invoke('procedimentos:listar'),
    todos:   ()      => ipcRenderer.invoke('procedimentos:todos'),
    salvar:  (dados) => ipcRenderer.invoke('procedimentos:salvar', dados),
    excluir: (id)    => ipcRenderer.invoke('procedimentos:excluir', id),
  },
  // Agendamentos
  agendamentos: {
    listar:  (filtro) => ipcRenderer.invoke('agendamentos:listar', filtro),
    buscar:  (id)     => ipcRenderer.invoke('agendamentos:buscar', id),
    salvar:  (dados)  => ipcRenderer.invoke('agendamentos:salvar', dados),
    excluir: (id)     => ipcRenderer.invoke('agendamentos:excluir', id),
    status:  (dados)  => ipcRenderer.invoke('agendamentos:status', dados),
  },
  // Financeiro
  financeiro: {
    resumo:    (filtro) => ipcRenderer.invoke('financeiro:resumo', filtro),
    detalhado: (filtro) => ipcRenderer.invoke('financeiro:detalhado', filtro),
  },
  // Relatório/impressão
  relatorio: {
    abrir: (html) => ipcRenderer.invoke('relatorio:abrir', html),
  },
  clienteProc: {
    getInteresse:    (id) => ipcRenderer.invoke('cliente:getProcInteresse', id),
    salvarInteresse: (p)  => ipcRenderer.invoke('cliente:salvarProcInteresse', p),
  },
  variantes: {
    listar:  (procId) => ipcRenderer.invoke('variantes:listar', procId),
    salvar:  (d)      => ipcRenderer.invoke('variantes:salvar', d),
    excluir: (id)     => ipcRenderer.invoke('variantes:excluir', id),
  },
  clienteVariantes: {
    getInteresse:    (id) => ipcRenderer.invoke('cliente:getVariantesInteresse', id),
    salvarInteresse: (p)  => ipcRenderer.invoke('cliente:salvarVariantesInteresse', p),
  },
    promocoes: {
    listar:    ()      => ipcRenderer.invoke('promocoes:listar'),
    buscar:    (id)    => ipcRenderer.invoke('promocoes:buscar', id),
    salvar:    (dados) => ipcRenderer.invoke('promocoes:salvar', dados),
    excluir:   (id)    => ipcRenderer.invoke('promocoes:excluir', id),
    calcular:  (dados) => ipcRenderer.invoke('promocoes:calcular', dados),
  },
});