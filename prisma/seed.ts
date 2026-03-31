import { prisma } from '../src/config/database';
import { encrypt } from '../src/utils/encryption';

async function seed() {
  console.log('🌱 Iniciando seed...\n');

  try {
    // Cria empresas de exemplo (não vinculadas ao Omie - apenas para teste)
    console.log('Criando empresas de exemplo...');
    
    const empresa1 = await prisma.empresa.upsert({
      where: { cnpj: '12345678000195' },
      update: {},
      create: {
        nome: 'Empresa Matriz LTDA',
        cnpj: '12345678000195',
        nome_fantasia: 'Matriz',
        app_key: 'APP_KEY_EXEMPLO_1',
        app_secret: encrypt('APP_SECRET_EXEMPLO_1'),
        ativa: true,
        configuracoes: {
          faturamentoPadrao: 'NF-e',
          condicaoPagamentoPadrao: '30 dias'
        }
      }
    });

    const empresa2 = await prisma.empresa.upsert({
      where: { cnpj: '98765432000196' },
      update: {},
      create: {
        nome: 'Filial Sul LTDA',
        cnpj: '98765432000196',
        nome_fantasia: 'Filial Sul',
        app_key: 'APP_KEY_EXEMPLO_2',
        app_secret: encrypt('APP_SECRET_EXEMPLO_2'),
        ativa: true,
        configuracoes: {
          faturamentoPadrao: 'NF-e',
          condicaoPagamentoPadrao: '15 dias'
        }
      }
    });

    console.log(`✅ Empresas criadas: ${empresa1.nome}, ${empresa2.nome}\n`);

    // Cria clientes de exemplo
    console.log('Criando clientes de exemplo...');
    
    const cliente1 = await prisma.cliente.upsert({
      where: { cpf_cnpj: '11122233344' },
      update: {},
      create: {
        nome: 'João Silva',
        cpf_cnpj: '11122233344',
        email: 'joao.silva@email.com',
        telefone: '11999998888',
        celular: '11988887777',
        endereco: {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01001000'
        },
        tipo_contribuinte: '9'
      }
    });

    const cliente2 = await prisma.cliente.upsert({
      where: { cpf_cnpj: '55566677788' },
      update: {},
      create: {
        nome: 'Maria Santos',
        cpf_cnpj: '55566677788',
        email: 'maria.santos@email.com',
        telefone: '11977776666',
        endereco: {
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 100',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01310000'
        },
        tipo_contribuinte: '9'
      }
    });

    const cliente3 = await prisma.cliente.upsert({
      where: { cpf_cnpj: '11222333000181' },
      update: {},
      create: {
        nome: 'Empresa Cliente LTDA',
        cpf_cnpj: '11222333000181',
        email: 'contato@empresacliente.com',
        telefone: '1133334444',
        ie: '123456789',
        tipo_contribuinte: '1',
        endereco: {
          logradouro: 'Rua Comercial',
          numero: '500',
          bairro: 'Industrial',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '04500000'
        }
      }
    });

    console.log(`✅ Clientes criados: ${cliente1.nome}, ${cliente2.nome}, ${cliente3.nome}\n`);

    // Cria vínculos cliente-empresa
    console.log('Criando vínculos cliente-empresa...');
    
    await prisma.clienteEmpresa.upsert({
      where: {
        cliente_id_empresa_id: {
          cliente_id: cliente1.id,
          empresa_id: empresa1.id
        }
      },
      update: {},
      create: {
        cliente_id: cliente1.id,
        empresa_id: empresa1.id,
        codigo_omie: '12345',
        sync_status: 'SYNCED'
      }
    });

    await prisma.clienteEmpresa.upsert({
      where: {
        cliente_id_empresa_id: {
          cliente_id: cliente2.id,
          empresa_id: empresa1.id
        }
      },
      update: {},
      create: {
        cliente_id: cliente2.id,
        empresa_id: empresa1.id,
        codigo_omie: '12346',
        sync_status: 'SYNCED'
      }
    });

    await prisma.clienteEmpresa.upsert({
      where: {
        cliente_id_empresa_id: {
          cliente_id: cliente3.id,
          empresa_id: empresa2.id
        }
      },
      update: {},
      create: {
        cliente_id: cliente3.id,
        empresa_id: empresa2.id,
        codigo_omie: '20001',
        sync_status: 'SYNCED'
      }
    });

    console.log('✅ Vínculos cliente-empresa criados\n');

    // Cria produtos de exemplo
    console.log('Criando produtos de exemplo...');
    
    const produto1 = await prisma.produto.upsert({
      where: { codigo: 'PROD001' },
      update: {},
      create: {
        codigo: 'PROD001',
        descricao: 'Notebook Dell Inspiron',
        descricao_complementar: 'Notebook Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD',
        ncm: '84713012',
        unidade: 'UN',
        preco_base: 3500.00,
        tipo: 'PRODUTO',
        ativo: true
      }
    });

    const produto2 = await prisma.produto.upsert({
      where: { codigo: 'PROD002' },
      update: {},
      create: {
        codigo: 'PROD002',
        descricao: 'Mouse Logitech Wireless',
        ncm: '84716052',
        unidade: 'UN',
        preco_base: 120.00,
        tipo: 'PRODUTO',
        ativo: true
      }
    });

    const produto3 = await prisma.produto.upsert({
      where: { codigo: 'PROD003' },
      update: {},
      create: {
        codigo: 'PROD003',
        descricao: 'Teclado Mecânico Gamer',
        ncm: '84716019',
        unidade: 'UN',
        preco_base: 450.00,
        tipo: 'PRODUTO',
        ativo: true
      }
    });

    const produto4 = await prisma.produto.upsert({
      where: { codigo: 'SERV001' },
      update: {},
      create: {
        codigo: 'SERV001',
        descricao: 'Instalação de Software',
        ncm: '00000000',
        unidade: 'HR',
        preco_base: 150.00,
        tipo: 'SERVICO',
        ativo: true
      }
    });

    console.log(`✅ Produtos criados: ${produto1.descricao}, ${produto2.descricao}, ${produto3.descricao}, ${produto4.descricao}\n`);

    // Cria vínculos produto-empresa
    console.log('Criando vínculos produto-empresa...');
    
    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto1.id,
          empresa_id: empresa1.id
        }
      },
      update: {},
      create: {
        produto_id: produto1.id,
        empresa_id: empresa1.id,
        codigo_omie: '1001',
        estoque_atual: 50,
        estoque_minimo: 10,
        preco_venda: 3500.00
      }
    });

    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto2.id,
          empresa_id: empresa1.id
        }
      },
      update: {},
      create: {
        produto_id: produto2.id,
        empresa_id: empresa1.id,
        codigo_omie: '1002',
        estoque_atual: 200,
        estoque_minimo: 50,
        preco_venda: 120.00
      }
    });

    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto3.id,
          empresa_id: empresa2.id
        }
      },
      update: {},
      create: {
        produto_id: produto3.id,
        empresa_id: empresa2.id,
        codigo_omie: '2003',
        estoque_atual: 30,
        estoque_minimo: 5,
        preco_venda: 450.00
      }
    });

    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto4.id,
          empresa_id: empresa1.id
        }
      },
      update: {},
      create: {
        produto_id: produto4.id,
        empresa_id: empresa1.id,
        codigo_omie: '1004',
        preco_venda: 150.00
      }
    });

    await prisma.produtoEmpresa.upsert({
      where: {
        produto_id_empresa_id: {
          produto_id: produto4.id,
          empresa_id: empresa2.id
        }
      },
      update: {},
      create: {
        produto_id: produto4.id,
        empresa_id: empresa2.id,
        codigo_omie: '2004',
        preco_venda: 180.00
      }
    });

    console.log('✅ Vínculos produto-empresa criados\n');

    // Cria pedido de exemplo
    console.log('Criando pedido de exemplo...');
    
    const pedido = await prisma.pedido.create({
      data: {
        numero: '000001',
        cliente_id: cliente1.id,
        status: 'RASCUNHO',
        valor_produtos: 3620.00,
        valor_desconto: 0,
        valor_frete: 0,
        valor_total: 3620.00,
        forma_pagamento: 'boleto_30_dd',
        observacoes: 'Pedido de teste - exemplo',
        itens: {
          create: [
            {
              produto_id: produto1.id,
              empresa_id: empresa1.id,
              quantidade: 1,
              preco_unitario: 3500.00,
              valor_total: 3500.00,
              percentual_desconto: 0,
              valor_desconto: 0,
              sequencia: 1
            },
            {
              produto_id: produto2.id,
              empresa_id: empresa1.id,
              quantidade: 1,
              preco_unitario: 120.00,
              valor_total: 120.00,
              percentual_desconto: 0,
              valor_desconto: 0,
              sequencia: 2
            }
          ]
        }
      }
    });

    console.log(`✅ Pedido criado: ${pedido.numero} - Total: R$ ${pedido.valor_total}\n`);

    console.log('✨ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('  - 2 Empresas');
    console.log('  - 3 Clientes');
    console.log('  - 4 Produtos');
    console.log('  - 1 Pedido (Rascunho)');
    console.log('\n⚠️  Nota: As empresas criadas usam app_key e app_secret fictícios.');
    console.log('   Para testar com a API real do Omie, atualize as credenciais.');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
