/**
 * Serviço de envio de emails via SendGrid
 *
 * Usado para alertas de obrigações regulatórias,
 * notificações de vencimento e comunicados do sistema.
 */

import sgMail from '@sendgrid/mail'

interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName: string
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

let initialized = false

export function initEmailService(config: EmailConfig) {
  sgMail.setApiKey(config.apiKey)
  initialized = true
  console.log('📧 SendGrid configurado')
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!initialized) {
    console.warn('⚠️ SendGrid não configurado. Email não enviado.')
    return false
  }

  try {
    await sgMail.send({
      to: params.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'alertas@regtelecom.com.br',
        name: process.env.SENDGRID_FROM_NAME || 'RegTelecom',
      },
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
    })
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return false
  }
}

// ============================================
// TEMPLATES DE EMAIL - ALERTAS REGULATÓRIOS
// ============================================

export function buildObligationAlertEmail(params: {
  nomeISP: string
  obrigacao: string
  dataLimite: string
  diasRestantes: number
  descricao: string
  appUrl: string
}): { subject: string; html: string } {
  const urgencyColor =
    params.diasRestantes <= 3 ? '#dc2626' :
    params.diasRestantes <= 7 ? '#f59e0b' :
    params.diasRestantes <= 15 ? '#3b82f6' : '#10b981'

  const urgencyLabel =
    params.diasRestantes <= 3 ? 'URGENTE' :
    params.diasRestantes <= 7 ? 'ATENÇÃO' :
    'LEMBRETE'

  return {
    subject: `[${urgencyLabel}] ${params.obrigacao} vence em ${params.diasRestantes} dia(s) — RegTelecom`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0ea5e9; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">📋 RegTelecom</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">Alerta de Obrigação Regulatória</p>
  </div>

  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Olá, <strong>${params.nomeISP}</strong>,</p>

    <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-weight: bold; color: ${urgencyColor};">${urgencyLabel}: ${params.diasRestantes} dia(s) restante(s)</p>
      <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold;">${params.obrigacao}</p>
      <p style="margin: 4px 0 0; color: #6b7280;">Prazo: ${params.dataLimite}</p>
    </div>

    <p style="color: #4b5563;">${params.descricao}</p>

    <a href="${params.appUrl}/calendar" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
      Ver no RegTelecom
    </a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af;">
      Este alerta foi enviado automaticamente pelo RegTelecom.<br>
      Para configurar suas preferências de alertas, acesse <a href="${params.appUrl}/settings">Configurações</a>.
    </p>
  </div>
</body>
</html>`,
  }
}

export function buildContributionReminderEmail(params: {
  nomeISP: string
  tipo: 'FUST' | 'FUNTTEL'
  periodo: string
  valorDevido: number
  dataLimite: string
  diasRestantes: number
  appUrl: string
}): { subject: string; html: string } {
  return {
    subject: `[LEMBRETE] ${params.tipo} de ${params.periodo} — R$ ${params.valorDevido.toFixed(2)} — RegTelecom`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">💰 RegTelecom</h1>
    <p style="margin: 5px 0 0; opacity: 0.9;">Lembrete de Contribuição</p>
  </div>

  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Olá, <strong>${params.nomeISP}</strong>,</p>

    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">${params.tipo} — ${params.periodo}</p>
      <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #059669;">R$ ${params.valorDevido.toFixed(2)}</p>
      <p style="margin: 4px 0 0; color: #6b7280;">Vencimento: ${params.dataLimite} (${params.diasRestantes} dias)</p>
    </div>

    <a href="${params.appUrl}/fust-funttel" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Ver Detalhes
    </a>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
    <p style="font-size: 12px; color: #9ca3af;">
      Valores calculados automaticamente. Verifique com sua contabilidade antes do pagamento.
    </p>
  </div>
</body>
</html>`,
  }
}
