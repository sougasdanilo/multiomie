import { supabase } from '../src/config/supabase.js';

async function seed() {
  try {
    console.log('🌱 Iniciando seed do Supabase...');

    // Criar empresa de exemplo
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nome: 'Empresa Exemplo LTDA',
        cnpj: '12345678901234',
        nome_fantasia: 'Exemplo Empresarial',
        app_key: 'example-app-key',
        app_secret: 'example-app-secret',
        ativa: true,
        configuracoes: {
          timezone: 'America/Sao_Paulo',
          moeda: 'BRL'
        }
      })
      .select()
      .single();

    if (empresaError) throw empresaError;
    console.log('✅ Empresa criada:', empresa.nome);

    // Criar cliente de exemplo
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        nome: 'Cliente Exemplo',
        cpf_cnpj: '98765432100',
        email: 'cliente@exemplo.com',
        telefone: '11999999999',
        endereco: {
          cep: '01310-100',
          rua: 'Av Paulista',
          numero: '1000',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        tipo_contribuinte: '9'
      })
      .select()
      .single();

    if (clienteError) throw clienteError;
    console.log('✅ Cliente criado:', cliente.nome);

    // Associar cliente à empresa
    const { error: clienteEmpresaError } = await supabase
      .from('cliente_empresa')
      .insert({
        cliente_id: cliente.id,
        empresa_id: empresa.id,
        codigo_omie: 'CLI001',
        sync_status: 'SYNCED'
      });

    if (clienteEmpresaError) throw clienteEmpresaError;
    console.log('✅ Cliente associado à empresa');

    // Criar produto de exemplo
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .insert({
        codigo: 'PROD001',
        descricao: 'Produto de Exemplo',
        descricao_complementar: 'Descrição complementar do produto',
        ncm: '84733041',
        cest: '0000000',
        cfop: '5102',
        unidade: 'UN',
        preco_base: 100.50,
        tipo: 'PRODUTO',
        ativo: true
      })
      .select()
      .single();

    if (produtoError) throw produtoError;
    console.log('✅ Produto criado:', produto.descricao);

    // Associar produto à empresa
    const { error: produtoEmpresaError } = await supabase
      .from('produto_empresa')
      .insert({
        produto_id: produto.id,
        empresa_id: empresa.id,
        codigo_omie: 'PROD001',
        estoque_minimo: 10,
        estoque_atual: 50,
        estoque_reservado: 5,
        preco_venda: 150.00,
        config_fiscal: {
          icms: {
            origem: '0',
            cst: '00'
          },
          pis: {
            cst: '01'
          },
          cofins: {
            cst: '01'
          }
        }
      });

    if (produtoEmpresaError) throw produtoEmpresaError;
    console.log('✅ Produto associado à empresa');

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

seed();
