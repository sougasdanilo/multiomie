import { Request, Response } from 'express';
import { OmieIntegrationService } from '../integrations/OmieServices';
import { prisma } from '../config/database';

export class WebhookController {
  private omieIntegration: OmieIntegrationService;

  constructor() {
    this.omieIntegration = new OmieIntegrationService();
  }

  async handleNfeEmitida(req: Request, res: Response): Promise<void> {
    try {
      const { app_key, topic, payload } = req.body;

      console.log(`Webhook NF-e: ${topic}`, { app_key });

      // Identifica empresa pelo app_key
      const empresa = await this.omieIntegration.getEmpresaByAppKey(app_key);
      if (!empresa) {
        res.status(200).json({ message: 'ignored' });
        return;
      }

      const nfeData = payload;

      // Busca pedido pelo número de referência
      const pedidoEmpresa = await prisma.pedidoEmpresa.findFirst({
        where: {
          empresa_id: empresa.id,
          numero_pedido_omie: nfeData.idPedido
        }
      });

      if (!pedidoEmpresa) {
        res.status(200).json({ message: 'ignored' });
        return;
      }

      // Atualiza ou cria NF-e
      await prisma.notaFiscal.upsert({
        where: { chave_acesso: nfeData.chaveNFe },
        create: {
          pedido_id: pedidoEmpresa.pedido_id,
          empresa_id: empresa.id,
          numero: nfeData.numero,
          serie: nfeData.serie,
          chave_acesso: nfeData.chaveNFe,
          protocolo: nfeData.protocolo,
          data_emissao: new Date(nfeData.dataEmissao),
          data_saida: nfeData.dataSaida ? new Date(nfeData.dataSaida) : null,
          valor_produtos: nfeData.valorProdutos || 0,
          valor_desconto: nfeData.valorDesconto || 0,
          valor_total: nfeData.valorTotal || 0,
          xml_url: nfeData.urlXML,
          pdf_url: nfeData.urlDANFE,
          status: 'EMITIDA',
          dados_omie: nfeData
        },
        update: {
          protocolo: nfeData.protocolo,
          xml_url: nfeData.urlXML,
          pdf_url: nfeData.urlDANFE,
          dados_omie: nfeData
        }
      });

      // Atualiza status do pedido_empresa
      await prisma.pedidoEmpresa.update({
        where: { id: pedidoEmpresa.id },
        data: { status_omie: 'FATURADO' }
      });

      // Verifica se todas as empresas faturaram
      await this.verificarConclusaoFaturamento(pedidoEmpresa.pedido_id);

      res.status(200).json({ message: 'processed' });
    } catch (error: any) {
      console.error('Erro no webhook NF-e:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handlePedidoFaturado(req: Request, res: Response): Promise<void> {
    try {
      const { app_key, payload } = req.body;

      const empresa = await this.omieIntegration.getEmpresaByAppKey(app_key);
      if (!empresa) {
        res.status(200).json({ message: 'ignored' });
        return;
      }

      const pedidoData = payload;

      const pedidoEmpresa = await prisma.pedidoEmpresa.findFirst({
        where: {
          empresa_id: empresa.id,
          codigo_pedido_omie: pedidoData.codigoPedido
        }
      });

      if (!pedidoEmpresa) {
        res.status(200).json({ message: 'ignored' });
        return;
      }

      // Atualiza status
      await prisma.pedidoEmpresa.update({
        where: { id: pedidoEmpresa.id },
        data: {
          status_omie: 'FATURADO',
          resposta_omie: pedidoData
        }
      });

      // Verifica conclusão
      await this.verificarConclusaoFaturamento(pedidoEmpresa.pedido_id);

      res.status(200).json({ message: 'processed' });
    } catch (error: any) {
      console.error('Erro no webhook Pedido:', error);
      res.status(500).json({ error: error.message });
    }
  }

  private async verificarConclusaoFaturamento(pedidoId: string): Promise<void> {
    const pedidoEmpresas = await prisma.pedidoEmpresa.findMany({
      where: { pedido_id: pedidoId }
    });

    const todasFaturadas = pedidoEmpresas.every(
      pe => pe.status_omie === 'FATURADO'
    );

    if (todasFaturadas) {
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          status: 'CONCLUIDO',
          faturado_at: new Date()
        }
      });
    }
  }
}
