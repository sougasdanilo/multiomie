import { OmieIntegrationService } from '../integrations/OmieServices.js';
import { sql } from '../config/database.js';
export class WebhookController {
    omieIntegration;
    constructor() {
        this.omieIntegration = new OmieIntegrationService();
    }
    async handleNfeEmitida(req, res) {
        try {
            const { app_key, topic, payload } = req.body;
            console.log(`Webhook NF-e: ${topic}`, { app_key });
            const empresa = await this.omieIntegration.getEmpresaByAppKey(app_key);
            if (!empresa) {
                res.status(200).json({ message: 'ignored' });
                return;
            }
            const nfeData = payload;
            const pedidoEmpresa = await sql `
        SELECT * FROM pedido_empresa 
        WHERE empresa_id = ${empresa.id} 
        AND numero_pedido_omie = ${nfeData.idPedido}
        LIMIT 1
      `;
            if (!pedidoEmpresa.length) {
                res.status(200).json({ message: 'ignored' });
                return;
            }
            const existingNfe = await sql `
        SELECT id FROM notas_fiscais 
        WHERE chave_acesso = ${nfeData.chaveNFe}
        LIMIT 1
      `;
            if (existingNfe.length === 0) {
                await sql `
          INSERT INTO notas_fiscais (
            pedido_id, empresa_id, numero, serie, chave_acesso, 
            protocolo, data_emissao, data_saida, valor_produtos, 
            valor_desconto, valor_total, xml_url, pdf_url, status, dados_omie
          ) VALUES (
            ${pedidoEmpresa[0].pedido_id}, ${empresa.id}, ${nfeData.numero}, 
            ${nfeData.serie}, ${nfeData.chaveNFe}, ${nfeData.protocolo},
            ${new Date(nfeData.dataEmissao)}, 
            ${nfeData.dataSaida ? new Date(nfeData.dataSaida) : null},
            ${nfeData.valorProdutos || 0}, ${nfeData.valorDesconto || 0}, 
            ${nfeData.valorTotal || 0}, ${nfeData.urlXML}, ${nfeData.urlDANFE},
            'EMITIDA', ${nfeData}
          )
        `;
            }
            else {
                await sql `
          UPDATE notas_fiscais SET 
            protocolo = ${nfeData.protocolo},
            xml_url = ${nfeData.urlXML},
            pdf_url = ${nfeData.urlDANFE},
            dados_omie = ${nfeData}
          WHERE chave_acesso = ${nfeData.chaveNFe}
        `;
            }
            await sql `
        UPDATE pedido_empresa 
        SET status_omie = 'FATURADO'
        WHERE id = ${pedidoEmpresa[0].id}
      `;
            await this.verificarConclusaoFaturamento(pedidoEmpresa[0].pedido_id);
            res.status(200).json({ message: 'processed' });
        }
        catch (error) {
            console.error('Erro no webhook NF-e:', error);
            res.status(500).json({ error: error.message });
        }
    }
    async handlePedidoFaturado(req, res) {
        try {
            const { app_key, payload } = req.body;
            const empresa = await this.omieIntegration.getEmpresaByAppKey(app_key);
            if (!empresa) {
                res.status(200).json({ message: 'ignored' });
                return;
            }
            const pedidoData = payload;
            const pedidoEmpresa = await sql `
        SELECT * FROM pedido_empresa 
        WHERE empresa_id = ${empresa.id} 
        AND codigo_pedido_omie = ${pedidoData.codigoPedido}
        LIMIT 1
      `;
            if (!pedidoEmpresa.length) {
                res.status(200).json({ message: 'ignored' });
                return;
            }
            await sql `
        UPDATE pedido_empresa 
        SET status_omie = 'FATURADO', resposta_omie = ${pedidoData}
        WHERE id = ${pedidoEmpresa[0].id}
      `;
            await this.verificarConclusaoFaturamento(pedidoEmpresa[0].pedido_id);
            res.status(200).json({ message: 'processed' });
        }
        catch (error) {
            console.error('Erro no webhook Pedido:', error);
            res.status(500).json({ error: error.message });
        }
    }
    async verificarConclusaoFaturamento(pedidoId) {
        const pedidoEmpresas = await sql `
      SELECT * FROM pedido_empresa 
      WHERE pedido_id = ${pedidoId}
    `;
        const todasFaturadas = pedidoEmpresas.every((pe) => pe.status_omie === 'FATURADO');
        if (todasFaturadas) {
            await sql `
        UPDATE pedidos 
        SET status = 'CONCLUIDO', faturado_at = NOW()
        WHERE id = ${pedidoId}
      `;
        }
    }
}
//# sourceMappingURL=WebhookController.js.map