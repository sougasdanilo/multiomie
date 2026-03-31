import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'

import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Empresas } from './pages/Empresas'
import { EmpresaDetail } from './pages/EmpresaDetail'
import { Clientes } from './pages/Clientes'
import { ClienteDetail } from './pages/ClienteDetail'
import { Produtos } from './pages/Produtos'
import { ProdutoDetail } from './pages/ProdutoDetail'
import { Pedidos } from './pages/Pedidos'
import { PedidoDetail } from './pages/PedidoDetail'
import { NovoPedido } from './pages/NovoPedido'
import { NotasFiscais } from './pages/NotasFiscais'
import { NotaFiscalDetail } from './pages/NotaFiscalDetail'
import { Configuracoes } from './pages/Configuracoes'
import { Perfil } from './pages/Perfil'

function App() {
  const { checkAuth } = useAuthStore()
  const { loadEmpresas } = useAppStore()

  useEffect(() => {
    checkAuth()
    loadEmpresas()
  }, [checkAuth, loadEmpresas])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="empresas" element={<Empresas />} />
        <Route path="empresas/:id" element={<EmpresaDetail />} />
        <Route path="empresas/nova" element={<EmpresaDetail />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetail />} />
        <Route path="clientes/novo" element={<ClienteDetail />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="produtos/:id" element={<ProdutoDetail />} />
        <Route path="produtos/novo" element={<ProdutoDetail />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetail />} />
        <Route path="pedidos/novo" element={<NovoPedido />} />
        <Route path="notas-fiscais" element={<NotasFiscais />} />
        <Route path="notas-fiscais/:id" element={<NotaFiscalDetail />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
